package mapping

import (
	model "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/common"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/database"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/frontend"
)

func Pitch_ToDatabase(p frontend.Pitch, userID string) database.Pitch {
	return database.Pitch{
		PitchID:             nil,
		ProductTitle:        p.ProductTitle,
		ElevatorPitch:       p.ElevatorPitch,
		DetailedPitch:       p.DetailedPitch,
		TargetAmount:        p.TargetAmount,
		InvestmentEndDate:   p.InvestmentEndDate,
		InvestmentStartDate: p.InvestmentStartDate,
		ProfitSharePercent:  p.ProfitSharePercent,
		UserID:              userID,
	}
}

func Pitch_ToFrontend(p database.Pitch, investmentTiers []model.InvestmentTier) frontend.Pitch {
	return frontend.Pitch{
		PitchID:             p.PitchID,
		ProductTitle:        p.ProductTitle,
		ElevatorPitch:       p.ElevatorPitch,
		DetailedPitch:       p.DetailedPitch,
		TargetAmount:        p.TargetAmount,
		InvestmentEndDate:   p.InvestmentEndDate,
		InvestmentStartDate: p.InvestmentStartDate,
		ProfitSharePercent:  p.ProfitSharePercent,
		UserID:              &p.UserID,
		InvestmentTiers:     investmentTiers,
	}
}
