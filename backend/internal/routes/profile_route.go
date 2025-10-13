package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	model "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/common"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

func profile_route(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		get_profile_route(w, r)
	case http.MethodPost:
		create_profile_route(w, r)
	case http.MethodPatch:
		update_profile_route(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// creates the profile for the user
func create_profile_route(w http.ResponseWriter, r *http.Request) {
	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		DisplayName string `json:"display_name"`
		Role        string `json:"role"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.DisplayName == "" || req.Role == "" {
		http.Error(w, "display_name and role are required", http.StatusBadRequest)
		return
	}

	email, err := utils.GetAuthUserEmail(user_id)
	if err != nil {
		fmt.Printf("Error fetching email for user %s: %v\n", user_id, err)
		http.Error(w, "Failed to fetch user email from auth", http.StatusInternalServerError)
		return
	}

	balance := int64(0)
	profile := model.Profile{
		ID:               user_id,
		Email:            email,
		DisplayName:      req.DisplayName,
		Role:             req.Role,
		DashboardBalance: &balance,
	}

	_, err = utils.InsertData(profile, "profile")
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "409") {
			http.Error(w, "Profile already exists", http.StatusConflict)
			return
		}
		http.Error(w, "Failed to create profile", http.StatusInternalServerError)
		fmt.Printf("Error creating profile user %s: %v\n", user_id, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(profile)
}

// gets the profile for the user
func get_profile_route(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	auth_user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	requested_id := r.URL.Query().Get("id")

	if requested_id == "" {
		body, err := utils.GetAllData("profile")
		if err != nil {
			http.Error(w, "Failed to fetch profiles", http.StatusInternalServerError)
			return
		}

		var profiles []model.Profile
		if err := json.Unmarshal(body, &profiles); err != nil {
			http.Error(w, "Invalid profile data", http.StatusInternalServerError)
			return
		}

		for i := range profiles {
			profiles[i].DashboardBalance = nil
		}

		json.NewEncoder(w).Encode(profiles)
		return
	}

	body, err := utils.GetDataByID("profile", requested_id)
	if err != nil {
		http.Error(w, "Profile not found", http.StatusNotFound)
		return
	}

	var profiles []model.Profile
	if err := json.Unmarshal(body, &profiles); err != nil || len(profiles) != 1 {
		http.Error(w, "Invalid profile data", http.StatusInternalServerError)
		return
	}

	profile := profiles[0]

	if profile.ID != auth_user_id {
		profile.DashboardBalance = nil
	}

	json.NewEncoder(w).Encode(profile)
}

func update_profile_route(w http.ResponseWriter, r *http.Request) {
	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		DisplayName *string `json:"display_name,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	payload := make(map[string]interface{})
	if req.DisplayName != nil {
		payload["display_name"] = *req.DisplayName
	}

	if len(payload) == 0 {
		http.Error(w, "No valid fields to update", http.StatusBadRequest)
		return
	}

	_, err := utils.UpdateByID("profile", user_id, payload)
	if err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	body, err := utils.GetDataByID("profile", user_id)
	if err != nil {
		http.Error(w, "Profile missing after update", http.StatusNotFound)
		return
	}

	var profiles []model.Profile
	if err := json.Unmarshal(body, &profiles); err != nil || len(profiles) != 1 {
		http.Error(w, "Invalid updated profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profiles[0])
}
