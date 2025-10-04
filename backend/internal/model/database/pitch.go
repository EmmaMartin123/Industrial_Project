package database

type Pitch struct {
	PitchID             *int64  `json:"id,omitempty"`
	ProductTitle        string  `json:"title"`
	ElevatorPitch       string  `json:"elevator_pitch"`
	DetailedPitch       string  `json:"detailed_pitch"`
	TargetAmount        uint64  `json:"target_amount"`
	InvestmentEndDate   string  `json:"investment_end_date"`
	InvestmentStartDate string  `json:"investment_start_date"`
	ProfitSharePercent  float64 `json:"profit_share_percent"`
	UserID              string  `json:"user_id"`
	RaisedAmount        int64   `json:"raised_amount"`
	TagsID              int64   `json:"tags_id"`
}
