package frontend

import (
	model "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/common"
)

type Pitch struct {
	PitchID             *int64                 `json:"id,omitempty"`
	ProductTitle        string                 `json:"title"`
	ElevatorPitch       string                 `json:"elevator_pitch"`
	DetailedPitch       string                 `json:"detailed_pitch"`
	TargetAmount        uint64                 `json:"target_amount"`
	InvestmentEndDate   string                 `json:"investment_end_date"`
	InvestmentStartDate string                 `json:"investment_start_date"`
	ProfitSharePercent  float64                `json:"profit_share_percent"`
	InvestmentTiers     []model.InvestmentTier `json:"investment_tiers"`
	UserID              *string                `json:"user_id,omitempty"`
	RaisedAmount        uint64                 `json:"raised_amount,omitempty"`
	Media               []PitchMedia           `json:"media,omitempty"`
	Tags                []string               `json:"tags,omitempty"`
	UpdatedAt           *string                `json:"updated_at,omitempty"`
	Status              string                 `json:"status"`
}
