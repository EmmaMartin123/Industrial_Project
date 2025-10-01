package mapping

import (
	model "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/common"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/database"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/frontend"
)

func Pitch_ToDatabase(p frontend.Pitch, userID string) database.Pitch {
	raised_amount := 0
	if p.RaisedAmount != nil {
		raised_amount = *p.RaisedAmount
	}

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
		RaisedAmount:        raised_amount,
	}
}

func Pitch_ToFrontend(p database.Pitch, investmentTiers []model.InvestmentTier, media []frontend.PitchMedia) frontend.Pitch {
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
		RaisedAmount:        &p.RaisedAmount,
		Media:               media,
	}
}
