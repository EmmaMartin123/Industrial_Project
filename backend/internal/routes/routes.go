package routes

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/auth"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

func SetupRouter() http.Handler {
	base := auth.NewChain(
		auth.LoggingMiddleware,
		auth.CORSMiddleware,
	)

	protected := auth.NewChain(
		auth.AuthMiddleWare,
	)

	mux := http.NewServeMux()
	mux.Handle("/api/pitch", protected.Then(http.HandlerFunc(pitch_route)))
	mux.Handle("/api/profile", protected.Then(http.HandlerFunc(profile_route)))
	mux.Handle("/api/investment", protected.Then(http.HandlerFunc(investment_route)))
	mux.Handle("/api/wallet", protected.Then(http.HandlerFunc(wallet_route)))
	mux.Handle("/api/bank", protected.Then(http.HandlerFunc(bank_route)))

	fmt.Println("Router setup complete")
	return base.Then(mux)
}

func not_implemented_route(w http.ResponseWriter) {
	utils.WriteError(w,
		errors.New("route not implemented"),
		http.StatusNotImplemented,
	)
}
