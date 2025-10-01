package utils

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	bucketName = "pitch_files"
)

func UploadFileToS3(file multipart.File, fileName string, mediaType string) (string, error) {
	storageURL := strings.TrimSuffix(os.Getenv("SUPABASE_S3_URL"), "/")
	projectURL := strings.TrimSuffix(os.Getenv("SUPABASE_URL"), "/")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	apiKey := os.Getenv("SUPABASE_ANON_KEY")

	if storageURL == "" || projectURL == "" || serviceKey == "" {
		return "", errors.New("missing Supabase configuration")
	}
	if apiKey == "" {
		apiKey = serviceKey
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		return "", err
	}

	uploadURL := strings.TrimSuffix(storageURL, "/storage/v1/s3")
	if !strings.Contains(uploadURL, "/storage/v1") {
		uploadURL = fmt.Sprintf("%s/storage/v1", uploadURL)
	}

	req, err := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/object/%s/%s", uploadURL, bucketName, fileName),
		bytes.NewReader(fileBytes),
	)
	if err != nil {
		return "", err
	}

	if mediaType == "" {
		mediaType = "application/octet-stream"
	}

	req.Header.Set("Content-Type", mediaType)
	req.Header.Set("Authorization", "Bearer "+serviceKey)
	req.Header.Set("apikey", apiKey)
	req.Header.Set("x-upsert", "false")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to upload file: status %d, body: %s", resp.StatusCode, string(body))
	}

	return fmt.Sprintf("%s/storage/v1/object/public/%s/%s", projectURL, bucketName, fileName), nil
}

func DeleteFileFromS3(fileURL string) error {
	storageURL := strings.TrimSuffix(os.Getenv("SUPABASE_S3_URL"), "/")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	apiKey := os.Getenv("SUPABASE_ANON_KEY")

	if storageURL == "" || serviceKey == "" {
		return errors.New("missing Supabase configuration")
	}
	if apiKey == "" {
		apiKey = serviceKey
	}

	fileName := filepath.Base(fileURL)
	if fileName == "" {
		return errors.New("invalid file URL")
	}

	uploadURL := strings.TrimSuffix(storageURL, "/storage/v1/s3")
	if !strings.Contains(uploadURL, "/storage/v1") {
		uploadURL = fmt.Sprintf("%s/storage/v1", uploadURL)
	}

	req, err := http.NewRequest("DELETE", fmt.Sprintf("%s/object/%s/%s", uploadURL, bucketName, fileName), nil)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+serviceKey)
	req.Header.Set("apikey", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to delete file: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

func GenerateUniqueFileName(prefix, extension string) string {
	return fmt.Sprintf("%s_%d%s", prefix, time.Now().UTC().UnixNano(), extension)
}
