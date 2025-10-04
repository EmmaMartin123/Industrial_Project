package model

type Investment struct {
	ID         *int64 `json:"id,omitempty"`
	PitchID    *int64 `json:"pitch_id,omitempty"`
	InvestorID string `json:"investor_id"`
	TierID     *int64 `json:"tier_id,omitempty"`
	Amount     int64  `json:"amount"`
	Refunded   bool   `json:"refunded"`
	CreatedAt  string `json:"created_at,omitempty"`
}
