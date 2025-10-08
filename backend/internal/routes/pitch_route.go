package routes

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	model "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/common"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/database"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/frontend"
	mapping "github.com/EmmaMartin123/Industrial_Project/backend/internal/model/mapping"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/model/misc"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
	utilsdb "github.com/EmmaMartin123/Industrial_Project/backend/internal/utils/db"
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

const SOFT_MAX_MEDIA_RAM = 50 << 20

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

	if ok, _ := utilsdb.CheckUserRole(w, userID, "business"); !ok {
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
	uid, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	if ok, _ := utilsdb.CheckUserRole(w, uid, "business"); !ok {
		return
	}

	db_pitch := mapping.Pitch_ToDatabase(pitch, uid)
	db_pitch.CreatedAt = "now()"
	db_pitch.UpdatedAt = &db_pitch.CreatedAt

	result, err := utils.InsertData(db_pitch, "pitch")
	if err != nil {
		fmt.Printf("Error inserting pitch: %v\n", err)
		http.Error(w, "Error creating pitch", http.StatusInternalServerError)
		return
	}
	var ids []model.ID
	err = json.Unmarshal([]byte(result), &ids)
	if err != nil || len(ids) == 0 {
		http.Error(w, "Error decoding pitch ID", http.StatusInternalServerError)
		return
	}
	pitch_id := ids[0].ID

	for _, tier := range pitch.InvestmentTiers {
		tier.PitchID = pitch_id
		_, invest_err := utils.InsertData(tier, "investment_tier")
		if invest_err != nil {
			fmt.Printf("Warning: failed to insert investment tier: %v\n", invest_err)
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
				OrderInDescription: int64(i + 1),
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

	for _, tagName := range pitch.Tags {
		tagName = strings.TrimSpace(tagName)
		if tagName == "" {
			continue
		}
		tagQuery := fmt.Sprintf("name=eq.%s", url.QueryEscape(tagName))
		tagRes, err := utils.GetDataByQuery("tags", tagQuery)
		var tagID int64
		if err == nil && len(tagRes) > 2 {
			var tags []struct {
				ID int64 `json:"id"`
			}
			if json.Unmarshal(tagRes, &tags) == nil && len(tags) > 0 {
				tagID = tags[0].ID
			}
		}
		if tagID == 0 {
			createRes, err := utils.InsertData(map[string]interface{}{"name": tagName}, "tags")
			if err != nil {
				fmt.Printf("Failed to create tag '%s': %v\n", tagName, err)
				continue
			}
			var newTags []struct {
				ID int64 `json:"id"`
			}
			if json.Unmarshal([]byte(createRes), &newTags) == nil && len(newTags) > 0 {
				tagID = newTags[0].ID
			} else {
				continue
			}
		}
		_, err = utils.InsertData(map[string]interface{}{
			"pitch_id": pitch_id,
			"tag_id":   tagID,
		}, "pitch_tags")
		if err != nil {
			fmt.Printf("Failed to link pitch %d to tag %d: %v\n", pitch_id, tagID, err)
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

func GetRowCount(table string, queryParams []string) (int, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	apiKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	query := strings.Join(queryParams, "&")
	url := fmt.Sprintf("%s/rest/v1/%s?%s", supabaseURL, table, query)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return 0, err
	}

	req.Header.Set("apikey", apiKey)
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Prefer", "count=exact")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	contentRange := resp.Header.Get("Content-Range")
	if contentRange == "" {
		return 0, fmt.Errorf("missing Content-Range header")
	}

	parts := strings.Split(contentRange, "/")
	if len(parts) != 2 {
		return 0, fmt.Errorf("invalid Content-Range header: %s", contentRange)
	}

	total, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0, err
	}

	return total, nil
}

func get_pitch_route(w http.ResponseWriter, r *http.Request) {
	pitchID := r.URL.Query().Get("id")
	user_id := r.URL.Query().Get("user_id")
	search := r.URL.Query().Get("search")
	tags := r.URL.Query().Get("tags")
	target_amount := r.URL.Query().Get("target_amount")
	profit_share_percent := r.URL.Query().Get("profit_share_percent")
	investment_end_date := r.URL.Query().Get("investment_end_date")
	limit := r.URL.Query().Get("limit")
	offset := r.URL.Query().Get("offset")
	status := r.URL.Query().Get("status")
	orderBy := r.URL.Query().Get("orderBy")

	if pitchID == "" {
		var queryParams []string

		if search != "" {
			queryParams = append(queryParams, fmt.Sprintf("title=ilike.*%s*", url.QueryEscape(search)))
		}

		if user_id != "" {
			queryParams = append(queryParams, fmt.Sprintf("user_id=eq.%s", user_id))
		}

		if target_amount != "" {
			queryParams = append(queryParams, fmt.Sprintf("target_amount=eq.%s", target_amount))
		}

		if profit_share_percent != "" {
			queryParams = append(queryParams, fmt.Sprintf("profit_share_percent=eq.%s", profit_share_percent))
		}

		if investment_end_date != "" {
			queryParams = append(queryParams, fmt.Sprintf("investment_end_date=eq.%s", investment_end_date))
		}

		if status != "" {
			queryParams = append(queryParams, fmt.Sprintf("status=eq.%s", status))
		}

		limitValue := 0
		if limit != "" && orderBy == "" { // Only apply limit at DB level if not sorting
			if val, err := strconv.Atoi(limit); err == nil && val > 0 {
				limitValue = val
				queryParams = append(queryParams, fmt.Sprintf("limit=%d", limitValue))
			}
		}

		if offset != "" {
			offsetValue, err := strconv.Atoi(offset)
			if err == nil && offsetValue > 0 {
				queryParams = append(queryParams, fmt.Sprintf("offset=%d", offsetValue))
			}
		}

		if tags != "" {
			tagList := strings.Split(tags, ",")
			for i := range tagList {
				tagList[i] = strings.TrimSpace(tagList[i])
			}

			var validTagIDs []string
			for _, name := range tagList {
				if name == "" {
					continue
				}
				q := fmt.Sprintf("name=eq.%s", url.QueryEscape(name))
				res, err := utils.GetDataByQuery("tags", q)
				if err != nil {
					continue
				}
				var t []struct {
					ID int64 `json:"id"`
				}
				if json.Unmarshal(res, &t) == nil && len(t) > 0 {
					validTagIDs = append(validTagIDs, strconv.FormatInt(t[0].ID, 10))
				}
			}

			if len(validTagIDs) > 0 {
				var pitchIDs []string
				for _, tid := range validTagIDs {
					linkRes, err := utils.GetDataByQuery("pitch_tags", "tag_id=eq."+tid)
					if err != nil {
						continue
					}
					var links []struct {
						PitchID int64 `json:"pitch_id"`
					}
					if json.Unmarshal(linkRes, &links) == nil {
						for _, l := range links {
							pitchIDs = append(pitchIDs, strconv.FormatInt(l.PitchID, 10))
						}
					}
				}

				if len(pitchIDs) == 0 {
					w.Header().Set("Content-Type", "application/json")
					json.NewEncoder(w).Encode([]frontend.Pitch{})
					return
				}

				seen := make(map[string]bool)
				var unique []string
				for _, id := range pitchIDs {
					if !seen[id] {
						seen[id] = true
						unique = append(unique, id)
					}
				}
				queryParams = append(queryParams, "id=in.("+strings.Join(unique, ",")+")")
			} else {
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode([]frontend.Pitch{})
				return
			}
		}

		var result []byte
		var err error

		if len(queryParams) > 0 {
			query := strings.Join(queryParams, "&")
			result, err = utils.GetDataByQuery("pitch", query)
		} else {
			result, err = utils.GetAllData("pitch")
		}

		if err != nil {
			http.Error(w, "Error fetching pitches", http.StatusInternalServerError)
			return
		}

		var filtered_pitches []database.Pitch
		if err := json.Unmarshal(result, &filtered_pitches); err != nil {
			http.Error(w, "Error decoding pitches", http.StatusInternalServerError)
			return
		}

		totalCount, countErr := GetRowCount("pitch", queryParams)
		if countErr != nil {
			fmt.Printf("Warning: failed to count pitches: %v\n", countErr)
			totalCount = len(filtered_pitches)
		}

		var pitchIDs []string
		pitchIDMap := make(map[int64]database.Pitch)
		for _, pitch := range filtered_pitches {
			if pitch.PitchID != nil {
				pitchIDs = append(pitchIDs, strconv.FormatInt(*pitch.PitchID, 10))
				pitchIDMap[*pitch.PitchID] = pitch
			}
		}

		if len(pitchIDs) == 0 {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode([]frontend.Pitch{})
			return
		}

		investmentTiersMap := make(map[int64][]model.InvestmentTier)
		if len(pitchIDs) > 0 {
			query := fmt.Sprintf("pitch_id=in.(%s)", strings.Join(pitchIDs, ","))
			tiersData, err := utils.GetDataByQuery("investment_tier", query)
			if err == nil {
				var allTiers []model.InvestmentTier
				if json.Unmarshal(tiersData, &allTiers) == nil {
					for _, tier := range allTiers {
						investmentTiersMap[tier.PitchID] = append(investmentTiersMap[tier.PitchID], tier)
					}
				}
			}
		}

		mediaMap := make(map[int64][]frontend.PitchMedia)
		if len(pitchIDs) > 0 {
			query := fmt.Sprintf("pitch_id=in.(%s)", strings.Join(pitchIDs, ","))
			mediaData, err := utils.GetDataByQuery("pitch_media", query)
			if err == nil {
				var allMedia []frontend.PitchMedia
				if json.Unmarshal(mediaData, &allMedia) == nil {
					for _, media := range allMedia {
						if media.PitchID != nil {
							mediaMap[*media.PitchID] = append(mediaMap[*media.PitchID], media)
						}
					}
				}
			}
		}

		tagMap := make(map[int64][]string)
		tagIDsMap := make(map[int64][]int64) // pitch_id -> []tag_id

		if len(pitchIDs) > 0 {
			query := fmt.Sprintf("pitch_id=in.(%s)", strings.Join(pitchIDs, ","))
			tagLinksData, err := utils.GetDataByQuery("pitch_tags", query)
			if err == nil {
				var links []struct {
					PitchID int64 `json:"pitch_id"`
					TagID   int64 `json:"tag_id"`
				}

				if json.Unmarshal(tagLinksData, &links) == nil {
					// Collect all tag IDs
					var tagIDs []string
					tagIDSet := make(map[int64]bool)

					for _, link := range links {
						tagIDsMap[link.PitchID] = append(tagIDsMap[link.PitchID], link.TagID)
						if !tagIDSet[link.TagID] {
							tagIDSet[link.TagID] = true
							tagIDs = append(tagIDs, strconv.FormatInt(link.TagID, 10))
						}
					}

					if len(tagIDs) > 0 {
						query = fmt.Sprintf("id=in.(%s)", strings.Join(tagIDs, ","))
						tagsData, err := utils.GetDataByQuery("tags", query)
						if err == nil {
							var allTags []struct {
								ID   int64  `json:"id"`
								Name string `json:"name"`
							}

							if json.Unmarshal(tagsData, &allTags) == nil {
								tagNameMap := make(map[int64]string)
								for _, tag := range allTags {
									tagNameMap[tag.ID] = tag.Name
								}

								for pitchID, tagIDs := range tagIDsMap {
									for _, tagID := range tagIDs {
										if name, ok := tagNameMap[tagID]; ok {
											tagMap[pitchID] = append(tagMap[pitchID], name)
										}
									}
								}
							}
						}
					}
				}
			}
		}

		var pitches_to_send []frontend.Pitch
		for _, pitch := range filtered_pitches {
			if pitch.PitchID == nil {
				continue
			}

			pitchID := *pitch.PitchID
			investment_tiers := investmentTiersMap[pitchID]
			media := mediaMap[pitchID]
			tagNames := tagMap[pitchID]

			front := mapping.Pitch_ToFrontend(pitch, investment_tiers, media, tagNames)
			pitches_to_send = append(pitches_to_send, front)
		}

		if orderBy != "" {
			var sortConfig misc.SortConfig
			if err := json.Unmarshal([]byte(orderBy), &sortConfig); err == nil {
				sortPitchesByField(pitches_to_send, sortConfig.Field, sortConfig.Direction == "desc")

				if limit != "" {
					if val, err := strconv.Atoi(limit); err == nil && val > 0 && val < len(pitches_to_send) {
						pitches_to_send = pitches_to_send[:val]
					}
				}
			} else {
				fmt.Printf("Error parsing orderBy: %v\n", err)
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"totalCount": totalCount,
			"pitches":    pitches_to_send,
		})
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
		media = []frontend.PitchMedia{}
	}

	tagLinkRes, _ := utils.GetDataByQuery("pitch_tags", fmt.Sprintf("pitch_id=eq.%d", *pitch.PitchID))
	var links []struct {
		TagID int64 `json:"tag_id"`
	}
	json.Unmarshal(tagLinkRes, &links)
	var tag_names []string
	for _, l := range links {
		tag_res, _ := utils.GetDataByID("tags", strconv.FormatInt(l.TagID, 10))
		var tags []struct {
			Name string `json:"name"`
		}
		if json.Unmarshal(tag_res, &tags) == nil && len(tags) > 0 {
			tag_names = append(tag_names, tags[0].Name)
		}
	}

	pitch_to_send := mapping.Pitch_ToFrontend(pitch, investment_tiers, media, tag_names)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pitch_to_send)
}

func getMinimumTierPrice(tiers []model.InvestmentTier) float64 {
	if len(tiers) == 0 {
		return math.MaxFloat64
	}

	minPrice := math.MaxFloat64
	for _, tier := range tiers {
		price := float64(tier.MinAmount)
		if price < minPrice {
			minPrice = price
		}
	}

	return minPrice
}

func sortPitchesByPrice(pitches []frontend.Pitch, ascending bool) {
	if ascending {
		for i := 0; i < len(pitches)-1; i++ {
			for j := i + 1; j < len(pitches); j++ {
				priceI := getMinimumTierPrice(pitches[i].InvestmentTiers)
				priceJ := getMinimumTierPrice(pitches[j].InvestmentTiers)
				if priceI > priceJ {
					pitches[i], pitches[j] = pitches[j], pitches[i]
				}
			}
		}
	} else {
		for i := 0; i < len(pitches)-1; i++ {
			for j := i + 1; j < len(pitches); j++ {
				priceI := getMinimumTierPrice(pitches[i].InvestmentTiers)
				priceJ := getMinimumTierPrice(pitches[j].InvestmentTiers)
				if priceI < priceJ {
					pitches[i], pitches[j] = pitches[j], pitches[i]
				}
			}
		}
	}
}

func update_pitch_route(w http.ResponseWriter, r *http.Request) {
	pitchIDStr := r.URL.Query().Get("id")
	if pitchIDStr == "" {
		http.Error(w, "Pitch not specified", http.StatusBadRequest)
		return
	}
	pitchID, err := strconv.ParseInt(pitchIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid pitch ID", http.StatusBadRequest)
		return
	}

	result, err := utils.GetDataByID("pitch", pitchIDStr)
	if err != nil {
		http.Error(w, "Pitch not found", http.StatusNotFound)
		return
	}
	var pitches []database.Pitch
	if err := json.Unmarshal([]byte(result), &pitches); err != nil || len(pitches) != 1 {
		http.Error(w, "Error decoding pitch", http.StatusInternalServerError)
		fmt.Println("Body: ", string(result))
		return
	}
	fmt.Println("Pitches: ", pitches)

	old_pitch := pitches[0]
	user_id, ok := utils.UserIDFromCtx(r.Context())
	if !ok || user_id != old_pitch.UserID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	fmt.Println("User ID: ", user_id)
	if ok, _ := utilsdb.CheckUserRole(w, user_id, "business"); !ok {
		return
	}

	// Parse new pitch data
	contentType := r.Header.Get("Content-Type")
	var new_pitch frontend.Pitch
	if strings.HasPrefix(contentType, "multipart/form-data") {
		if err := r.ParseMultipartForm(SOFT_MAX_MEDIA_RAM); err != nil {
			http.Error(w, "Error parsing form", http.StatusBadRequest)
			return
		}
		pitchData := r.FormValue("pitch")
		if err := json.Unmarshal([]byte(pitchData), &new_pitch); err != nil {
			http.Error(w, "Invalid pitch data", http.StatusBadRequest)
			return
		}
	} else {
		if err := json.NewDecoder(r.Body).Decode(&new_pitch); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()
	}
	fmt.Println("New pitch: ", new_pitch)

	if old_pitch.Status != "Draft" {
		old_tiers, _ := get_investment_tiers(old_pitch)
		new_pitch.InvestmentTiers = old_tiers
	}

	old_tiers, _ := get_investment_tiers(old_pitch)
	old_media, _ := utils.GetPitchMedia(pitchID)

	fmt.Println("Old pitch: ", old_pitch)

	to_db := mapping.Pitch_ToDatabase(new_pitch, user_id)
	to_db.PitchID = nil
	to_db.CreatedAt = "now()"
	to_db.UpdatedAt = &to_db.CreatedAt
	fmt.Println("To db: ", to_db)
	_, err = utils.UpdateByID("pitch", pitchIDStr, to_db)
	if err != nil {
		http.Error(w, "Failed to update pitch", http.StatusInternalServerError)
		return
	}

	if old_pitch.Status == "Draft" {
		for _, t := range old_tiers {
			if t.ID != nil {
				utils.DeleteByID("investment_tier", strconv.FormatInt(*t.ID, 10))
			}
		}
		for _, tier := range new_pitch.InvestmentTiers {
			tier.PitchID = pitchID
			utils.InsertData(tier, "investment_tier")
		}
	}

	utils.DeletePitchTags(pitchID)
	for _, tagName := range new_pitch.Tags {
		tagName = strings.TrimSpace(tagName)
		if tagName == "" {
			continue
		}
		tagQuery := fmt.Sprintf("name=eq.%s", url.QueryEscape(tagName))
		tagRes, err := utils.GetDataByQuery("tags", tagQuery)
		var tagID int64
		if err == nil && len(tagRes) > 2 {
			var tags []struct {
				ID int64 `json:"id"`
			}
			if json.Unmarshal(tagRes, &tags) == nil && len(tags) > 0 {
				tagID = tags[0].ID
			}
		}
		if tagID == 0 {
			createRes, err := utils.InsertData(map[string]interface{}{"name": tagName}, "tags")
			if err != nil {
				continue
			}
			var newTags []struct {
				ID int64 `json:"id"`
			}
			if json.Unmarshal([]byte(createRes), &newTags) == nil && len(newTags) > 0 {
				tagID = newTags[0].ID
			} else {
				continue
			}
		}
		utils.InsertData(map[string]interface{}{
			"pitch_id": pitchID,
			"tag_id":   tagID,
		}, "pitch_tags")
	}

	keep_media_ids := make(map[int64]bool)
	for _, m := range new_pitch.Media {
		if m.ID != nil {
			keep_media_ids[*m.ID] = true
		}
	}
	for _, m := range old_media {
		if m.ID != nil && !keep_media_ids[*m.ID] {
			utils.DeleteFileFromS3(m.URL)
			utils.DeleteByID("pitch_media", strconv.FormatInt(*m.ID, 10))
		}
	}

	var media_files []frontend.PitchMedia
	if strings.HasPrefix(contentType, "multipart/form-data") {
		files := r.MultipartForm.File["media"]
		for i, fh := range files {
			file, _ := fh.Open()
			ext := filepath.Ext(fh.Filename)
			mediaType := "image/jpeg"
			if ct, ok := fh.Header["Content-Type"]; ok && len(ct) > 0 {
				mediaType = ct[0]
			}
			fileName := utils.GenerateUniqueFileName(fmt.Sprintf("pitch_%d", pitchID), ext)
			url, _ := utils.UploadFileToS3(file, fileName, mediaType)
			file.Close()
			entry := frontend.PitchMedia{
				PitchID:            &pitchID,
				URL:                url,
				MediaType:          mediaType,
				OrderInDescription: int64(i + 1),
			}
			utils.InsertData(mapping.PitchMedia_ToDatabase(entry, pitchID), "pitch_media")
			media_files = append(media_files, entry)
		}
	}
	for i, m := range new_pitch.Media {
		if m.ID != nil && keep_media_ids[*m.ID] {
			media_files = append(media_files, m)
			continue
		}
		if m.URL == "" {
			continue
		}
		if m.OrderInDescription == 0 {
			m.OrderInDescription = int64(i + 1)
		}
		m.PitchID = &pitchID
		res, _ := utils.InsertData(mapping.PitchMedia_ToDatabase(m, pitchID), "pitch_media")
		var ids []model.ID
		if json.Unmarshal([]byte(res), &ids) == nil && len(ids) > 0 {
			m.ID = &ids[0].ID
		}
		media_files = append(media_files, m)
	}

	tagLinkRes, _ := utils.GetDataByQuery("pitch_tags", fmt.Sprintf("pitch_id=eq.%d", pitchID))
	var links []struct {
		TagID int64 `json:"tag_id"`
	}
	json.Unmarshal(tagLinkRes, &links)
	var tagNames []string
	for _, l := range links {
		tagRes, _ := utils.GetDataByID("tags", strconv.FormatInt(l.TagID, 10))
		var tags []struct {
			Name string `json:"name"`
		}
		if json.Unmarshal(tagRes, &tags) == nil && len(tags) > 0 {
			tagNames = append(tagNames, tags[0].Name)
		}
	}

	response := new_pitch
	response.PitchID = &pitchID
	response.Media = media_files
	response.Tags = tagNames

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func update_pitch_status_route(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pitchIDStr := r.URL.Query().Get("id")
	if pitchIDStr == "" {
		http.Error(w, "Pitch ID is required", http.StatusBadRequest)
		return
	}

	var payload struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if payload.Status == "" {
		http.Error(w, "Status is required", http.StatusBadRequest)
		return
	}

	userID, ok := utils.UserIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if ok, _ := utilsdb.CheckUserRole(w, userID, "business"); !ok {
		return
	}

	updateData := map[string]interface{}{
		"status": payload.Status,
	}

	_, err := utils.UpdateByID("pitch", pitchIDStr, updateData)
	if err != nil {
		http.Error(w, "Failed to update status", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Pitch status updated successfully",
	})
}

func DeletePitchTags(pitchID int64) error {
	query := fmt.Sprintf("pitch_id=eq.%d", pitchID)
	url := fmt.Sprintf("%s/rest/v1/pitch_tags?%s", os.Getenv("SUPABASE_URL"), query)
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return err
	}
	key := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", "Bearer "+key)
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete pitch_tags failed: %d, body: %s", resp.StatusCode, string(body))
	}
	return nil
}

func sortPitchesByField(pitches []frontend.Pitch, field string, descending bool) {
	sort.Slice(pitches, func(i, j int) bool {
		var result bool

		switch field {
		case "title":
			result = pitches[i].ProductTitle < pitches[j].ProductTitle
		case "target_amount":
			result = pitches[i].TargetAmount < pitches[j].TargetAmount
		case "profit_share_percent":
			result = pitches[i].ProfitSharePercent < pitches[j].ProfitSharePercent
		case "raised_amount":
			result = pitches[i].RaisedAmount < pitches[j].RaisedAmount
		case "investment_start_date":
			result = pitches[i].InvestmentStartDate < pitches[j].InvestmentStartDate
		case "investment_end_date":
			result = pitches[i].InvestmentEndDate < pitches[j].InvestmentEndDate
		case "price":
			result = getMinimumTierPrice(pitches[i].InvestmentTiers) < getMinimumTierPrice(pitches[j].InvestmentTiers)
		default:
			return false
		}

		if descending {
			return !result
		}
		return result
	})
}
