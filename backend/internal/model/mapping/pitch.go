package mapping

import (
	model "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/common"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/database"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/frontend"
)

func Pitch_ToDatabase(p frontend.Pitch, user_id string) database.Pitch {
	raised_amount := int64(0)
	if p.RaisedAmount != nil {
		raised_amount = *p.RaisedAmount
	}

	return database.Pitch{
		PitchID:             p.PitchID,
		Title:               p.ProductTitle,
		ElevatorPitch:       p.ElevatorPitch,
		DetailedPitch:       p.DetailedPitch,
		TargetAmount:        p.TargetAmount,
		ProfitSharePercent:  p.ProfitSharePercent,
		UserID:              user_id,
		RaisedAmount:        raised_amount,
		InvestmentStartDate: p.InvestmentStartDate,
		InvestmentEndDate:   p.InvestmentEndDate,
		UpdatedAt:           p.UpdatedAt,
		Status:              p.Status,
	}
}

func Pitch_ToFrontend(p database.Pitch, investment_tiers []model.InvestmentTier, media []frontend.PitchMedia, tags []string) frontend.Pitch {
	userID := p.UserID

	return frontend.Pitch{
		PitchID:             p.PitchID,
		ProductTitle:        p.Title,
		ElevatorPitch:       p.ElevatorPitch,
		DetailedPitch:       p.DetailedPitch,
		TargetAmount:        p.TargetAmount,
		InvestmentEndDate:   p.InvestmentEndDate,
		InvestmentStartDate: p.InvestmentStartDate,
		ProfitSharePercent:  p.ProfitSharePercent,
		UserID:              &userID,
		InvestmentTiers:     investment_tiers,
		RaisedAmount:        &p.RaisedAmount,
		Media:               media,
		Tags:                tags,
		UpdatedAt:           p.UpdatedAt,
		Status:              p.Status,
	}
}
