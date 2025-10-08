package routes

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"

	model "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/common"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/database"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
	utilsdb "github.com/EmmaMartin123/Industrial_Project/backend/internal/utils/db"
)

func distribute_route(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		get_distribute_route(w, r)
	case http.MethodPost:
		post_distribute_route(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func get_distribute_route(w http.ResponseWriter, r *http.Request) {
	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	//TODO: let business view distribution for their pitches?
	query := "investor_id=eq." + user_id
	body, err := utils.GetDataByQuery("profit_distributions", query)
	if err != nil {
		http.Error(w, "Failed to fetch profit distributions", http.StatusInternalServerError)
		return
	}

	var distributions []model.ProfitDistribution
	if err := json.Unmarshal(body, &distributions); err != nil {
		http.Error(w, "Invalid distribution data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(distributions)
}

func post_distribute_route(w http.ResponseWriter, r *http.Request) {
	profit_id_str := r.URL.Query().Get("profit_id")
	if profit_id_str == "" {
		http.Error(w, "profit_id is required", http.StatusBadRequest)
		return
	}

	profit_id, err := strconv.ParseInt(profit_id_str, 10, 64)
	if err != nil {
		http.Error(w, "invalid profit_id", http.StatusBadRequest)
		return
	}

	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	profit_body, err := utils.GetDataByID("profits", profit_id_str)
	if err != nil {
		http.Error(w, "Profit not found", http.StatusNotFound)
		return
	}
	var profits []database.Profit
	if err := json.Unmarshal(profit_body, &profits); err != nil || len(profits) != 1 {
		http.Error(w, "Profit not found", http.StatusNotFound)
		return
	}
	profit := profits[0]

	if profit.Transferred {
		http.Error(w, "Profit already distributed", http.StatusBadRequest)
		return
	}

	pitch_body, err := utils.GetDataByID("pitch", strconv.FormatInt(profit.PitchID, 10))
	if err != nil {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}
	var pitches []database.Pitch
	if err := json.Unmarshal(pitch_body, &pitches); err != nil || len(pitches) != 1 {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}
	pitch := pitches[0]

	if pitch.UserID != user_id {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if ok, _ := utilsdb.CheckUserRole(w, user_id, "business"); !ok {
		http.Error(w, "Only businesses can distribute profit", http.StatusUnauthorized)
		return
	}

	profile_body, err := utils.GetDataByID("profile", user_id)
	if err != nil {
		http.Error(w, "Business profile not found", http.StatusNotFound)
		return
	}
	var profiles []model.Profile
	if err := json.Unmarshal(profile_body, &profiles); err != nil || len(profiles) != 1 {
		http.Error(w, "Invalid profile data", http.StatusInternalServerError)
		return
	}
	business_profile := profiles[0]

	if business_profile.DashboardBalance == nil {
		http.Error(w, "Business wallet not initialized", http.StatusInternalServerError)
		return
	}

	if *business_profile.DashboardBalance < int64(profit.DistributableAmount) {
		http.Error(w, "Insufficient dashboard balance to distribute profit", http.StatusPaymentRequired)
		return
	}

	investment_query := fmt.Sprintf("pitch_id=eq.%d&refunded=is.false", profit.PitchID)
	investment_body, err := utils.GetDataByQuery("investments", investment_query)
	if err != nil {
		http.Error(w, "Failed to fetch investments", http.StatusInternalServerError)
		return
	}
	var investments []model.Investment
	if err := json.Unmarshal(investment_body, &investments); err != nil {
		http.Error(w, "Invalid investment data", http.StatusInternalServerError)
		return
	}

	if len(investments) == 0 {
		http.Error(w, "No active investments for this pitch", http.StatusBadRequest)
		return
	}

	tier_query := fmt.Sprintf("pitch_id=eq.%d", profit.PitchID)
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

	tier_map := make(map[int64]model.InvestmentTier)
	for _, t := range tiers {
		if t.ID != nil {
			tier_map[*t.ID] = t
		}
	}

	var total_shares float64
	investor_data := make([]struct {
		investment model.Investment
		shares     float64
	}, 0, len(investments))

	for _, inv := range investments {
		if inv.TierID == nil {
			continue
		}
		tier, exists := tier_map[*inv.TierID]
		if !exists {
			continue
		}
		shares := float64(inv.Amount) * tier.Multiplier
		total_shares += shares
		investor_data = append(investor_data, struct {
			investment model.Investment
			shares     float64
		}{inv, shares})
	}

	if total_shares <= 0 {
		http.Error(w, "No valid shares to distribute", http.StatusBadRequest)
		return
	}

	err = update_balance(business_profile.ID, -int64(profit.DistributableAmount))
	if err != nil {
		http.Error(w, "Failed to deduct business balance", http.StatusInternalServerError)
		return
	}

	profit_per_share := profit.DistributableAmount / total_shares
	for _, data := range investor_data {
		amount := profit_per_share * data.shares
		rounded_amount := math.Round(amount*100) / 100

		paid := true

		if err := update_balance(data.investment.InvestorID, int64(rounded_amount)); err != nil {
			fmt.Printf("Warning: failed to credit investor %s wallet: %v\n", data.investment.InvestorID, err)
			paid = false
		}

		distribution := model.ProfitDistribution{
			ProfitID:     profit.ID,
			InvestmentID: *data.investment.ID,
			InvestorID:   data.investment.InvestorID,
			Shares:       data.shares,
			Amount:       rounded_amount,
			Paid:         paid, // now actually paid lol
		}

		_, err := utils.InsertData(distribution, "profit_distributions")
		if err != nil {
			fmt.Printf("Warning: failed to insert distribution for investor %s: %v\n", data.investment.InvestorID, err)
		}
	}

	update_payload := map[string]interface{}{"transferred": true}
	_, err = utils.UpdateByID("profits", strconv.FormatInt(profit_id, 10), update_payload)
	if err != nil {
		fmt.Printf("Warning: failed to mark profit %d as transferred: %v\n", profit.ID, err)
	}

	w.WriteHeader(http.StatusNoContent)
}
