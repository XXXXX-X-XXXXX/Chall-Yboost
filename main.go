package main

import (
	"encoding/json"
	"net/http"
	"regexp"
)

// LoginRequest structure pour décoder le JSON envoyé par le frontend
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Response structure pour renvoyer les messages au frontend
type Response struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
}

// Simule une base de données en mémoire
// Alice et Bob sont tes utilisateurs par défaut pour les tests
var users = map[string]string{
	"alice": "Alice123!",
	"bob":   "Bob456@",
}

// loginHandler : Gère la connexion avec la faille d'énumération
func loginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Erreur de lecture du JSON", http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	storedPassword, userExists := users[req.Username]

	// --- DÉBUT DE LA FAILLE D'ÉNUMÉRATION ---

	// Cas 1 : L'utilisateur n'existe pas du tout
	if !userExists {
		json.NewEncoder(w).Encode(Response{
			Message: "Username or password incorrect.",
			Success: false,
		})
		return
	}

	// Cas 2 : L'utilisateur existe mais le mot de passe est faux
	// Le message "Invalid credentials" permet de confirmer que le username est valide
	if storedPassword != req.Password {
		json.NewEncoder(w).Encode(Response{
			Message: "Invalid credentials.",
			Success: false,
		})
		return
	}

	// --- FIN DE LA FAILLE ---

	// Cas 3 : Connexion réussie avec signature de Lucien Champeau
	json.NewEncoder(w).Encode(Response{
		Message: "Bienvenue sur votre espace, " + req.Username + ". \nCordialement, Lucien Champeau.",
		Success: true,
	})
}

// signupHandler : Gère la création de compte avec validation par Regex
func signupHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Erreur de lecture du JSON", http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	// Validation du mot de passe (contraintes de sécurité)
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

	// Vérification si le nom d'utilisateur est déjà pris
	if _, exists := users[req.Username]; exists {
		json.NewEncoder(w).Encode(Response{Message: "Nom d'utilisateur déjà pris.", Success: false})
		return
	}

	// Sauvegarde de l'utilisateur en mémoire
	users[req.Username] = req.Password
	json.NewEncoder(w).Encode(Response{Message: "Compte créé avec succès !", Success: true})
}

func main() {
	// Sert les fichiers statiques (index.html, style.css, etc.) depuis le dossier /static
	http.Handle("/", http.FileServer(http.Dir("./static")))

	// Définition des routes de l'API
	http.HandleFunc("/login", loginHandler)
	http.HandleFunc("/signup", signupHandler)

	// Lancement du serveur
	println("Serveur lancé sur http://localhost:8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		panic(err)
	}
}
