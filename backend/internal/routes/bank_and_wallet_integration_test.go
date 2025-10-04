package routes_test

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/routes"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

func TestBankAndWalletIntegration(t *testing.T) {
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

	user_id, err := utils.VerifyJWTHS256(access_token)
	if err != nil {
		t.Fatalf("Failed to extract user ID: %v", err)
	}

	_, err = utils.ReplaceByID("profile", user_id, map[string]interface{}{"dashboard_balance": 0})
	if err != nil {
		t.Fatalf("Failed to reset wallet balance: %v", err)
	}

	router := routes.SetupRouter()
	server := httptest.NewServer(router)
	defer server.Close()
	client := &http.Client{Timeout: 10 * time.Second}

	bank_payload := map[string]interface{}{
		"account_holder_name": "Test User",
		"sort_code":           "123456",
		"account_number":      "12345678",
		"balance":             int64(5000),
	}
	bank_body, _ := json.Marshal(bank_payload)

	resp, err := make_request(client, "POST", server.URL+"/api/bank", bank_body, access_token)
	if err != nil {
		t.Fatalf("Failed to create bank account: %v", err)
	}
	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("Expected 201 for bank creation, got %d: %s", resp.StatusCode, string(body))
	}

	var created_bank map[string]interface{}
	if err := decode_json_response(resp, &created_bank); err != nil {
		t.Fatalf("Failed to decode created bank: %v", err)
	}

	bank_id, ok := created_bank["id"].(string)
	if !ok {
		t.Fatalf("Bank response missing 'id': %v", created_bank)
	}

	defer func() {
		utils.DeleteByID("bank_account", bank_id)
	}()

	resp, err = make_request(client, "GET", server.URL+"/api/bank", nil, access_token)
	if err != nil {
		t.Fatalf("Failed to GET bank account: %v", err)
	}
	var fetched_bank map[string]interface{}
	if err := decode_json_response(resp, &fetched_bank); err != nil {
		t.Fatalf("Failed to decode fetched bank: %v", err)
	}
	if fetched_bank["id"] != bank_id {
		t.Errorf("Bank ID mismatch")
	}

	update_payload := map[string]interface{}{"balance": int64(7500)}
	update_body, _ := json.Marshal(update_payload)

	resp, err = make_request(client, "PATCH", server.URL+"/api/bank", update_body, access_token)
	if err != nil {
		t.Fatalf("Failed to PATCH bank balance: %v", err)
	}
	var updated_bank map[string]interface{}
	if err := decode_json_response(resp, &updated_bank); err != nil {
		t.Fatalf("Failed to decode updated bank: %v", err)
	}
	balance := int64(updated_bank["balance"].(float64))
	if balance != 7500 {
		t.Errorf("Expected updated balance 7500, got %d", balance)
	}

	resp, err = make_request(client, "GET", server.URL+"/api/wallet", nil, access_token)
	if err != nil {
		t.Fatalf("Failed to GET wallet: %v", err)
	}
	var wallet map[string]interface{}
	if err := decode_json_response(resp, &wallet); err != nil {
		t.Fatalf("Failed to decode wallet: %v", err)
	}
	wallet_balance := int64(wallet["dashboard_balance"].(float64))
	if wallet_balance != 0 {
		t.Errorf("Expected wallet balance 0, got %d", wallet_balance)
	}

	topup_payload := map[string]interface{}{"amount": int64(2000)}
	topup_body, _ := json.Marshal(topup_payload)

	resp, err = make_request(client, "PATCH", server.URL+"/api/wallet", topup_body, access_token)
	if err != nil {
		t.Fatalf("Failed to top up wallet: %v", err)
	}
	var topped_up_wallet map[string]interface{}
	if err := decode_json_response(resp, &topped_up_wallet); err != nil {
		t.Fatalf("Failed to decode topped-up wallet: %v", err)
	}
	new_wallet_balance := int64(topped_up_wallet["dashboard_balance"].(float64))
	if new_wallet_balance != 2000 {
		t.Errorf("Expected wallet balance 2000 after top-up, got %d", new_wallet_balance)
	}

	resp, err = make_request(client, "GET", server.URL+"/api/bank", nil, access_token)
	if err != nil {
		t.Fatalf("Failed to re-fetch bank after top-up: %v", err)
	}
	var final_bank map[string]interface{}
	if err := decode_json_response(resp, &final_bank); err != nil {
		t.Fatalf("Failed to decode final bank: %v", err)
	}
	final_bank_balance := int64(final_bank["balance"].(float64))
	if final_bank_balance != 5500 {
		t.Errorf("Expected bank balance 5500 after £2000 top-up, got %d", final_bank_balance)
	}

	invalid_topup := map[string]interface{}{"amount": int64(10000)}
	invalid_body, _ := json.Marshal(invalid_topup)

	resp, err = make_request(client, "PATCH", server.URL+"/api/wallet", invalid_body, access_token)
	if err != nil {
		t.Fatalf("Request failed unexpectedly: %v", err)
	}
	if resp.StatusCode != http.StatusPaymentRequired {
		body, _ := io.ReadAll(resp.Body)
		t.Errorf("Expected 402 for insufficient funds, got %d. Body: %s", resp.StatusCode, string(body))
	}

	t.Log("Bank and Wallet integration test passed")
}
