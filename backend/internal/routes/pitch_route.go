package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	model "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/common"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/database"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/frontend"
	mapping "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/mapping"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

func pitch_route(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		create_pitch_route(w, r)
	case http.MethodGet:
		get_pitch_route(w, r)
	case http.MethodPatch:
		update_pitch_route(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func create_pitch_route(w http.ResponseWriter, r *http.Request) {
	var pitch frontend.Pitch
	if err := json.NewDecoder(r.Body).Decode(&pitch); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(pitch)

	uid, _ := utils.UserIDFromCtx(r.Context())

	db_pitch := mapping.Pitch_ToDatabase(pitch, uid)

	result, err := utils.InsertData(db_pitch, "pitch")

	if err != nil {
		// TODO: return error
		fmt.Println("Error inserting data:", err)
	} else {
		fmt.Println("Inserted successfully!")
	}

	var ids []model.ID

	err = json.Unmarshal([]byte(result), &ids)
	if err != nil {
		panic(err)
	}

	pitch_id := ids[0].ID

	for _, tier := range pitch.InvestmentTiers {
		tier.PitchID = pitch_id
		_, invest_err := utils.InsertData(tier, "investment_tier")
		if invest_err != nil {
			fmt.Println("Error inserting data:", err)
		} else {
			fmt.Println("Inserted successfully!")
			// TODO: return error
		}
	}

	json.NewEncoder(w).Encode(db_pitch)
}

func get_investment_tiers(db_pitch database.Pitch) ([]model.InvestmentTier, error) {
	var investment_tiers []model.InvestmentTier
	query := fmt.Sprintf("pitch_id=eq.%d", *db_pitch.PitchID)
	body, err := utils.GetDataByQuery("investment_tier", query)
	if err != nil {
		fmt.Printf("error fetching data from Supabase: %v\n", err)
		return nil, err
	}

	if err = json.Unmarshal([]byte(body), &investment_tiers); err != nil {
		fmt.Printf("error unmarshaling investment_tiers: %v\nbody: %s\n", err, string(body))
		return nil, err
	}

	return investment_tiers, nil
}

func get_pitch_route(w http.ResponseWriter, r *http.Request) {
	pitchID := r.URL.Query().Get("id")

	if pitchID == "" {
		result, err := utils.GetAllData("pitch")
		if err != nil {
			http.Error(w, "Error fetching pitches", http.StatusInternalServerError)
			return
		}

		var pitches_from_database []database.Pitch
		if err := json.Unmarshal([]byte(result), &pitches_from_database); err != nil {
			http.Error(w, "Error decoding pitches", http.StatusInternalServerError)
			return
		}

		var pitches_to_send []frontend.Pitch
		for _, pitch := range pitches_from_database {
			investment_tiers, invest_err := get_investment_tiers(pitch)
			if invest_err != nil {
				http.Error(w, "Error decoding investment tiers", http.StatusInternalServerError)
				return
			}

			pitches_to_send = append(pitches_to_send, mapping.Pitch_ToFrontend(pitch, investment_tiers))
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(pitches_to_send)
		return
	}

	result, err := utils.GetDataByID("pitch", pitchID)
	if err != nil {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}

	var pitches []database.Pitch
	if err := json.Unmarshal([]byte(result), &pitches); err != nil {
		http.Error(w, "Error decoding pitch", http.StatusInternalServerError)
		fmt.Println("Body: ", string(result))
		return
	}

	if len(pitches) != 1 {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}

	pitch := pitches[0]

	investment_tiers, invest_err := get_investment_tiers(pitch)
	if invest_err != nil {
		http.Error(w, "Error decoding investment tiers", http.StatusInternalServerError)
		return
	}

	pitch_to_send := mapping.Pitch_ToFrontend(pitch, investment_tiers)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pitch_to_send)
}

func update_pitch_route(w http.ResponseWriter, r *http.Request) {
	pitchID := r.URL.Query().Get("id")

	if pitchID == "" {
		http.Error(w, "Pitch not specified", http.StatusBadRequest)
		return
	}

	result, err := utils.GetDataByID("pitch", pitchID)
	if err != nil {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}

	var pitches []database.Pitch
	if err := json.Unmarshal([]byte(result), &pitches); err != nil {
		http.Error(w, "Error decoding pitch", http.StatusInternalServerError)
		fmt.Println("Body: ", string(result))
		return
	}

	old_pitch := pitches[0]

	old_investment_tiers, invest_err := get_investment_tiers(old_pitch)
	if invest_err != nil {
		http.Error(w, "Error decoding investment tiers", http.StatusInternalServerError)
		return
	}

	user_id, ok := utils.UserIDFromCtx(r.Context())

	if !ok || user_id != old_pitch.UserID {
		http.Error(w, "Invalid Pitch ID", http.StatusBadRequest)
	}

	var new_pitch frontend.Pitch
	if err := json.NewDecoder(r.Body).Decode(&new_pitch); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	//TODO: check if what is being changed is valid?
	to_db_pitch := mapping.Pitch_ToDatabase(new_pitch, user_id)

	for _, tier := range old_investment_tiers {
		id := tier.ID
		_, invest_err := utils.DeleteByID("investment_tier", strconv.Itoa(*id))
		if invest_err != nil {
			fmt.Println("Error deleting data:", err)
		} else {
			fmt.Println("Deleted successfully!")
			// TODO: return error
		}
	}

	for _, tier := range new_pitch.InvestmentTiers {
		tier.PitchID = *old_pitch.PitchID
		_, invest_err := utils.InsertData(tier, "investment_tier")
		if invest_err != nil {
			fmt.Println("Error inserting data:", err)
		} else {
			fmt.Println("Inserted successfully!")
			// TODO: return error
		}
	}

	//TODO: log this
	_, update_err := utils.ReplaceByID("pitch", strconv.Itoa(*old_pitch.PitchID), to_db_pitch)

	if update_err != nil {
		fmt.Println("Error deleting data:", err)
	} else {
		fmt.Println("Deleted successfully!")
		// TODO: return error
	}

	json.NewEncoder(w).Encode(to_db_pitch)
}
