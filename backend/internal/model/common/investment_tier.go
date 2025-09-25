package model

type InvestmentTier struct {
	Name       string  `json:"name"`
	MinAmount  uint64  `json:"min_amount"`
	Multiplier float64 `json:"multiplier"`
	PitchID    int64   `json:"pitch_id"`
}
