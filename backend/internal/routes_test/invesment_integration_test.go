package routes_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/routes"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

func TestInvestmentCRU(t *testing.T) {
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

	// Login as business to create pitch
	business_token, err := login_to_supabase(
		os.Getenv("TEST_BUSINESS_EMAIL"),
		os.Getenv("TEST_BUSINESS_PASSWORD"),
	)
	if err != nil {
		t.Fatalf("Failed to log in as business: %v", err)
	}

	// Login as investor to invest
	investor_token, err := login_to_supabase(
		os.Getenv("TEST_INVESTOR_EMAIL"),
		os.Getenv("TEST_INVESTOR_PASSWORD"),
	)
	if err != nil {
		t.Fatalf("Failed to log in as investor: %v", err)
	}

	router := routes.SetupRouter()
	server := httptest.NewServer(router)
	defer server.Close()
	client := &http.Client{Timeout: 10 * time.Second}

	pitch_payload := map[string]interface{}{
		"title":                 "Investment Test Pitch",
		"elevator_pitch":        "Pitch for investment test",
		"detailed_pitch":        "Detailed description for investment test",
		"target_amount":         10000,
		"investment_start_date": "2025-01-01",
		"investment_end_date":   "2025-12-31",
		"profit_share_percent":  10.0,
		"investment_tiers": []map[string]interface{}{
			{"name": "Basic", "min_amount": 100, "multiplier": 1.1, "max_amount": 999},
			{"name": "Premium", "min_amount": 1000, "multiplier": 1.25, "max_amount": 5000},
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
	pitch_id_float, ok := created_pitch["id"].(float64)
	if !ok {
		t.Fatalf("Invalid pitch ID in response: %v", created_pitch)
	}
	pitch_id := int64(pitch_id_float)

	// defer func() {
	// 	delete_url := fmt.Sprintf("%s/api/pitch?id=%d", server.URL, pitch_id)
	// 	resp, err := make_request(client, "DELETE", delete_url, nil, business_token)
	// 	if err != nil {
	// 		t.Logf("Warning: failed to send DELETE request for cleanup: %v", err)
	// 	} else if resp.StatusCode != http.StatusNoContent {
	// 		body, _ := io.ReadAll(resp.Body)
	// 		resp.Body.Close()
	// 		t.Logf("Warning: DELETE cleanup failed with status %d: %s", resp.StatusCode, string(body))
	// 	}
	// }()

	investment_payload := map[string]interface{}{
		"pitch_id": pitch_id,
		"amount":   int64(1500),
	}
	investment_body, _ := json.Marshal(investment_payload)
	resp, err = make_request(client, "POST", server.URL+"/api/investment", investment_body, investor_token)
	if err != nil {
		t.Fatalf("Create investment request failed: %v", err)
	}
	var created_investment map[string]interface{}
	if err := decode_json_response(resp, &created_investment); err != nil {
		t.Fatalf("Create investment response error: %v", err)
	}

	investment_id_float, ok := created_investment["id"].(float64)
	if !ok {
		t.Fatalf("Missing or invalid 'id' in investment response: %v", created_investment)
	}
	investment_id := int64(investment_id_float)

	amount := int64(created_investment["amount"].(float64))
	if amount != 1500 {
		t.Errorf("Expected amount 1500, got %d", amount)
	}
	pitch_id_resp := int64(created_investment["pitch_id"].(float64))
	if pitch_id_resp != pitch_id {
		t.Errorf("Pitch ID mismatch: expected %d, got %d", pitch_id, pitch_id_resp)
	}
	if created_investment["refunded"] != false {
		t.Errorf("New investment should not be refunded")
	}

	get_url := fmt.Sprintf("%s/api/investment?id=%d", server.URL, investment_id)
	resp, err = make_request(client, "GET", get_url, nil, investor_token)
	if err != nil {
		t.Fatalf("GET investment failed: %v", err)
	}
	var fetched_investment map[string]interface{}
	if err := decode_json_response(resp, &fetched_investment); err != nil {
		t.Fatalf("GET investment response error: %v", err)
	}
	fetched_id := int64(fetched_investment["id"].(float64))
	if fetched_id != investment_id {
		t.Errorf("Fetched investment ID mismatch")
	}

	resp, err = make_request(client, "GET", server.URL+"/api/investment", nil, investor_token)
	if err != nil {
		t.Fatalf("GET all investments failed: %v", err)
	}
	var all_investments []interface{}
	if err := decode_json_response(resp, &all_investments); err != nil {
		t.Fatalf("GET all investments decode error: %v", err)
	}
	found := false
	for _, inv := range all_investments {
		if invMap, ok := inv.(map[string]interface{}); ok {
			if int64(invMap["id"].(float64)) == investment_id {
				found = true
				break
			}
		}
	}
	if !found {
		t.Errorf("Investment not found in list endpoint")
	}

	refund_payload := map[string]interface{}{
		"refunded": true,
	}
	refund_body, _ := json.Marshal(refund_payload)
	resp, err = make_request(client, "PATCH", get_url, refund_body, investor_token)
	if err != nil {
		t.Fatalf("Refund PATCH request failed: %v", err)
	}
	var refunded_investment map[string]interface{}
	if err := decode_json_response(resp, &refunded_investment); err != nil {
		t.Fatalf("Refund response error: %v", err)
	}
	if refunded_investment["refunded"] != true {
		t.Errorf("Expected refunded=true after PATCH, got %v", refunded_investment["refunded"])
	}

	resp, err = make_request(client, "GET", get_url, nil, investor_token)
	if err != nil {
		t.Fatalf("Final GET failed: %v", err)
	}
	var final_investment map[string]interface{}
	if err := decode_json_response(resp, &final_investment); err != nil {
		t.Fatalf("Final GET decode error: %v", err)
	}
	if final_investment["refunded"] != true {
		t.Errorf("Investment not marked as refunded after update")
	}

	t.Logf("Investment CRU test passed: created=%d, refunded successfully", investment_id)
}
