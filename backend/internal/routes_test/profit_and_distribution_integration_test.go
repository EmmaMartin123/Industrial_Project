package routes_test

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/routes"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

func TestProfitDeclarationAndDistribution(t *testing.T) {
	if err := load_dot_env(); err != nil {
		t.Logf("Warning: failed to load .env: %v", err)
	}
	required := []string{
		"SUPABASE_URL",
		"SUPABASE_ANON_KEY",
		"SUPABASE_SERVICE_ROLE_KEY",
		"TEST_INVESTOR_EMAIL",
		"TEST_INVESTOR_PASSWORD",
		"TEST_BUSINESS_EMAIL",
		"TEST_BUSINESS_PASSWORD",
	}
	for _, key := range required {
		if os.Getenv(key) == "" {
			t.Skipf("Skipping: %s not set", key)
		}
	}
	if err := utils.InitJWTHS256(os.Getenv("SUPABASE_URL") + "/auth/v1"); err != nil {
		t.Fatalf("Failed to initialize JWT: %v", err)
	}
	// Login as business
	business_token, err := login_to_supabase(
		os.Getenv("TEST_BUSINESS_EMAIL"),
		os.Getenv("TEST_BUSINESS_PASSWORD"),
	)
	if err != nil {
		t.Fatalf("Failed to log in as business: %v", err)
	}
	business_id, err := utils.VerifyJWTHS256(business_token)
	if err != nil {
		t.Fatalf("Failed to extract business user ID: %v", err)
	}
	// Login as investor
	investor_token, err := login_to_supabase(
		os.Getenv("TEST_INVESTOR_EMAIL"),
		os.Getenv("TEST_INVESTOR_PASSWORD"),
	)
	if err != nil {
		t.Fatalf("Failed to log in as investor: %v", err)
	}
	investor_id, err := utils.VerifyJWTHS256(investor_token)
	if err != nil {
		t.Fatalf("Failed to extract investor user ID: %v", err)
	}
	// Fund investor for investment
	_, err = utils.UpdateByID("profile", investor_id, map[string]interface{}{"dashboard_balance": 5000})
	if err != nil {
		t.Fatalf("Failed to set investor balance: %v", err)
	}

	router := routes.SetupRouter()
	server := httptest.NewServer(router)
	defer server.Close()
	client := &http.Client{Timeout: 10 * time.Second}

	// === STEP 1: Business creates a pitch ===
	pitch_payload := map[string]interface{}{
		"title":                 "Profit Test Pitch",
		"elevator_pitch":        "Test pitch for profit distribution",
		"detailed_pitch":        "Detailed description",
		"target_amount":         10000,
		"investment_start_date": "2025-01-01",
		"investment_end_date":   "2025-12-31",
		"profit_share_percent":  20.0,
		"investment_tiers": []map[string]interface{}{
			{"name": "Basic", "min_amount": 100, "multiplier": 1.0},
			{"name": "Premium", "min_amount": 1000, "multiplier": 1.5},
		},
	}
	pitch_body, _ := json.Marshal(pitch_payload)
	resp, err := make_request(client, "POST", server.URL+"/api/pitch", pitch_body, business_token)
	if err != nil {
		t.Fatalf("Failed to create pitch: %v", err)
	}
	var created_pitch map[string]interface{}
	if err := decode_json_response(resp, &created_pitch); err != nil {
		t.Fatalf("Failed to decode created pitch: %v", err)
	}
	pitch_id := int64(created_pitch["id"].(float64))
	defer func() {
		delete_url := fmt.Sprintf("%s/api/pitch?id=%d", server.URL, pitch_id)
		make_request(client, "DELETE", delete_url, nil, business_token)
	}()

	// === STEP 2: Investor invests £1000 (Premium tier) ===
	investment_payload := map[string]interface{}{
		"pitch_id": pitch_id,
		"amount":   int64(1000),
	}
	investment_body, _ := json.Marshal(investment_payload)
	resp, err = make_request(client, "POST", server.URL+"/api/investment", investment_body, investor_token)
	if err != nil {
		t.Fatalf("Investment failed: %v", err)
	}
	var investment map[string]interface{}
	if err := decode_json_response(resp, &investment); err != nil {
		t.Fatalf("Failed to decode investment: %v", err)
	}
	investment_id := int64(investment["id"].(float64))

	// === STEP 3: Business declares profit (£10,000 total → £2,000 distributable) ===
	profit_payload := map[string]interface{}{
		"pitch_id":     pitch_id,
		"total_profit": 10000.0,
		"period_start": "2025-01-01",
		"period_end":   "2025-12-31",
	}
	profit_body, _ := json.Marshal(profit_payload)
	resp, err = make_request(client, "POST", server.URL+"/api/profit", profit_body, business_token)
	if err != nil {
		t.Fatalf("Profit declaration failed: %v", err)
	}
	var profits []map[string]interface{}
	if err := decode_json_response(resp, &profits); err != nil {
		t.Fatalf("Failed to decode profit: %v", err)
	}
	if len(profits) != 1 {
		t.Fatalf("Expected exactly one profit, got %d", len(profits))
	}
	profit := profits[0]
	profit_id := int64(profit["id"].(float64))
	distributable := profit["distributable_amount"].(float64)
	if distributable < 1999 || distributable > 2001 {
		t.Errorf("Expected ~2000 distributable, got %f", distributable)
	}

	// === STEP 4: Ensure business has enough balance to distribute ===
	// ✅ FIX: Directly set business dashboard balance (bypass wallet top-up flow)
	_, err = utils.UpdateByID("profile", business_id, map[string]interface{}{"dashboard_balance": 3000})
	if err != nil {
		t.Fatalf("Failed to fund business wallet: %v", err)
	}

	// === STEP 5: Distribute profit ===
	distribute_url := fmt.Sprintf("%s/api/distribute?profit_id=%d", server.URL, profit_id)
	resp, err = make_request(client, "POST", distribute_url, nil, business_token)
	if err != nil {
		t.Fatalf("Profit distribution failed: %v", err)
	}
	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("Expected 204, got %d. Body: %s", resp.StatusCode, string(body))
	}

	// === STEP 6: Investor checks distributions ===
	resp, err = make_request(client, "GET", server.URL+"/api/distribute", nil, investor_token)
	if err != nil {
		t.Fatalf("Failed to fetch distributions: %v", err)
	}
	var distributions []map[string]interface{}
	if err := decode_json_response(resp, &distributions); err != nil {
		t.Fatalf("Failed to decode distributions: %v", err)
	}
	found := false
	for _, dist := range distributions {
		if int64(dist["profit_id"].(float64)) == profit_id &&
			int64(dist["investment_id"].(float64)) == investment_id {
			amount := dist["amount"].(float64)
			if amount >= 1999 && amount <= 2001 { // allow rounding
				found = true
				break
			}
		}
	}
	if !found {
		t.Errorf("Investor did not receive expected profit distribution. Got: %v", distributions)
	}

	// === STEP 7: Verify business balance was deducted (3000 - 2000 = 1000) ===
	resp, err = make_request(client, "GET", server.URL+"/api/wallet", nil, business_token)
	if err != nil {
		t.Fatalf("Failed to get business wallet: %v", err)
	}
	var wallet map[string]interface{}
	if err := decode_json_response(resp, &wallet); err != nil {
		t.Fatalf("Failed to decode wallet: %v", err)
	}
	balance := int64(wallet["dashboard_balance"].(float64))
	if balance != 1000 {
		t.Errorf("Expected business balance 1000 after distribution, got %d", balance)
	}

	t.Log("Profit declaration and distribution test passed")
}
