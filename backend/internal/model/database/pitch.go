package database

type Pitch struct {
	PitchID             *int64  `json:"id,omitempty"`
	CreatedAt           string  `json:"created_at"`
	Title               string  `json:"title"`
	ElevatorPitch       string  `json:"elevator_pitch"`
	DetailedPitch       string  `json:"detailed_pitch"`
	TargetAmount        uint64  `json:"target_amount"`
	ProfitSharePercent  float64 `json:"profit_share_percent"`
	UserID              string  `json:"user_id"`
	RaisedAmount        int64   `json:"raised_amount"`
	InvestmentStartDate string  `json:"investment_start_date"`
	InvestmentEndDate   string  `json:"investment_end_date"`
	UpdatedAt           *string `json:"updated_at,omitempty"`
	Status              string  `json:"status"`
}
