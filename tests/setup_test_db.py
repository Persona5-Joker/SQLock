"""
SQLock Database Setup - Create tables and test users for security testing
"""

import mysql.connector
import hashlib
from datetime import datetime

# Database configuration - should match Mitigation-SRC
DB_CONFIG = {
    'host': '127.0.0.1',
    'database': 'sqlockdb',
    'user': 'VinayNair',
    'password': 'password',
    'port': 3306,
    'autocommit': True,
    'connect_timeout': 10
}

def setup_database():
    """Create required tables and test users"""
    print("Setting up SQLock database...")
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # Create users table
        print("Creating users table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255),
            password_hash VARCHAR(64) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        print("Users table ready")
        
        # Create user_security table for lockout functionality
        print("Creating user_security table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_security (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            failed_attempts INT DEFAULT 0,
            last_failed_attempt TIMESTAMP NULL,
            lockout_until TIMESTAMP NULL,
            lockout_reason VARCHAR(50) NULL,
            INDEX idx_username (username),
            INDEX idx_lockout_until (lockout_until)
        )
        """)
        print("User security table ready")
        
        # Add lockout_reason column if it doesn't exist (for existing tables)
        try:
            cursor.execute("""
            ALTER TABLE user_security 
            ADD COLUMN lockout_reason VARCHAR(50) NULL DEFAULT NULL
            """)
            print("Added lockout_reason column to existing user_security table")
        except mysql.connector.Error:
            # Column already exists, ignore error
            pass
        
        # Create test users with hashed passwords
        print("Creating test users...")
        test_users = [
            ('admin', 'admin@test.com', 'admin123'),
            ('test_user', 'test@test.com', 'testpass'),
            ('VinayNair', 'vinay@test.com', 'password'),
            ('john_doe', 'john@test.com', 'secret123')
        ]
        
        for username, email, password in test_users:
            # Hash the password using SHA-256 (same method as Mitigation-SRC)
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            try:
                cursor.execute("""
                INSERT INTO users (username, email, password_hash) 
                VALUES (%s, %s, %s)
                """, (username, email, password_hash))
                print(f"Created user: {username} (password: {password})")
            except mysql.connector.IntegrityError:
                print(f"User {username} already exists")
        
        connection.commit()
        
        # Verify setup
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"\nSetup complete! {user_count} users in database")
        
        print("\nTest users created:")
        print("Username: admin, Password: admin123")
        print("Username: test_user, Password: testpass") 
        print("Username: VinayNair, Password: password")
        print("Username: john_doe, Password: secret123")
        
    except mysql.connector.Error as e:
        print(f"Database error: {e}")
        return False
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
    
    return True

if __name__ == "__main__":
    print("SQLock Database Setup")
    print("=" * 40)
    
    if setup_database():
        print("\nDatabase setup successful!")
        print("You can now run your security tests.")
    else:
        print("\nDatabase setup failed!")
        print("Check your database connection and try again.")