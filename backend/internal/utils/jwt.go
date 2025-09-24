package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	issuer  string
	hmacKey []byte
)

// InitJWTHS256 sets up issuer and HMAC secret; fail if no secret.
func InitJWTHS256(issuerURL string) error {

	issuer = issuerURL
	secret := os.Getenv("SUPABASE_JWT_SECRET")
	if secret == "" {
		return errors.New("SUPABASE_JWT_SECRET must be set for HS256 setup")
	}
	hmacKey = []byte(secret)
	return nil
}

// VerifyJWTHS256 validates an HS256-signed Supabase JWT and returns the subject.
func VerifyJWTHS256(tokenStr string) (string, error) {
	if hmacKey == nil {
		return "", errors.New("JWT secret not configured")
	}

	claims := jwt.MapClaims{}
	tok, err := jwt.ParseWithClaims(
		tokenStr,
		claims,
		func(t *jwt.Token) (any, error) {
			if t.Method != jwt.SigningMethodHS256 {
				return nil, errors.New("unexpected signing method")
			}
			return hmacKey, nil
		},
		jwt.WithIssuer(issuer),
		jwt.WithLeeway(30*time.Second),
	)
	if err != nil || !tok.Valid {
		return "", errors.New("invalid or expired token")
	}

	sub, _ := claims["sub"].(string)
	if sub == "" {
		return "", errors.New("missing sub claim")
	}
	return sub, nil
}
