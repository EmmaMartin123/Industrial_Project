package routes

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

func bank_route(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		get_bank_route(w, r)
	case http.MethodPost:
		create_bank_route(w, r)
	case http.MethodPatch:
		patch_bank_route(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func get_bank_route(w http.ResponseWriter, r *http.Request) {
	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	query := fmt.Sprintf("user_id=eq.%s", user_id)
	body, err := utils.GetDataByQuery("bank_account", query)
	if err != nil {
		http.Error(w, "No linked bank account", http.StatusNotFound)
		return
	}
	var accounts []struct {
		ID                string `json:"id"`
		AccountHolderName string `json:"account_holder_name"`
		SortCode          string `json:"sort_code"`
		AccountNumber     string `json:"account_number"`
		Balance           int64  `json:"balance"`
		CreatedAt         string `json:"created_at"`
		UpdatedAt         string `json:"updated_at"`
	}
	if err := json.Unmarshal(body, &accounts); err != nil || len(accounts) == 0 {
		http.Error(w, "Invalid bank account data", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(accounts[0])
}

func create_bank_route(w http.ResponseWriter, r *http.Request) {
	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var req struct {
		AccountHolderName string `json:"account_holder_name"`
		SortCode          string `json:"sort_code"`
		AccountNumber     string `json:"account_number"`
		Balance           int64  `json:"balance"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if req.AccountHolderName == "" || req.SortCode == "" || req.AccountNumber == "" {
		http.Error(w, "account_holder_name, sort_code, and account_number are required", http.StatusBadRequest)
		return
	}
	if req.Balance < 0 {
		http.Error(w, "Balance must be non-negative", http.StatusBadRequest)
		return
	}
	payload := map[string]interface{}{
		"user_id":             user_id,
		"account_holder_name": req.AccountHolderName,
		"sort_code":           req.SortCode,
		"account_number":      req.AccountNumber,
		"balance":             req.Balance,
	}
	result, err := utils.InsertData(payload, "bank_account")
	if err != nil {
		http.Error(w, "Failed to create bank account", http.StatusInternalServerError)
		return
	}
	var created []struct {
		ID                string `json:"id"`
		AccountHolderName string `json:"account_holder_name"`
		SortCode          string `json:"sort_code"`
		AccountNumber     string `json:"account_number"`
		Balance           int64  `json:"balance"`
		CreatedAt         string `json:"created_at"`
		UpdatedAt         string `json:"updated_at"`
	}
	if err := json.Unmarshal([]byte(result), &created); err != nil || len(created) != 1 {
		http.Error(w, "Invalid bank account creation response", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(created[0])
}

func patch_bank_route(w http.ResponseWriter, r *http.Request) {
	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	query := fmt.Sprintf("user_id=eq.%s", user_id)
	body, err := utils.GetDataByQuery("bank_account", query)
	if err != nil {
		http.Error(w, "No linked bank account", http.StatusNotFound)
		return
	}
	var accounts []struct {
		ID      string `json:"id"`
		Balance int64  `json:"balance"`
	}
	if err := json.Unmarshal(body, &accounts); err != nil || len(accounts) == 0 {
		http.Error(w, "Invalid bank account data", http.StatusNotFound)
		return
	}
	bank := accounts[0]
	var req struct {
		Balance int64 `json:"balance"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if req.Balance < 0 {
		http.Error(w, "Balance must be non-negative", http.StatusBadRequest)
		return
	}
	payload := map[string]interface{}{"balance": req.Balance}
	_, err = utils.UpdateByID("bank_account", bank.ID, payload)
	if err != nil {
		http.Error(w, "Failed to update bank balance", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int64{"balance": req.Balance})
}
