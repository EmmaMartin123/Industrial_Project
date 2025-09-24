package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type TestData struct {
	ID string `json:"id"`
}

func InsertData(data interface{}, table string) (error, string) {
	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	url := SUPABASE_URL + "/rest/v1/" + table

	jsonData, err := json.Marshal(data)
	if err != nil {
		return err, ""
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return err, ""
	}

	req.Header.Set("apikey", SUPABASE_KEY)
	req.Header.Set("Authorization", "Bearer "+SUPABASE_KEY)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation") // returns inserted rows

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err, ""
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to insert: status %d, body: %s", resp.StatusCode, string(body)), ""
	}

	return nil, string(body)
}
