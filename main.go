package main

import (
	"encoding/json"
	"net/http"
	"regexp"
)

// Simule une BDD en mémoire
var users = map[string]string{
	"alice": "Alice123!",
	"bob":   "Bob456@",
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type Response struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	json.NewDecoder(r.Body).Decode(&req)
	w.Header().Set("Content-Type", "application/json")

	storedPassword, userExists := users[req.Username]

	if !userExists {
		// Username inconnu → message générique
		json.NewEncoder(w).Encode(Response{Message: "Invalid credentials.", Success: false})
		return
	}

	if storedPassword != req.Password {
		// Username connu mais mauvais mot de passe → message différent (faille !)
		json.NewEncoder(w).Encode(Response{Message: "Username or password incorrect.", Success: false})
		return
	}

	json.NewEncoder(w).Encode(Response{Message: "Connexion réussie !", Success: true})
}

func signupHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	json.NewDecoder(r.Body).Decode(&req)
	w.Header().Set("Content-Type", "application/json")

	// Validation du mot de passe avec regex
	rules := []struct {
		pattern string
		msg     string
	}{
		{`[A-Z]`, "une majuscule requise"},
		{`[a-z]`, "une minuscule requise"},
		{`[0-9]`, "un chiffre requis"},
		{`[^A-Za-z0-9]`, "un caractère spécial requis"},
	}

	for _, rule := range rules {
		matched, _ := regexp.MatchString(rule.pattern, req.Password)
		if !matched {
			json.NewEncoder(w).Encode(Response{Message: rule.msg, Success: false})
			return
		}
	}

	if _, exists := users[req.Username]; exists {
		json.NewEncoder(w).Encode(Response{Message: "Nom d'utilisateur déjà pris.", Success: false})
		return
	}

	users[req.Username] = req.Password
	json.NewEncoder(w).Encode(Response{Message: "Compte créé avec succès !", Success: true})
}

func main() {
	http.Handle("/", http.FileServer(http.Dir("./static")))
	http.HandleFunc("/login", loginHandler)
	http.HandleFunc("/signup", signupHandler)
	http.ListenAndServe(":8080", nil)
}
