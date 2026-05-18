package main

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

// User represents a row in the users table.
type User struct {
	ID       int
	Username string
	Password string
	Role     string
}

// initDB opens (or creates) the SQLite database and seeds initial users.
func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "./securebank.db")
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	createTable := `
	CREATE TABLE IF NOT EXISTS users (
		id       INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT    UNIQUE NOT NULL,
		password TEXT    NOT NULL,
		role     TEXT    NOT NULL DEFAULT 'user'
	);`

	if _, err = db.Exec(createTable); err != nil {
		log.Fatalf("Failed to create users table: %v", err)
	}

	// Seed users only if the table is empty.
	var count int
	db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if count == 0 {
		seedUsers()
	}
}

// seedUsers inserts the initial demo accounts.
func seedUsers() {
	users := []User{
		{
			Username: "customer1",
			// Reasonable password for the regular user.
			Password: "Customer123",
			Role:     "user",
		},
		{
			// ⚠️ VULNERABILITY – WEAK ADMIN PASSWORD (CWE-521)
			// The admin username "jsmith" is derivable from the home page which
			// displays "Bank Owner: John Smith (Administrator)".
			// The password "Admin123" is intentionally weak and appears in most
			// common password wordlists (rockyou.txt, SecLists top-passwords, etc.).
			// In a real application the admin password must be long, random, and
			// stored as a salted hash (bcrypt / argon2).
			// Combined with the absence of brute-force protections in loginHandler,
			// this allows a full account takeover with a simple dictionary attack.
			Username: "jsmith",
			Password: "Admin123",
			Role:     "admin",
		},
	}

	for _, u := range users {
		_, err := db.Exec(
			"INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
			u.Username, u.Password, u.Role,
		)
		if err != nil {
			log.Printf("Failed to seed user %s: %v", u.Username, err)
		}
	}
	log.Println("Database seeded with demo users.")
}

// createUser inserts a new user with role "user" into the database.
// Returns an error if the username is already taken (UNIQUE constraint).
func createUser(username, password string) error {
	_, err := db.Exec(
		"INSERT INTO users (username, password, role) VALUES (?, ?, 'user')",
		username, password,
	)
	return err
}

// getUserByUsername fetches a user record by username.
// Returns (nil, nil) when no row is found – callers must check for nil.
func getUserByUsername(username string) (*User, error) {
	row := db.QueryRow("SELECT id, username, password, role FROM users WHERE username = ?", username)
	u := &User{}
	err := row.Scan(&u.ID, &u.Username, &u.Password, &u.Role)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}
