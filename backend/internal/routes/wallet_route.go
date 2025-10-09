package routes

import (
	"encoding/json"
	"fmt"
	"net/http"

	model "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/common"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

func wallet_route(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		get_wallet_route(w, r)
	case http.MethodPatch:
		patch_wallet_route(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func get_wallet_route(w http.ResponseWriter, r *http.Request) {
	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	body, err := utils.GetDataByID("profile", user_id)
	if err != nil {
		http.Error(w, "Profile not found", http.StatusNotFound)
		return
	}
	var profiles []model.Profile
	if err := json.Unmarshal(body, &profiles); err != nil || len(profiles) != 1 {
		http.Error(w, "Invalid profile data", http.StatusInternalServerError)
		return
	}
	balance := int64(0)
	if profiles[0].DashboardBalance != nil {
		balance = *profiles[0].DashboardBalance
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int64{"dashboard_balance": balance})
}

func patch_wallet_route(w http.ResponseWriter, r *http.Request) {
	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Action string `json:"action"`
		Amount int64  `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Amount <= 0 {
		http.Error(w, "Amount must be positive", http.StatusBadRequest)
		return
	}

	switch req.Action {
	case "deposit":
		bank_query := fmt.Sprintf("user_id=eq.%s", user_id)
		bank_body, err := utils.GetDataByQuery("bank_account", bank_query)
		if err != nil {
			http.Error(w, "No linked bank account", http.StatusNotFound)
			return
		}
		var banks []struct {
			ID      string `json:"id"`
			Balance int64  `json:"balance"`
		}
		if err := json.Unmarshal(bank_body, &banks); err != nil || len(banks) == 0 {
			http.Error(w, "Invalid bank account data", http.StatusNotFound)
			return
		}
		bank := banks[0]
		if bank.Balance < req.Amount {
			http.Error(w, "Insufficient funds in bank account", http.StatusPaymentRequired)
			return
		}
		new_bank_balance := bank.Balance - req.Amount
		bank_payload := map[string]interface{}{"balance": new_bank_balance}
		_, err = utils.UpdateByID("bank_account", bank.ID, bank_payload)
		if err != nil {
			http.Error(w, "Failed to debit bank account", http.StatusInternalServerError)
			return
		}
		err = update_balance(user_id, req.Amount)
		if err != nil {
			http.Error(w, "Failed to credit wallet", http.StatusInternalServerError)
			return
		}

	case "withdraw":
		profile_body, err := utils.GetDataByID("profile", user_id)
		if err != nil {
			http.Error(w, "Profile not found", http.StatusNotFound)
			return
		}
		var profiles []model.Profile
		if err := json.Unmarshal(profile_body, &profiles); err != nil || len(profiles) == 0 {
			http.Error(w, "Invalid profile", http.StatusInternalServerError)
			return
		}
		wallet_balance := int64(0)
		if profiles[0].DashboardBalance != nil {
			wallet_balance = *profiles[0].DashboardBalance
		}
		if wallet_balance < req.Amount {
			http.Error(w, "Insufficient wallet balance", http.StatusPaymentRequired)
			return
		}

		bank_query := fmt.Sprintf("user_id=eq.%s", user_id)
		bank_body, err := utils.GetDataByQuery("bank_account", bank_query)
		if err != nil {
			http.Error(w, "No linked bank account", http.StatusNotFound)
			return
		}
		var banks []struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(bank_body, &banks); err != nil || len(banks) == 0 {
			http.Error(w, "Invalid bank account", http.StatusNotFound)
			return
		}
		bank := banks[0]

		err = update_balance(user_id, -req.Amount)
		if err != nil {
			http.Error(w, "Failed to debit wallet", http.StatusInternalServerError)
			return
		}

		var current_bank struct {
			Balance int64 `json:"balance"`
		}
		if err := json.Unmarshal(bank_body, &current_bank); err != nil {
			update_balance(user_id, req.Amount)
			http.Error(w, "Failed to read bank balance", http.StatusInternalServerError)
			return
		}
		new_bank_balance := current_bank.Balance + req.Amount
		bank_payload := map[string]interface{}{"balance": new_bank_balance}
		_, err = utils.UpdateByID("bank_account", bank.ID, bank_payload)
		if err != nil {
			update_balance(user_id, req.Amount)
			http.Error(w, "Failed to credit bank account", http.StatusInternalServerError)
			return
		}

	default:
		http.Error(w, "Invalid action. Use 'deposit' or 'withdraw'", http.StatusBadRequest)
		return
	}

	profile_body, _ := utils.GetDataByID("profile", user_id)
	var profiles []model.Profile
	json.Unmarshal(profile_body, &profiles)
	balance := int64(0)
	if len(profiles) > 0 && profiles[0].DashboardBalance != nil {
		balance = *profiles[0].DashboardBalance
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int64{"dashboard_balance": balance})
}
