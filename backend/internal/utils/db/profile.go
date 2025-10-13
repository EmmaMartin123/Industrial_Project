package utils

import (
	"encoding/json"
	"fmt"
	"net/http"

	model "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/common"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

// gets the user profile
func GetUserProfile(userID string) (model.Profile, error) {
	profileQuery := fmt.Sprintf("id=eq.%s", userID)
	profileResult, err := utils.GetDataByQuery("profile", profileQuery)
	if err != nil {
		return model.Profile{}, fmt.Errorf("error fetching user profile: %w", err)
	}

	var profiles []model.Profile
	if err := json.Unmarshal(profileResult, &profiles); err != nil {
		return model.Profile{}, fmt.Errorf("error decoding profile data: %w", err)
	}

	if len(profiles) == 0 {
		return model.Profile{}, fmt.Errorf("user profile not found")
	}

	return profiles[0], nil
}

// CheckUserRole verifies if a user has the required role and handles error responses
// Returns true if the user has the required role and the user's profile
func CheckUserRole(w http.ResponseWriter, userID string, requiredRole string) (bool, model.Profile) {
	profile, err := GetUserProfile(userID)
	if err != nil {
		if err.Error() == "user profile not found" {
			http.Error(w, "User profile not found", http.StatusNotFound)
		} else {
			http.Error(w, "Error fetching user profile", http.StatusInternalServerError)
		}
		return false, model.Profile{}
	}

	if profile.Role != requiredRole {
		http.Error(w, fmt.Sprintf("Only %s users can perform this action", requiredRole), http.StatusForbidden)
		return false, model.Profile{}
	}

	return true, profile
}
