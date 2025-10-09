package frontend

type PortfolioResponse struct {
    InvestorID string          `json:"investor_id"`
    Items      []PortfolioItem `json:"items"`
}

type PortfolioItem struct {
	InvestmentID int64 `json:"investment_id,omitempty"`
	PitchID       int64 `json:"pitch_id,omitempty"`
	PitchTitle    string `json:"pitch_title"`
	TargetAmount  int64 `json:"target_amount"`
	RaisedAmount  int64 `json:"raised_amount"`
	Status        string `json:"status,omitempty"`
	Multiplier    float64 `json:"multiplier"`
	TotalProfit   float64 `json:"total_profit"`
	ROI           float64 `json:"roi"`
	CreatedAt     string `json:"created_at,omitempty"`
}

type PitchSlim struct {
	PitchID int64 `json:"id"`
	Title string `json:"title"`
	TargetAmount int64 `json:"target_amount"`
	RaisedAmount int64 `json:"raised_amount"`
	Status string `json:"status"`
}
type TierSlim struct {
	Name       string  `json:"name"`
	Multiplier float64 `json:"multiplier"`
}
type DistRow struct {
	Amount float64     `json:"amount"`
	Paid   bool        `json:"paid"`
}
type InvRow struct {
	ID                  int64     `json:"id"`
	Amount              int64 	  `json:"amount"`
	CreatedAt           string    `json:"created_at"`
	Pitch               PitchSlim `json:"pitch"`
	Tier                TierSlim  `json:"tier"`
	ProfitDistributions []DistRow `json:"profit_distributions"`
}
