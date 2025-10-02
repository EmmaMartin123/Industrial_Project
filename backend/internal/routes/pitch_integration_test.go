package routes_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/routes"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
	"github.com/joho/godotenv"
)

func load_dot_env() error {
	dir, err := os.Getwd()
	if err != nil {
		return err
	}

	for {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return godotenv.Load(filepath.Join(dir, ".env"))
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return godotenv.Load()
}

type supabase_login_response struct {
	AccessToken string `json:"access_token"`
}

func login_to_supabase(email, password string) (string, error) {
	login_url := os.Getenv("SUPABASE_URL") + "/auth/v1/token?grant_type=password"
	payload := map[string]string{
		"email":    email,
		"password": password,
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", login_url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", os.Getenv("SUPABASE_ANON_KEY"))

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		resp_body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("login failed: %d, body: %s", resp.StatusCode, string(resp_body))
	}

	var login_resp supabase_login_response
	if err := json.NewDecoder(resp.Body).Decode(&login_resp); err != nil {
		return "", err
	}

	if login_resp.AccessToken == "" {
		return "", fmt.Errorf("no access_token in response")
	}

	return login_resp.AccessToken, nil
}

func make_request(client *http.Client, method, url string, body []byte, token string) (*http.Response, error) {
	var req *http.Request
	var err error
	if body != nil {
		req, err = http.NewRequest(method, url, bytes.NewBuffer(body))
	} else {
		req, err = http.NewRequest(method, url, nil)
	}
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	return client.Do(req)
}

func decode_json_response(resp *http.Response, target interface{}) error {
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}
	return json.NewDecoder(resp.Body).Decode(target)
}

func TestPitchCRUD(t *testing.T) {
	if err := load_dot_env(); err != nil {
		t.Logf("Warning: failed to load .env: %v", err)
	}

	required := []string{
		"SUPABASE_URL",
		"SUPABASE_ANON_KEY",
		"SUPABASE_SERVICE_ROLE_KEY",
		"TEST_USER_EMAIL",
		"TEST_USER_PASSWORD",
	}
	for _, key := range required {
		if os.Getenv(key) == "" {
			t.Skipf("Skipping: %s not set", key)
		}
	}

	if err := utils.InitJWTHS256(os.Getenv("SUPABASE_URL") + "/auth/v1"); err != nil {
		t.Fatalf("Failed to initialize JWT: %v", err)
	}

	access_token, err := login_to_supabase(
		os.Getenv("TEST_USER_EMAIL"),
		os.Getenv("TEST_USER_PASSWORD"),
	)
	if err != nil {
		t.Fatalf("Failed to log in to Supabase: %v", err)
	}

	router := routes.SetupRouter()
	server := httptest.NewServer(router)
	defer server.Close()

	client := &http.Client{Timeout: 10 * time.Second}

	create_payload := map[string]interface{}{
		"title":                 "Test Product",
		"elevator_pitch":        "Short pitch",
		"detailed_pitch":        "Long detailed description",
		"target_amount":         10000,
		"investment_start_date": "2025-01-01",
		"investment_end_date":   "2025-12-31",
		"profit_share_percent":  15.5,
		"investment_tiers": []map[string]interface{}{
			{"name": "Bronze", "min_amount": 100, "multiplier": 1.1, "max_amount": 499},
			{"name": "Silver", "min_amount": 500, "multiplier": 1.25, "max_amount": 999},
		},
	}

	create_body, _ := json.Marshal(create_payload)
	resp, err := make_request(client, "POST", server.URL+"/api/pitch", create_body, access_token)
	if err != nil {
		t.Fatalf("Create request failed: %v", err)
	}

	var created_pitch map[string]interface{}
	if err := decode_json_response(resp, &created_pitch); err != nil {
		t.Fatalf("Create response error: %v", err)
	}

	pitch_id_float, ok := created_pitch["id"].(float64)
	if !ok {
		t.Fatalf("Missing or invalid 'id' in response: %v", created_pitch)
	}
	pitch_id := int64(pitch_id_float)

	defer func() {
		delete_url := fmt.Sprintf("%s/api/pitch?id=%d", server.URL, pitch_id)
		resp, err := make_request(client, "DELETE", delete_url, nil, access_token)
		if err != nil {
			t.Logf("Warning: failed to send DELETE request for cleanup: %v", err)
		} else if resp.StatusCode != http.StatusNoContent {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			t.Logf("Warning: DELETE cleanup failed with status %d: %s", resp.StatusCode, string(body))
		} else {
			t.Logf("Cleaned up pitch %d via DELETE route", pitch_id)
		}
	}()

	get_url := fmt.Sprintf("%s/api/pitch?id=%d", server.URL, pitch_id)
	resp, err = make_request(client, "GET", get_url, nil, access_token)
	if err != nil {
		t.Fatalf("Get request failed: %v", err)
	}

	var fetched_pitch map[string]interface{}
	if err := decode_json_response(resp, &fetched_pitch); err != nil {
		t.Fatalf("Get response error: %v", err)
	}

	if fetched_pitch["title"] != "Test Product" {
		t.Errorf("Expected title 'Test Product', got %v", fetched_pitch["title"])
	}

	tiers, ok := fetched_pitch["investment_tiers"].([]interface{})
	if !ok || len(tiers) != 2 {
		t.Fatalf("Expected 2 investment tiers, got %v", tiers)
	}

	update_payload := map[string]interface{}{
		"title":                 "Updated Product",
		"elevator_pitch":        "Updated short pitch",
		"detailed_pitch":        "Updated long description",
		"target_amount":         20000,
		"investment_start_date": "2025-02-01",
		"investment_end_date":   "2025-11-30",
		"profit_share_percent":  18.0,
		"investment_tiers": []map[string]interface{}{
			{"name": "Gold", "min_amount": 1000, "multiplier": 1.5, "max_amount": 5000},
		},
	}

	update_body, _ := json.Marshal(update_payload)
	resp, err = make_request(client, "PATCH", get_url, update_body, access_token)
	if err != nil {
		t.Fatalf("Update request failed: %v", err)
	}

	var updated_pitch map[string]interface{}
	if err := decode_json_response(resp, &updated_pitch); err != nil {
		t.Fatalf("Update response error: %v", err)
	}

	if updated_pitch["title"] != "Updated Product" {
		t.Errorf("Expected updated title 'Updated Product', got %v", updated_pitch["title"])
	}

	updated_tiers, ok := updated_pitch["investment_tiers"].([]interface{})
	if !ok || len(updated_tiers) != 1 {
		t.Fatalf("Expected 1 investment tier after update, got %v", updated_tiers)
	}

	tier := updated_tiers[0].(map[string]interface{})
	if tier["name"] != "Gold" {
		t.Errorf("Expected tier name 'Gold', got %v", tier["name"])
	}

	resp, err = make_request(client, "GET", get_url, nil, access_token)
	if err != nil {
		t.Fatalf("Final get request failed: %v", err)
	}

	var final_pitch map[string]interface{}
	if err := decode_json_response(resp, &final_pitch); err != nil {
		t.Fatalf("Final get response error: %v", err)
	}

	final_tiers, ok := final_pitch["investment_tiers"].([]interface{})
	if !ok || len(final_tiers) != 1 {
		t.Fatalf("Final check: expected 1 tier, got %v", final_tiers)
	}
}

