package model

type ProfitDistribution struct {
	ProfitID     int64   `json:"profit_id"`
	InvestmentID int64   `json:"investment_id"`
	InvestorID   string  `json:"investor_id"`
	Shares       float64 `json:"shares"`
	Amount       float64 `json:"amount"`
	Paid         bool    `json:"paid"`
}
