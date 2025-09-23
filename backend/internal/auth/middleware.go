package auth

import (
	"log"
	"net/http"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

type MiddlewareFunc func(http.Handler) http.Handler

type Chain struct{ mws []MiddlewareFunc }

func NewChain(mws ...MiddlewareFunc) Chain { return Chain{mws: mws} }

func (c Chain) Then(handler http.Handler) http.Handler {
	for i := len(c.mws) - 1; i >= 0; i-- {
		handler = c.mws[i](handler)
	}
	return handler
}

func LoggingMiddleware(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handler.ServeHTTP(w, r)
		log.Printf("%s %s", r.Method, r.RequestURI)
	})
}

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