func find_project_root() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", fmt.Errorf("project root with go.mod not found")
}

func TestPitchCRUDWithMedia(t *testing.T) {
	if err := load_dot_env(); err != nil {
		t.Logf("Warning: failed to load .env: %v", err)
	}

	required := []string{
		"SUPABASE_URL",
		"SUPABASE_ANON_KEY",
		"SUPABASE_SERVICE_ROLE_KEY",
		"TEST_USER_EMAIL",
		"TEST_USER_PASSWORD",
	}
	for _, key := range required {
		if os.Getenv(key) == "" {
			t.Skipf("Skipping: %s not set", key)
		}
	}

	if err := utils.InitJWTHS256(os.Getenv("SUPABASE_URL") + "/auth/v1"); err != nil {
		t.Fatalf("Failed to initialize JWT: %v", err)
	}

	access_token, err := login_to_supabase(
		os.Getenv("TEST_USER_EMAIL"),
		os.Getenv("TEST_USER_PASSWORD"),
	)
	if err != nil {
		t.Fatalf("Failed to log in to Supabase: %v", err)
	}

	router := routes.SetupRouter()
	server := httptest.NewServer(router)
	defer server.Close()

	client := &http.Client{Timeout: 10 * time.Second}

	root, err := find_project_root()
	if err != nil {
		t.Fatalf("Could not find project root: %v", err)
	}
	media_path := filepath.Join(root, "2FC508CF-F484-493F-957E-563EA16F0CC0_1_105_c.jpeg")
	if _, err := os.Stat(media_path); os.IsNotExist(err) {
		t.Fatalf("Test media file not found at %s", media_path)
	}

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)

	pitch_data := map[string]interface{}{
		"title":                 "Product with Media",
		"elevator_pitch":        "Pitch with image",
		"detailed_pitch":        "This pitch includes a real uploaded image.",
		"target_amount":         5000,
		"investment_start_date": "2025-03-01",
		"investment_end_date":   "2025-09-30",
		"profit_share_percent":  12.5,
		"investment_tiers": []map[string]interface{}{
			{"name": "Supporter", "min_amount": 50, "multiplier": 1.05, "max_amount": 200},
		},
	}
	pitch_bytes, _ := json.Marshal(pitch_data)
	if err := mw.WriteField("pitch", string(pitch_bytes)); err != nil {
		t.Fatalf("Failed to write pitch field: %v", err)
	}

	file, err := os.Open(media_path)
	if err != nil {
		t.Fatalf("Failed to open test media: %v", err)
	}
	defer file.Close()

	ext := filepath.Ext(media_path)
	media_type := mime.TypeByExtension(ext)
	if media_type == "" {
		media_type = "image/jpeg"
	}

	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition", `form-data; name="media"; filename="test_image.jpeg"`)
	h.Set("Content-Type", media_type)
	fw, err := mw.CreatePart(h)
	if err != nil {
		t.Fatalf("Failed to create form part: %v", err)
	}
	if _, err := io.Copy(fw, file); err != nil {
		t.Fatalf("Failed to copy file into form: %v", err)
	}

	if err := mw.Close(); err != nil {
		t.Fatalf("Failed to close multipart writer: %v", err)
	}

	req, err := http.NewRequest("POST", server.URL+"/api/pitch", &buf)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+access_token)

	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Create request with media failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("Expected 201 Created, got %d. Body: %s", resp.StatusCode, string(body))
	}

	var created_pitch map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&created_pitch); err != nil {
		t.Fatalf("Failed to decode created pitch: %v", err)
	}

	pitch_id_float, ok := created_pitch["id"].(float64)
	if !ok {
		t.Fatalf("Missing or invalid 'id' in response: %v", created_pitch)
	}
	pitch_id := int64(pitch_id_float)

	defer func() {
		delete_url := fmt.Sprintf("%s/api/pitch?id=%d", server.URL, pitch_id)
		resp, err := make_request(client, "DELETE", delete_url, nil, access_token)
		if err != nil {
			t.Logf("Warning: failed to send DELETE request for cleanup: %v", err)
		} else if resp.StatusCode != http.StatusNoContent {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			t.Logf("Warning: DELETE cleanup failed with status %d: %s", resp.StatusCode, string(body))
		} else {
			t.Logf("Cleaned up pitch %d (with media) via DELETE route", pitch_id)
		}
	}()

	media_raw, ok := created_pitch["media"].([]interface{})
	if !ok || len(media_raw) == 0 {
		t.Fatalf("Expected at least one media item, got: %v", created_pitch["media"])
	}

	media := media_raw[0].(map[string]interface{})
	if media["url"] == "" {
		t.Errorf("Media URL is empty")
	}
	if media["media_type"] != "image/jpeg" {
		t.Logf("Warning: expected media_type 'image/jpeg', got %v", media["media_type"])
	}
	if media["order_in_description"] != 1.0 {
		t.Errorf("Expected order_in_description=1, got %v", media["order_in_description"])
	}

	file_url := media["url"].(string)
	file_resp, err := http.Get(file_url)
	if err != nil {
		t.Fatalf("Failed to fetch uploaded media: %v", err)
	}
	defer file_resp.Body.Close()

	if file_resp.StatusCode != http.StatusOK {
		t.Errorf("Expected 200 OK for media URL, got %d", file_resp.StatusCode)
	}

	content_type := file_resp.Header.Get("Content-Type")
	if content_type != "image/jpeg" {
		t.Errorf("Expected Content-Type image/jpeg, got %s", content_type)
	}

	get_url := fmt.Sprintf("%s/api/pitch?id=%d", server.URL, pitch_id)
	resp, err = make_request(client, "GET", get_url, nil, access_token)
	if err != nil {
		t.Fatalf("GET after create failed: %v", err)
	}
	var fetched_pitch map[string]interface{}
	if err := decode_json_response(resp, &fetched_pitch); err != nil {
		t.Fatalf("GET response error: %v", err)
	}

	fetched_media, ok := fetched_pitch["media"].([]interface{})
	if !ok || len(fetched_media) == 0 {
		t.Fatalf("Media missing in GET response: %v", fetched_pitch)
	}

	t.Logf("Media upload and retrieval successful")
}
