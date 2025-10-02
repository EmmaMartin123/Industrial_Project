package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	model "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/common"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/database"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/frontend"
	mapping "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/mapping"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

func pitch_route(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		create_pitch_route(w, r)
	case http.MethodGet:
		get_pitch_route(w, r)
	case http.MethodPatch:
		update_pitch_route(w, r)
	case http.MethodDelete:
		delete_pitch_route(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

const SOFT_MAX_MEDIA_RAM = 50 << 20 // 50 MB limit for storing parsed media in ram, >500MB store using temp files

func delete_pitch_route(w http.ResponseWriter, r *http.Request) {
	pitch_id_str := r.URL.Query().Get("id")
	if pitch_id_str == "" {
		http.Error(w, "Pitch ID is required", http.StatusBadRequest)
		return
	}

	result, err := utils.GetDataByID("pitch", pitch_id_str)
	if err != nil {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}

	var pitches []database.Pitch
	if err := json.Unmarshal([]byte(result), &pitches); err != nil {
		http.Error(w, "Error decoding pitch", http.StatusInternalServerError)
		return
	}

	if len(pitches) != 1 {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}

	pitch := pitches[0]
	userID, ok := utils.UserIDFromCtx(r.Context())
	if !ok || userID != pitch.UserID {
		http.Error(w, "Unauthorised", http.StatusUnauthorized)
		return
	}

	investmentTiers, err := get_investment_tiers(pitch)
	if err != nil {
		http.Error(w, "Failed to fetch investment tiers", http.StatusInternalServerError)
		return
	}

	for _, tier := range investmentTiers {
		if tier.ID == nil {
			continue
		}
		if err := utils.DeleteByID("investment_tier", strconv.Itoa(int(*tier.ID))); err != nil {
			fmt.Printf("Warning: failed to delete investment tier %d: %v\n", *tier.ID, err)
		}
	}

	media, media_err := utils.GetPitchMedia(*pitch.PitchID)
	if media_err != nil {
		fmt.Printf("Warning: failed to fetch media for pitch %d: %v\n", *pitch.PitchID, media_err)
	} else {
		for _, item := range media {
			if err := utils.DeleteFileFromS3(item.URL); err != nil {
				fmt.Printf("Warning: failed to delete file from S3: %v\n", err)
			}

			if item.ID != nil {
				if err := utils.DeleteByID("pitch_media", strconv.Itoa(int(*item.ID))); err != nil {
					fmt.Printf("Warning: failed to delete media %d from database: %v\n", *item.ID, err)
				}
			}
		}
	}

	if err := utils.DeleteByID("pitch", pitch_id_str); err != nil {
		http.Error(w, "Failed to delete pitch", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func create_pitch_route(w http.ResponseWriter, r *http.Request) {
	contentType := r.Header.Get("Content-Type")

	var pitch frontend.Pitch
	var err error

	if strings.HasPrefix(contentType, "multipart/form-data") {
		if err := r.ParseMultipartForm(SOFT_MAX_MEDIA_RAM); err != nil {
			http.Error(w, "Error parsing form", http.StatusBadRequest)
			return
		}

		pitchData := r.FormValue("pitch")
		if pitchData == "" {
			http.Error(w, "No pitch data provided", http.StatusBadRequest)
			return
		}

		if err := json.Unmarshal([]byte(pitchData), &pitch); err != nil {
			http.Error(w, "Invalid pitch data", http.StatusBadRequest)
			return
		}
	} else {
		if err := json.NewDecoder(r.Body).Decode(&pitch); err != nil {
			http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()
	}

	uid, _ := utils.UserIDFromCtx(r.Context())
	db_pitch := mapping.Pitch_ToDatabase(pitch, uid)
	result, err := utils.InsertData(db_pitch, "pitch")

	if err != nil {
		http.Error(w, "Error creating pitch", http.StatusInternalServerError)
		return
	}

	var ids []model.ID
	err = json.Unmarshal([]byte(result), &ids)
	if err != nil {
		http.Error(w, "Error decoding IDs", http.StatusInternalServerError)
		return
	}

	pitch_id := ids[0].ID

	for _, tier := range pitch.InvestmentTiers {
		tier.PitchID = pitch_id
		_, invest_err := utils.InsertData(tier, "investment_tier")
		if invest_err != nil {
			fmt.Printf("Error inserting investment tier: %v\n", invest_err)
		}
	}

	var media_files []frontend.PitchMedia

	if strings.HasPrefix(contentType, "multipart/form-data") {
		files := r.MultipartForm.File["media"]
		for i, fileHeader := range files {
			file, err := fileHeader.Open()
			if err != nil {
				fmt.Printf("Error opening file: %v\n", err)
				continue
			}

			ext := filepath.Ext(fileHeader.Filename)
			mediaType := "application/octet-stream"
			if contentTypes, ok := fileHeader.Header["Content-Type"]; ok && len(contentTypes) > 0 {
				mediaType = contentTypes[0]
			}

			fileName := utils.GenerateUniqueFileName(fmt.Sprintf("pitch_%d", pitch_id), ext)

			fileURL, err := utils.UploadFileToS3(file, fileName, mediaType)
			file.Close()

			if err != nil {
				fmt.Printf("Error uploading file: %v\n", err)
				continue
			}

			mediaEntry := frontend.PitchMedia{
				PitchID:            &pitch_id,
				URL:                fileURL,
				MediaType:          mediaType,
				OrderInDescription: int64(i + 1), // 1-based index for ordering
			}

			dbMedia := mapping.PitchMedia_ToDatabase(mediaEntry, pitch_id)
			_, err = utils.InsertData(dbMedia, "pitch_media")
			if err != nil {
				fmt.Printf("Error saving media metadata: %v\n", err)
				continue
			}

			media_files = append(media_files, mediaEntry)
		}
	} else if len(pitch.Media) > 0 {
		for i, media := range pitch.Media {
			if media.URL == "" {
				fmt.Printf("Skipping empty media entry\n")
				continue
			}

			if media.OrderInDescription == 0 {
				media.OrderInDescription = int64(i + 1)
			}

			media.PitchID = &pitch_id
			dbMedia := mapping.PitchMedia_ToDatabase(media, pitch_id)
			_, err = utils.InsertData(dbMedia, "pitch_media")
			if err != nil {
				fmt.Printf("Error saving media metadata: %v\n", err)
				continue
			}

			media_files = append(media_files, media)
		}
	}

	pitch.PitchID = &pitch_id
	pitch.Media = media_files

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(pitch)
}

func get_investment_tiers(db_pitch database.Pitch) ([]model.InvestmentTier, error) {
	var investment_tiers []model.InvestmentTier
	query := fmt.Sprintf("pitch_id=eq.%d", *db_pitch.PitchID)
	body, err := utils.GetDataByQuery("investment_tier", query)
	if err != nil {
		fmt.Printf("error fetching data from Supabase: %v\n", err)
		return nil, err
	}

	if err = json.Unmarshal([]byte(body), &investment_tiers); err != nil {
		fmt.Printf("error unmarshaling investment_tiers: %v\nbody: %s\n", err, string(body))
		return nil, err
	}

	return investment_tiers, nil
}

func get_pitch_route(w http.ResponseWriter, r *http.Request) {
	pitchID := r.URL.Query().Get("id")
	user_id := r.URL.Query().Get("user_id")

	if pitchID == "" {
		result, err := utils.GetAllData("pitch")
		if err != nil {
			http.Error(w, "Error fetching pitches", http.StatusInternalServerError)
			return
		}

		var pitches_from_database []database.Pitch
		if err := json.Unmarshal([]byte(result), &pitches_from_database); err != nil {
			http.Error(w, "Error decoding pitches", http.StatusInternalServerError)
			return
		}

		if user_id != "" {
			var filtered_pitches []database.Pitch
			for _, pitch := range pitches_from_database {
				if pitch.UserID == user_id {
					filtered_pitches = append(filtered_pitches, pitch)
				}
			}
			pitches_from_database = filtered_pitches
		}

		var pitches_to_send []frontend.Pitch
		for _, pitch := range pitches_from_database {
			investment_tiers, invest_err := get_investment_tiers(pitch)
			if invest_err != nil {
				http.Error(w, "Error decoding investment tiers", http.StatusInternalServerError)
				return
			}

			media, media_err := utils.GetPitchMedia(*pitch.PitchID)
			if media_err != nil {
				fmt.Printf("Warning: failed to fetch media for pitch %d: %v\n", *pitch.PitchID, media_err)
				media = []frontend.PitchMedia{} // Empty array instead of nil
			}

			pitches_to_send = append(pitches_to_send, mapping.Pitch_ToFrontend(pitch, investment_tiers, media))
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(pitches_to_send)
		return
	}

	result, err := utils.GetDataByID("pitch", pitchID)
	if err != nil {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}

	var pitches []database.Pitch
	if err := json.Unmarshal([]byte(result), &pitches); err != nil {
		http.Error(w, "Error decoding pitch", http.StatusInternalServerError)
		fmt.Println("Body: ", string(result))
		return
	}

	if len(pitches) != 1 {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}

	pitch := pitches[0]

	investment_tiers, invest_err := get_investment_tiers(pitch)
	if invest_err != nil {
		http.Error(w, "Error decoding investment tiers", http.StatusInternalServerError)
		return
	}

	media, media_err := utils.GetPitchMedia(*pitch.PitchID)
	if media_err != nil {
		fmt.Printf("Warning: failed to fetch media for pitch %d: %v\n", *pitch.PitchID, media_err)
		media = []frontend.PitchMedia{} // Empty array instead of nil
	}

	pitch_to_send := mapping.Pitch_ToFrontend(pitch, investment_tiers, media)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pitch_to_send)
}

func update_pitch_route(w http.ResponseWriter, r *http.Request) {
	pitchID := r.URL.Query().Get("id")

	if pitchID == "" {
		http.Error(w, "Pitch not specified", http.StatusBadRequest)
		return
	}

	result, err := utils.GetDataByID("pitch", pitchID)
	if err != nil {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}

	var pitches []database.Pitch
	if err := json.Unmarshal([]byte(result), &pitches); err != nil {
		http.Error(w, "Error decoding pitch", http.StatusInternalServerError)
		fmt.Println("Body: ", string(result))
		return
	}

	old_pitch := pitches[0]

	old_investment_tiers, invest_err := get_investment_tiers(old_pitch)
	if invest_err != nil {
		http.Error(w, "Error decoding investment tiers", http.StatusInternalServerError)
		return
	}

	old_media, media_err := utils.GetPitchMedia(*old_pitch.PitchID)
	if media_err != nil {
		fmt.Printf("Warning: failed to fetch media for pitch %d: %v\n", *old_pitch.PitchID, media_err)
		old_media = []frontend.PitchMedia{} // Empty array instead of nil
	}

	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok || user_id != old_pitch.UserID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	contentType := r.Header.Get("Content-Type")
	var new_pitch frontend.Pitch

	if strings.HasPrefix(contentType, "multipart/form-data") {
		if err := r.ParseMultipartForm(SOFT_MAX_MEDIA_RAM); err != nil {
			http.Error(w, "Error parsing form", http.StatusBadRequest)
			return
		}

		pitchData := r.FormValue("pitch")
		if pitchData == "" {
			http.Error(w, "No pitch data provided", http.StatusBadRequest)
			return
		}

		if err := json.Unmarshal([]byte(pitchData), &new_pitch); err != nil {
			http.Error(w, "Invalid pitch data", http.StatusBadRequest)
			return
		}
	} else {
		if err := json.NewDecoder(r.Body).Decode(&new_pitch); err != nil {
			http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()
	}

	to_db_pitch := mapping.Pitch_ToDatabase(new_pitch, user_id)

	for _, tier := range old_investment_tiers {
		id := tier.ID
		invest_err := utils.DeleteByID("investment_tier", strconv.Itoa(int(*id)))
		if invest_err != nil {
			fmt.Printf("Error deleting investment tier %d: %v\n", *id, invest_err)
		}
	}

	for _, tier := range new_pitch.InvestmentTiers {
		tier.PitchID = *old_pitch.PitchID
		_, invest_err := utils.InsertData(tier, "investment_tier")
		if invest_err != nil {
			fmt.Printf("Error inserting investment tier: %v\n", invest_err)
		}
	}

	keep_media_ids := make(map[int64]bool)
	for _, media := range new_pitch.Media {
		if media.ID != nil {
			keep_media_ids[*media.ID] = true
		}
	}

	for _, media := range old_media {
		if media.ID != nil && !keep_media_ids[*media.ID] {
			if err := utils.DeleteFileFromS3(media.URL); err != nil {
				fmt.Printf("Warning: failed to delete file from S3: %v\n", err)
			}

			if err := utils.DeleteByID("pitch_media", strconv.Itoa(int(*media.ID))); err != nil {
				fmt.Printf("Warning: failed to delete media %d from database: %v\n", *media.ID, err)
			}
		}
	}

	var media_files []frontend.PitchMedia

	if strings.HasPrefix(contentType, "multipart/form-data") {
		files := r.MultipartForm.File["media"]
		for i, fileHeader := range files {
			file, err := fileHeader.Open()
			if err != nil {
				fmt.Printf("Error opening file: %v\n", err)
				continue
			}

			ext := filepath.Ext(fileHeader.Filename)
			mediaType := "application/octet-stream"
			if contentTypes, ok := fileHeader.Header["Content-Type"]; ok && len(contentTypes) > 0 {
				mediaType = contentTypes[0]
			}

			fileName := utils.GenerateUniqueFileName(fmt.Sprintf("pitch_%d", *old_pitch.PitchID), ext)

			fileURL, err := utils.UploadFileToS3(file, fileName, mediaType)
			file.Close()

			if err != nil {
				fmt.Printf("Error uploading file: %v\n", err)
				continue
			}

			mediaEntry := frontend.PitchMedia{
				PitchID:            old_pitch.PitchID,
				URL:                fileURL,
				MediaType:          mediaType,
				OrderInDescription: int64(i + 1), // 1-based index for ordering
			}

			dbMedia := mapping.PitchMedia_ToDatabase(mediaEntry, *old_pitch.PitchID)
			_, err = utils.InsertData(dbMedia, "pitch_media")
			if err != nil {
				fmt.Printf("Error saving media metadata: %v\n", err)
				continue
			}

			media_files = append(media_files, mediaEntry)
		}
	}

	for i, media := range new_pitch.Media {
		if media.ID != nil && keep_media_ids[*media.ID] {
			media_files = append(media_files, media)
			continue
		}

		if media.URL == "" {
			continue
		}

		if strings.HasPrefix(media.URL, "data:") {
			fmt.Printf("Base64 image uploads no longer supported\n")
			continue
		}

		if media.OrderInDescription == 0 {
			media.OrderInDescription = int64(i + 1)
		}

		media.PitchID = old_pitch.PitchID
		dbMedia := mapping.PitchMedia_ToDatabase(media, *old_pitch.PitchID)
		result, err := utils.InsertData(dbMedia, "pitch_media")
		if err != nil {
			fmt.Printf("Error saving media metadata: %v\n", err)
			continue
		}

		var ids []model.ID
		if err = json.Unmarshal([]byte(result), &ids); err == nil && len(ids) > 0 {
			mediaID := ids[0].ID
			media.ID = &mediaID
		}

		media_files = append(media_files, media)
	}

	_, update_err := utils.ReplaceByID("pitch", strconv.Itoa(int(*old_pitch.PitchID)), to_db_pitch)
	if update_err != nil {
		fmt.Printf("Error updating pitch: %v\n", update_err)
		http.Error(w, "Error updating pitch", http.StatusInternalServerError)
		return
	}

	new_pitch.Media = media_files

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(mapping.Pitch_ToFrontend(to_db_pitch, new_pitch.InvestmentTiers, media_files))
}
