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
		"TEST_USER_EMAIL",
		"TEST_USER_PASSWORD",
	}
	for _, key := range required {
		if os.Getenv(key) == "" {
			t.Skipf("Skipping: %s not set", key)
		}
	}

	if err := utils.InitJWTHS256(os.Getenv("SUPABASE_URL") + "/auth/v1"); err != nil {
		t.Fatalf("Failed to initialize JWT: %v", err)
	}

	access_token, err := login_to_supabase(
		os.Getenv("TEST_USER_EMAIL"),
		os.Getenv("TEST_USER_PASSWORD"),
	)
	if err != nil {
		t.Fatalf("Failed to log in to Supabase: %v", err)
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
	resp, err := make_request(client, "POST", server.URL+"/api/pitch", pitch_body, access_token)
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

	//TODO: should delete the pitch, can't because of "is still referenced from table "investments"."

	investment_payload := map[string]interface{}{
		"pitch_id": pitch_id,
		"amount":   1500, // Premium tier
	}
	investment_body, _ := json.Marshal(investment_payload)
	resp, err = make_request(client, "POST", server.URL+"/api/investment", investment_body, access_token)
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

	if created_investment["amount"].(float64) != 1500 {
		t.Errorf("Expected amount 1500, got %v", created_investment["amount"])
	}
	if created_investment["pitch_id"].(float64) != float64(pitch_id) {
		t.Errorf("Pitch ID mismatch")
	}
	if created_investment["refunded"] != false {
		t.Errorf("New investment should not be refunded")
	}

	get_url := fmt.Sprintf("%s/api/investment?id=%d", server.URL, investment_id)
	resp, err = make_request(client, "GET", get_url, nil, access_token)
	if err != nil {
		t.Fatalf("GET investment failed: %v", err)
	}
	var fetched_investment map[string]interface{}
	if err := decode_json_response(resp, &fetched_investment); err != nil {
		t.Fatalf("GET investment response error: %v", err)
	}
	if fetched_investment["id"].(float64) != float64(investment_id) {
		t.Errorf("Fetched investment ID mismatch")
	}

	resp, err = make_request(client, "GET", server.URL+"/api/investment", nil, access_token)
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
			if invMap["id"].(float64) == float64(investment_id) {
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
	resp, err = make_request(client, "PATCH", get_url, refund_body, access_token)
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

	resp, err = make_request(client, "GET", get_url, nil, access_token)
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
