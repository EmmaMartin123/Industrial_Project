package mapping

import (
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/database"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/frontend"
)

func PitchMedia_ToDatabase(m frontend.PitchMedia, pitchID int) database.PitchMedia {
	return database.PitchMedia{
		ID:                 m.ID,
		PitchID:            pitchID,
		URL:                m.URL,
		MediaType:          m.MediaType,
		OrderInDescription: m.OrderInDescription,
	}
}

func PitchMedia_ToFrontend(m database.PitchMedia) frontend.PitchMedia {
	return frontend.PitchMedia{
		ID:                 m.ID,
		PitchID:            &m.PitchID,
		URL:                m.URL,
		MediaType:          m.MediaType,
		OrderInDescription: m.OrderInDescription,
	}
}
