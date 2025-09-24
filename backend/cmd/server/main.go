package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/routes"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Printf("No .env file found (skipping): %v", err)
	}

	if err = utils.InitJWTHS256(os.Getenv("SUPABASE_URL") + "/auth/v1"); err != nil {
		log.Fatal(err)
	}

	router := routes.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Println("Listening on :" + port)
	err = http.ListenAndServe(":"+port, router)
	if err != nil {
		panic(err)
	}
}
