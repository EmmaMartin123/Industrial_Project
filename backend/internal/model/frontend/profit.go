package frontend

type Profit struct {
	PitchID     int64   `json:"pitch_id"`
	PeriodStart string  `json:"period_start"`
	PeriodEnd   string  `json:"period_end"`
	TotalProfit float64 `json:"total_profit"`
}
