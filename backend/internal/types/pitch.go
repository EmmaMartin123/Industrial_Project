package types

import "time"

type InvestmentTier struct {
	Name       string  `json:"name"`
	MinAmount  uint64  `json:"min_amount"`
	MaxAmount  uint64  `json:"max_amount"`
	Multiplier float64 `json:"multiplier"`
}

type Pitch struct {
	ProductTitle        string           `json:"product_title"`
	ElevatorPitch       string           `json:"elevator_pitch"`
	DetailedPitch       string           `json:"detailed_pitch"`
	TargetAmount        uint64           `json:"target_amount"`
	InvestmentEndDate   time.Time        `json:"investment_end_date"`
	InvestmentStartDate time.Time        `json:"investment_start_date"`
	ProfitSharePercent  float64          `json:"profit_share_percent"`
	InvestmentTiers     []InvestmentTier `json:"investment_tiers"`
}
