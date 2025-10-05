package database

type Profit struct {
	ID                  int64   `json:"id,omitempty"`
	PitchID             int64   `json:"pitch_id"`
	DeclaredBy          string  `json:"declared_by"`
	PeriodStart         string  `json:"period_start"`
	PeriodEnd           string  `json:"period_end"`
	TotalProfit         float64 `json:"total_profit"`
	DistributableAmount float64 `json:"distributable_amount"`
	Transferred         bool    `json:"transferred"`
	CreatedAt           string  `json:"created_at,omitempty"`
}
