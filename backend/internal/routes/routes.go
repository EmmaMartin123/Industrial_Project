package routes

import (
	"fmt"
	"net/http"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/auth"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

func SetupRouter() http.Handler {
	protected := auth.NewChain(
		auth.LoggingMiddleware,
		auth.AuthMiddleWare,
	)

	mux := http.NewServeMux()

	mux.Handle("/api/testroute", protected.Then(http.HandlerFunc(testroute)))

	fmt.Println("Router setup complete")
	return mux
}

func testroute(w http.ResponseWriter, r *http.Request) {
	uid, _ := utils.UserIDFromCtx(r.Context())
	fmt.Fprintf(w, "Hello %s", uid)
}
