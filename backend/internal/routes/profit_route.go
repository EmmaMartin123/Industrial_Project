package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/database"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/frontend"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

func profit_route(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		declare_profit_route(w, r)
	case http.MethodGet:
		get_profit_route(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func declare_profit_route(w http.ResponseWriter, r *http.Request) {
	var req frontend.Profit

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if req.PitchID <= 0 || req.TotalProfit <= 0 {
		http.Error(w, "pitch_id and total_profit must be positive", http.StatusBadRequest)
		return
	}

	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	pitch_body, err := utils.GetDataByID("pitch", strconv.FormatInt(req.PitchID, 10))
	if err != nil {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}
	var pitches []database.Pitch
	if err := json.Unmarshal(pitch_body, &pitches); err != nil || len(pitches) != 1 {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}
	if pitches[0].UserID != user_id {
		http.Error(w, "Unauthorized: you do not own this pitch", http.StatusUnauthorized)
		return
	}

	distributable_amount := req.TotalProfit * (pitches[0].ProfitSharePercent / 100.0)

	profit := database.Profit{
		PitchID:             req.PitchID,
		DeclaredBy:          user_id,
		PeriodStart:         req.PeriodStart,
		PeriodEnd:           req.PeriodEnd,
		TotalProfit:         req.TotalProfit,
		DistributableAmount: distributable_amount,
		Transferred:         false,
	}

	result, err := utils.InsertData(profit, "profits")
	if err != nil {
		utils.WriteError(w, fmt.Errorf("failed to declare profit: %w", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(result))
}

func get_profit_route(w http.ResponseWriter, r *http.Request) {
	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	profit_id := r.URL.Query().Get("id")
	pitch_id_str := r.URL.Query().Get("pitch_id")

	if profit_id != "" {
		body, err := utils.GetDataByID("profits", profit_id)
		if err != nil {
			http.Error(w, "Profit not found", http.StatusNotFound)
			return
		}
		var profits []database.Profit
		if err := json.Unmarshal(body, &profits); err != nil || len(profits) != 1 {
			http.Error(w, "Profit not found", http.StatusNotFound)
			return
		}
		profit := profits[0]

		pitch_body, err := utils.GetDataByID("pitch", strconv.FormatInt(profit.PitchID, 10))
		if err != nil {
			http.Error(w, "Associated pitch not found", http.StatusNotFound)
			return
		}
		var pitches []database.Pitch
		if err := json.Unmarshal(pitch_body, &pitches); err != nil || len(pitches) != 1 {
			http.Error(w, "Associated pitch not found", http.StatusNotFound)
			return
		}
		if pitches[0].UserID != user_id {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profits)
		return
	}

	if pitch_id_str != "" {
		pitch_body, err := utils.GetDataByID("pitch", pitch_id_str)
		if err != nil {
			http.Error(w, "Pitch not found", http.StatusNotFound)
			return
		}
		var pitches []database.Pitch
		if err := json.Unmarshal(pitch_body, &pitches); err != nil || len(pitches) != 1 {
			http.Error(w, "Pitch not found", http.StatusNotFound)
			return
		}
		if pitches[0].UserID != user_id {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		body, err := utils.GetDataByQuery("profits", "pitch_id=eq."+pitch_id_str)
		if err != nil {
			utils.WriteError(w, fmt.Errorf("failed to fetch profits: %w", err), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
		return
	}

	pitch_body, err := utils.GetDataByQuery("pitch", "user_id=eq."+user_id)
	if err != nil {
		utils.WriteError(w, fmt.Errorf("failed to fetch user pitches: %w", err), http.StatusInternalServerError)
		return
	}
	var user_pitches []database.Pitch
	if err := json.Unmarshal(pitch_body, &user_pitches); err != nil {
		utils.WriteError(w, fmt.Errorf("failed to decode user pitches: %w", err), http.StatusInternalServerError)
		return
	}

	if len(user_pitches) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("[]"))
		return
	}

	var pitch_ids []string
	for _, p := range user_pitches {
		pitch_ids = append(pitch_ids, strconv.FormatInt(*p.PitchID, 10))
	}
	pitch_id_list := strings.Join(pitch_ids, ",")
	query := "pitch_id=in.(" + pitch_id_list + ")"

	body, err := utils.GetDataByQuery("profits", query)
	if err != nil {
		utils.WriteError(w, fmt.Errorf("failed to fetch profits: %w", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}
