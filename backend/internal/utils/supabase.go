package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

func InsertData(data any, table string) (string, error) {
	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	url := SUPABASE_URL + "/rest/v1/" + table

	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation") // returns inserted rows

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to insert: status %d, body: %s", resp.StatusCode, string(body))
	}

	return string(body), err
}

func GetAllData(table string) ([]byte, error) {
	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	url := SUPABASE_URL + "/rest/v1/" + table

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch data: status %d, body: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

func GetDataByID(table string, id string) ([]byte, error) {
	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	url := fmt.Sprintf("%s/rest/v1/%s?id=eq.%s", SUPABASE_URL, table, id) // SUPABASE_URL/rest/v1/table?id=eq.id

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch by ID: status %d, body: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

func DeleteByID(table string, id string) error {
	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	url := fmt.Sprintf("%s/rest/v1/%s?id=eq.%s", SUPABASE_URL, table, id)

	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return err
	}

	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to delete: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

func GetDataByQuery(table string, query string) ([]byte, error) {
	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	url := fmt.Sprintf("%s/rest/v1/%s?%s", SUPABASE_URL, table, query) // SUPABASE_URL/rest/v1/table?query
	//fmt.Println("URL: ", url)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch by ID: status %d, body: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

func ReplaceByID(table string, id string, data any) ([]byte, error) {
	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	url := fmt.Sprintf("%s/rest/v1/%s?id=eq.%s", SUPABASE_URL, table, id)

	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("PATCH", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation") // return updated row

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to update by ID: status %d, body: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

type AuthUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

func GetAuthUserEmail(userID string) (string, error) {
	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if SUPABASE_URL == "" || SUPABASE_KEY == "" {
		return "", fmt.Errorf("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
	}

	url := fmt.Sprintf("%s/auth/v1/admin/users/%s", SUPABASE_URL, userID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to fetch auth user: %d, body: %s", resp.StatusCode, string(body))
	}

	var user AuthUser
	if err := json.Unmarshal(body, &user); err != nil {
		return "", fmt.Errorf("invalid auth user response: %w", err)
	}

	if user.Email == "" {
		return "", fmt.Errorf("email missing or invalid in auth user")
	}

	return user.Email, nil
}
