package utils

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

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
