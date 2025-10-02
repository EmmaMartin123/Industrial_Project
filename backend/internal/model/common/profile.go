package model

type Profile struct {
	ID               string `json:"id"`
	Role             string `json:"role"`
	DisplayName      string `json:"display_name"`
	DashboardBalance *int64 `json:"dashboard_balance,omitempty"`
	Email            string `json:"email"`
}
