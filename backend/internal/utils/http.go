package utils

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"
)

func CORSAllowlist() map[string]bool {
	allowlist := make(map[string]bool)
	if origins := os.Getenv("CORS_ALLOWLIST"); origins != "" {
		for origin := range strings.SplitSeq(origins, ",") {
			allowlist[strings.TrimSpace(origin)] = true
		}
	}
	return allowlist
}

func WriteError(w http.ResponseWriter, err error, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
}

func BearerFromRequest(r *http.Request) (string, error) {
	h := r.Header.Get("Authorization")
	if !strings.HasPrefix(h, "Bearer ") {
		return "", errors.New("missing bearer token")
	}
	return strings.TrimPrefix(h, "Bearer "), nil
}
