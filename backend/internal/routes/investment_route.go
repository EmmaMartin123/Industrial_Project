package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	model "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/common"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/database"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
	utilsdb "github.com/EmmaMartin123/Industrial_Project/backend/internal/utils/db"
)

func investment_route(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		create_investment_route(w, r)
	case http.MethodGet:
		get_investment_route(w, r)
	case http.MethodPatch:
		update_investment_route(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func update_balance(user_id string, amount_pounds int64) error {
	profile, err := utilsdb.GetUserProfile(user_id)
	if err != nil {
		return fmt.Errorf("profile not found")
	}

	current_balance := int64(0)
	if profile.DashboardBalance != nil {
		current_balance = int64(*profile.DashboardBalance)
	}
	new_balance := current_balance + amount_pounds

	if new_balance < 0 && amount_pounds < 0 {
		return fmt.Errorf("insufficient funds")
	}

	payload := map[string]interface{}{
		"dashboard_balance": int(new_balance),
	}
	_, err = utils.UpdateByID("profile", user_id, payload)
	if err != nil {
		return fmt.Errorf("failed to update balance: %w", err)
	}
	return nil
}

func create_investment_route(w http.ResponseWriter, r *http.Request) {
	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if ok, _ := utilsdb.CheckUserRole(w, user_id, "investor"); !ok {
		return
	}

	var req struct {
		PitchID int64 `json:"pitch_id"`
		Amount  int64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Amount <= 0 {
		http.Error(w, "Amount must be positive", http.StatusBadRequest)
		return
	}

	pitch_body, err := utils.GetDataByID("pitch", strconv.FormatInt(req.PitchID, 10))
	if err != nil {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}
	var pitches []database.Pitch
	if err := json.Unmarshal(pitch_body, &pitches); err != nil || len(pitches) != 1 {
		http.Error(w, "Invalid pitch data", http.StatusInternalServerError)
		return
	}
	pitch := pitches[0]

	if pitch.Status != "Active" {
		http.Error(w, "Pitch is no longer active", http.StatusBadRequest)
		return
	}

	new_raised := pitch.RaisedAmount + req.Amount
	if uint64(new_raised) > pitch.TargetAmount {
		http.Error(w, "Investment would exceed pitch target amount", http.StatusBadRequest)
		return
	}

	tier_query := fmt.Sprintf("pitch_id=eq.%d", req.PitchID)
	tier_body, err := utils.GetDataByQuery("investment_tier", tier_query)
	if err != nil {
		http.Error(w, "Failed to fetch investment tiers", http.StatusInternalServerError)
		return
	}

	var tiers []model.InvestmentTier
	if err := json.Unmarshal(tier_body, &tiers); err != nil {
		http.Error(w, "Invalid tier data", http.StatusInternalServerError)
		return
	}

	var matched_tier_id *int64
	var currentMatch uint64 = 0
	for _, tier := range tiers {
		if uint64(req.Amount) >= tier.MinAmount && tier.MinAmount > currentMatch {
			matched_tier_id = tier.ID
			currentMatch = tier.MinAmount
		}
	}

	if matched_tier_id == nil {
		http.Error(w, "No investment tier matches the given amount", http.StatusBadRequest)
		return
	}

	if err := update_balance(user_id, -req.Amount); err != nil {
		if err.Error() == "insufficient funds" {
			http.Error(w, "Insufficient funds", http.StatusPaymentRequired)
		} else {
			http.Error(w, "Failed to deduct funds", http.StatusInternalServerError)
		}
		fmt.Printf("Balance update failed for user %s: %v\n", user_id, err)
		return
	}

	investment := model.Investment{
		PitchID:    &req.PitchID,
		InvestorID: user_id,
		TierID:     matched_tier_id,
		Amount:     req.Amount,
		Refunded:   false,
	}

	result, err := utils.InsertData(investment, "investments")
	if err != nil {
		_ = update_balance(user_id, req.Amount)
		http.Error(w, "Failed to create investment", http.StatusInternalServerError)
		return
	}

	var inserted []model.Investment
	if err := json.Unmarshal([]byte(result), &inserted); err != nil || len(inserted) == 0 {
		_ = update_balance(user_id, req.Amount)
		http.Error(w, "Failed to decode created investment", http.StatusInternalServerError)
		return
	}

	update_payload := map[string]interface{}{"raised_amount": new_raised}
	if uint64(new_raised) == pitch.TargetAmount {
		update_payload["status"] = "Funded"
	}
	_, err = utils.UpdateByID("pitch", strconv.FormatInt(req.PitchID, 10), update_payload)
	if err != nil {
		fmt.Printf("Warning: failed to update pitch raised_amount: %v\n", err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(inserted[0])
}

func get_investment_route(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	id_str := r.URL.Query().Get("id")
	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Verify the user has an investor role
	if ok, _ := utilsdb.CheckUserRole(w, user_id, "investor"); !ok {
		return
	}

	if id_str != "" {
		result, err := utils.GetDataByID("investments", id_str)
		if err != nil {
			http.Error(w, "Investment not found", http.StatusNotFound)
			return
		}

		var investments []model.Investment
		if err := json.Unmarshal(result, &investments); err != nil || len(investments) != 1 {
			http.Error(w, "Invalid investment data", http.StatusInternalServerError)
			return
		}

		investment := investments[0]
		if investment.InvestorID != user_id {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		json.NewEncoder(w).Encode(investment)
		return
	}

	query := fmt.Sprintf("investor_id=eq.%s", user_id)
	result, err := utils.GetDataByQuery("investments", query)
	if err != nil {
		http.Error(w, "Failed to fetch investments", http.StatusInternalServerError)
		return
	}

	var investments []model.Investment
	if err := json.Unmarshal(result, &investments); err != nil {
		http.Error(w, "Invalid investment data", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(investments)
}

func update_investment_route(w http.ResponseWriter, r *http.Request) {
	id_str := r.URL.Query().Get("id")
	if id_str == "" {
		http.Error(w, "Investment ID required", http.StatusBadRequest)
		return
	}

	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if ok, _ := utilsdb.CheckUserRole(w, user_id, "investor"); !ok {
		return
	}

	result, err := utils.GetDataByID("investments", id_str)
	if err != nil {
		http.Error(w, "Investment not found", http.StatusNotFound)
		return
	}

	var investments []model.Investment
	if err := json.Unmarshal(result, &investments); err != nil || len(investments) != 1 {
		http.Error(w, "Invalid investment data", http.StatusInternalServerError)
		return
	}

	investment := investments[0]
	if investment.InvestorID != user_id {
		http.Error(w, "Forbidden: You don't own this investment", http.StatusForbidden)
		return
	}

	if investment.Refunded {
		http.Error(w, "Investment already refunded", http.StatusBadRequest)
		return
	}

	var req struct {
		Refunded *bool `json:"refunded,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Refunded == nil || !*req.Refunded {
		http.Error(w, "Can only refund an investment", http.StatusBadRequest)
		return
	}

	pitch_body, err := utils.GetDataByID("pitch", strconv.FormatInt(*investment.PitchID, 10))
	if err != nil {
		http.Error(w, "Associated pitch not found", http.StatusNotFound)
		return
	}
	var pitches []database.Pitch
	if err := json.Unmarshal(pitch_body, &pitches); err != nil || len(pitches) != 1 {
		http.Error(w, "Invalid pitch data", http.StatusInternalServerError)
		return
	}
	pitch := pitches[0]

	if pitch.Status != "Active" {
		http.Error(w, "Can only refund on Active pitches", http.StatusBadRequest)
		return
	}

	new_raised := pitch.RaisedAmount - investment.Amount
	if new_raised < 0 {
		new_raised = 0
	}

	update_payload := map[string]interface{}{"raised_amount": new_raised}

	_, err = utils.UpdateByID("pitch", strconv.FormatInt(*investment.PitchID, 10), update_payload)
	if err != nil {
		fmt.Printf("Warning: failed to update pitch after refund: %v\n", err)
	}

	payload := map[string]interface{}{"refunded": true}
	_, err = utils.UpdateByID("investments", id_str, payload)
	if err != nil {
		http.Error(w, "Failed to update investment", http.StatusInternalServerError)
		return
	}

	if err := update_balance(user_id, investment.Amount); err != nil {
		fmt.Printf("Warning: failed to refund investor balance: %v\n", err)
	}

	updated_result, err := utils.GetDataByID("investments", id_str)
	if err != nil {
		http.Error(w, "Investment missing after update", http.StatusNotFound)
		return
	}

	var updated []model.Investment
	if err := json.Unmarshal(updated_result, &updated); err != nil || len(updated) != 1 {
		http.Error(w, "Invalid updated investment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated[0])
}
