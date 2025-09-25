package types

type InvestmentTier struct {
	Name       string  `json:"name"`
	MinAmount  uint64  `json:"min_amount"`
	Multiplier float64 `json:"multiplier"`
	PitchID    int64   `json:"pitch_id"`
}

type NewPitch struct {
	ProductTitle        string           `json:"title"`
	ElevatorPitch       string           `json:"elevator_pitch"`
	DetailedPitch       string           `json:"detailed_pitch"`
	TargetAmount        uint64           `json:"target_amount"`
	InvestmentEndDate   string           `json:"investment_end_date"`
	InvestmentStartDate string           `json:"investment_start_date"`
	ProfitSharePercent  float64          `json:"profit_share_percent"`
	InvestmentTiers     []InvestmentTier `json:"investment_tiers"`
}

type DatabasePitch struct {
	PitchID             *int    `json:"id,omitempty"`
	ProductTitle        string  `json:"title"`
	ElevatorPitch       string  `json:"elevator_pitch"`
	DetailedPitch       string  `json:"detailed_pitch"`
	TargetAmount        uint64  `json:"target_amount"`
	InvestmentEndDate   string  `json:"investment_end_date"`
	InvestmentStartDate string  `json:"investment_start_date"`
	ProfitSharePercent  float64 `json:"profit_share_percent"`
	UserID              string  `json:"user_id"`
}

func NewPitchToDatabasePitch(np NewPitch, userID string) DatabasePitch {
	return DatabasePitch{
		PitchID:             nil,
		ProductTitle:        np.ProductTitle,
		ElevatorPitch:       np.ElevatorPitch,
		DetailedPitch:       np.DetailedPitch,
		TargetAmount:        np.TargetAmount,
		InvestmentEndDate:   np.InvestmentEndDate,
		InvestmentStartDate: np.InvestmentStartDate,
		ProfitSharePercent:  np.ProfitSharePercent,
		UserID:              userID,
	}
}

type ID struct {
	ID int64 `json:"id"`
}
