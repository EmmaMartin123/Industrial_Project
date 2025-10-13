package utils

import (
	"encoding/json"
	"fmt"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/database"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/frontend"
	mapping "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/mapping"
)

// gets the pitch media
func GetPitchMedia(pitchID int64) ([]frontend.PitchMedia, error) {
	query := fmt.Sprintf("pitch_id=eq.%d", pitchID)
	body, err := GetDataByQuery("pitch_media", query)
	if err != nil {
		fmt.Printf("error fetching pitch media from Supabase: %v\n", err)
		return nil, err
	}

	var dbMedia []database.PitchMedia
	if err = json.Unmarshal([]byte(body), &dbMedia); err != nil {
		fmt.Printf("error unmarshaling pitch media: %v\nbody: %s\n", err, string(body))
		return nil, err
	}

	frontendMedia := make([]frontend.PitchMedia, len(dbMedia))
	for i, media := range dbMedia {
		frontendMedia[i] = mapping.PitchMedia_ToFrontend(media)
	}

	return frontendMedia, nil
}
