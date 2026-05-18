package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"time"
)

// sessionStore is a naive in-memory session store.
// VULNERABILITY NOTE: This is not safe for production – no expiry management,
// no CSRF protection, no secure/httpOnly flags enforced properly.
var sessionStore = map[string]string{} // token -> username

var templates *template.Template

func main() {
	initDB()

	var err error
	templates, err = template.ParseGlob("templates/*.html")
	if err != nil {
		log.Fatalf("Failed to parse templates: %v", err)
	}

	mux := http.NewServeMux()
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	mux.HandleFunc("/login", loginHandler)
	mux.HandleFunc("/logout", logoutHandler)
	mux.HandleFunc("/register", registerHandler)
	mux.HandleFunc("/about", aboutHandler)
	mux.HandleFunc("/", authMiddleware(homeHandler))

	log.Println("SecureBank running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

// authMiddleware checks for a valid session cookie before allowing access.
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session_token")
		if err != nil || sessionStore[cookie.Value] == "" {
			http.Redirect(w, r, "/login", http.StatusFound)
			return
		}
		next(w, r)
	}
}

// ---- Handlers ----

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		var data map[string]string
		if r.URL.Query().Get("created") == "1" {
			data = map[string]string{"Success": "Account created successfully. Please log in."}
		}
		templates.ExecuteTemplate(w, "login.html", data)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	username := r.FormValue("username")
	password := r.FormValue("password")

	// Step 1: Check if the username exists in the database.
	user, err := getUserByUsername(username)

	if err != nil || user == nil {
		// ⚠️ VULNERABILITY – USERNAME ENUMERATION (CWE-204)
		// When the username does NOT exist, we return a GENERIC message.
		// A secure application should ALWAYS return the same error message
		// regardless of whether the username or the password is wrong.
		// Here the distinction between the two messages leaks information
		// about which usernames are registered, allowing an attacker to
		// enumerate valid accounts via automated tools (e.g. ffuf, Burp Intruder).
		data := map[string]string{"Error": "Invalid username or password."}
		templates.ExecuteTemplate(w, "login.html", data)
		return
	}

	if user.Password != password {
		// ⚠️ VULNERABILITY – USERNAME ENUMERATION (continued)
		// When the username EXISTS but the password is WRONG, we return a
		// DIFFERENT, more specific message ("Invalid password.").
		// This confirms to the attacker that the username is valid.
		// Fix: use the same message as above ("Invalid username or password.")
		// for all failed login attempts, with no behavioral difference.

		// ⚠️ VULNERABILITY – NO BRUTE-FORCE PROTECTION (CWE-307)
		// There is no rate limiting, account lockout, CAPTCHA, or delay here.
		// Once an attacker identifies a valid username, they can hammer this
		// endpoint with a password wordlist (e.g. rockyou.txt) to find the
		// correct password. The admin account uses a weak password that
		// appears in common wordlists, making this trivially exploitable.
		data := map[string]string{"Error": "Invalid password."}
		templates.ExecuteTemplate(w, "login.html", data)
		return
	}

	// Successful login – create a simple session token.
	token := generateToken()
	sessionStore[token] = username
	http.SetCookie(w, &http.Cookie{
		Name:    "session_token",
		Value:   token,
		Path:    "/",
		Expires: time.Now().Add(1 * time.Hour),
	})
	http.Redirect(w, r, "/", http.StatusFound)
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err == nil {
		delete(sessionStore, cookie.Value)
	}
	http.SetCookie(w, &http.Cookie{Name: "session_token", Value: "", MaxAge: -1, Path: "/"})
	http.Redirect(w, r, "/login", http.StatusFound)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	cookie, _ := r.Cookie("session_token")
	username := sessionStore[cookie.Value]

	user, err := getUserByUsername(username)
	if err != nil || user == nil {
		http.Redirect(w, r, "/login", http.StatusFound)
		return
	}

	// The home page intentionally displays the bank owner's full name.
	// This is a classic OSINT / information disclosure pattern:
	// a curious user or attacker can derive the admin username from
	// "John Smith" → try "jsmith", "john.smith", "johnsmith", "admin", etc.
	data := map[string]interface{}{
		"Username":      user.Username,
		"Role":          user.Role,
		"AccountNumber": "FR76 3000 6000 0112 3456 7890 189",
		"Balance":       "12,450.00 €",
		"BankOwner":     "John Smith (Administrator)",
	}
	templates.ExecuteTemplate(w, "home.html", data)
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		// Pass any "success" flash from a redirect query param (e.g. ?success=1).
		var data map[string]string
		if r.URL.Query().Get("created") == "1" {
			data = map[string]string{"Success": "Account created successfully. Please log in."}
		}
		templates.ExecuteTemplate(w, "register.html", data)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	username := r.FormValue("username")
	password := r.FormValue("password")

	// Basic input validation – both fields are required.
	if username == "" || password == "" {
		data := map[string]string{"Error": "Username and password are required."}
		templates.ExecuteTemplate(w, "register.html", data)
		return
	}

	// Check whether the username is already taken before attempting the insert.
	existing, err := getUserByUsername(username)
	if err != nil {
		data := map[string]string{"Error": "An internal error occurred. Please try again."}
		templates.ExecuteTemplate(w, "register.html", data)
		return
	}
	if existing != nil {
		// Username already exists – inform the user without leaking extra details.
		data := map[string]string{"Error": "Username already taken."}
		templates.ExecuteTemplate(w, "register.html", data)
		return
	}

	// Insert the new user (role "user" is set inside createUser).
	if err := createUser(username, password); err != nil {
		data := map[string]string{"Error": "Could not create account. Please try again."}
		templates.ExecuteTemplate(w, "register.html", data)
		return
	}

	// Redirect to /login with a success flash carried as a query parameter.
	// The login template reads the "success" key from the template data;
	// we pass it via a redirect to /login?created=1 so the login page can
	// display a confirmation banner.
	http.Redirect(w, r, "/login?created=1", http.StatusFound)
}

func aboutHandler(w http.ResponseWriter, r *http.Request) {
	templates.ExecuteTemplate(w, "about.html", nil)
}

// generateToken creates a naive random session token.
func generateToken() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}
