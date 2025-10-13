package auth

import (
	"log"
	"net/http"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

type MiddlewareFunc func(http.Handler) http.Handler

type Chain struct{ mws []MiddlewareFunc }

// creates a chain of middleware functions
func NewChain(mws ...MiddlewareFunc) Chain { return Chain{mws: mws} }

func (c Chain) Then(handler http.Handler) http.Handler {
	for i := len(c.mws) - 1; i >= 0; i-- {
		handler = c.mws[i](handler)
	}
	return handler
}

// logs the request method and uri
func LoggingMiddleware(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handler.ServeHTTP(w, r)
		log.Printf("%s %s", r.Method, r.RequestURI)
	})
}

// handles CORS requests
func CORSMiddleware(handler http.Handler) http.Handler {
	allowlist := utils.CORSAllowlist()
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if allowlist[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		handler.ServeHTTP(w, r)
	})
}

// authenticates the user
func AuthMiddleWare(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tok, err := utils.BearerFromRequest(r)
		if err != nil {
			utils.WriteError(w, err, http.StatusUnauthorized)
			return
		}
		uid, err := utils.VerifyJWTHS256(tok)
		if err != nil {
			utils.WriteError(w, err, http.StatusUnauthorized)
			return
		}
		ctx := utils.CtxWithUserID(r.Context(), uid)
		handler.ServeHTTP(w, r.WithContext(ctx))
	})
}
