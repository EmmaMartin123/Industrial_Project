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

	err := utils.InsertData(db_pitch, "pitch")

	if err != nil {
		fmt.Println("Error inserting data:", err)
	} else {
		fmt.Println("Inserted successfully!")
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(db_pitch)

}

func get_pitch_route(w http.ResponseWriter, r *http.Request) {
	not_implemented_route(w)
}
