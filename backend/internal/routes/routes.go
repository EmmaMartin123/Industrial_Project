package routes

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/auth"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/types"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

func SetupRouter() http.Handler {
	base := auth.NewChain(
		auth.LoggingMiddleware,
		auth.CORSMiddleware,
	)

	protected := auth.NewChain(
		auth.AuthMiddleWare,
	)

	mux := http.NewServeMux()
	mux.Handle("/api/testroute", protected.Then(http.HandlerFunc(testroute)))
	mux.Handle("/api/pitch", protected.Then(http.HandlerFunc(pitch_route)))

	fmt.Println("Router setup complete")
	return base.Then(mux)
}

func not_implemented_route(w http.ResponseWriter) {
	utils.WriteError(w,
		errors.New("route not implemented"),
		http.StatusNotImplemented,
	)
}

func testroute(w http.ResponseWriter, r *http.Request) {
	uid, _ := utils.UserIDFromCtx(r.Context())
	fmt.Fprintf(w, "Hello %s", uid)
}

func pitch_route(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		create_pitch_route(w, r)
	case http.MethodGet:
		get_pitch_route(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func create_pitch_route(w http.ResponseWriter, r *http.Request) {
	var pitch types.NewPitch
	if err := json.NewDecoder(r.Body).Decode(&pitch); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(pitch)

	uid, _ := utils.UserIDFromCtx(r.Context())

	db_pitch := types.NewPitchToDatabasePitch(pitch, uid)

	err, result := utils.InsertData(db_pitch, "pitch")

	if err != nil {
		fmt.Println("Error inserting data:", err)
	} else {
		fmt.Println("Inserted successfully!")
		//TODO: return error
	}

	var ids []types.ID

	err = json.Unmarshal([]byte(result), &ids)
	if err != nil {
		panic(err)
	}

	pitch_id := ids[0].ID

	for _, tier := range pitch.InvestmentTiers {
		tier.PitchID = pitch_id
		invest_err, _ := utils.InsertData(tier, "investment_tier")
		if invest_err != nil {
			fmt.Println("Error inserting data:", err)
		} else {
			fmt.Println("Inserted successfully!")
			//TODO: return error
		}
	}

	json.NewEncoder(w).Encode(db_pitch)

}

func get_pitch_route(w http.ResponseWriter, r *http.Request) {
	pitchID := r.URL.Query().Get("pitch_id")

	if pitchID == "" {
		result, err := utils.GetAllData("pitch")
		if err != nil {
			http.Error(w, "Error fetching pitches", http.StatusInternalServerError)
			return
		}

		var pitches []types.DatabasePitch
		if err := json.Unmarshal([]byte(result), &pitches); err != nil {
			http.Error(w, "Error decoding pitches", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(pitches)
		return
	}

	result, err := utils.GetDataByID("pitch", pitchID)
	if err != nil {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}

	var pitch []types.DatabasePitch
	if err := json.Unmarshal([]byte(result), &pitch); err != nil {
		http.Error(w, "Error decoding pitch", http.StatusInternalServerError)
		fmt.Println("Body: ", string(result))
		return
	}

	if len(pitch) != 1 {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pitch[0])
}
