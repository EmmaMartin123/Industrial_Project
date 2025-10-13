package routes

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/frontend"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
	utilsdb "github.com/EmmaMartin123/Industrial_Project/backend/internal/utils/db"
)

func portfolio_route(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		get_portfolio_route(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// gets the portfolio for the user
func get_portfolio_route(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}	

	// checks if the user has the investor role
	if ok, _ := utilsdb.CheckUserRole(w, user_id, "investor"); !ok {
		return
	}

	// gets the portfolio for the user
	query := fmt.Sprintf("select=id,amount,created_at,pitch:pitch(id,title,target_amount,raised_amount,status),tier:investment_tier(name,multiplier),profit_distributions(amount,paid)&investor_id=eq.%s&refunded=is.false&profit_distributions.investor_id=eq.%s&order=created_at.desc", user_id, user_id)

	body, err := utils.GetDataByQuery("investments", query)
	if err != nil {
		http.Error(w, "Failed to fetch portfolio data", http.StatusInternalServerError)
		return
	}

	log.Println("RAW RESPONSE: ", string(body))
	var rawData []frontend.InvRow
	if err := json.Unmarshal(body, &rawData); err != nil {
		http.Error(w, "Failed to parse portfolio data", http.StatusInternalServerError)
		return
	}
	log.Println(rawData)

	portfolioItems := make([]frontend.PortfolioItem, 0, len(rawData))

	for _, item := range rawData {
		amount := float64(item.Amount)
		var total_profit float64

		for _, profit := range item.ProfitDistributions {
			total_profit += float64(profit.Amount)
		}

		var roi float64
		if amount > 0 {
			roi = total_profit / amount
		}

		portfolioItems = append(portfolioItems, frontend.PortfolioItem{
			InvestmentID: item.ID,
			PitchID:      item.Pitch.PitchID,
			PitchTitle:   item.Pitch.Title,
			TargetAmount: item.Pitch.TargetAmount,
			RaisedAmount: item.Pitch.RaisedAmount,
			Status:       item.Pitch.Status,
			Multiplier:   item.Tier.Multiplier,
			TotalProfit:  total_profit,
			ROI:          roi,
			CreatedAt:    item.CreatedAt,
		})
	}

	portfolioResponse := frontend.PortfolioResponse{
		InvestorID: user_id,
		Items:      portfolioItems,
	}

	json.NewEncoder(w).Encode(portfolioResponse)
}
