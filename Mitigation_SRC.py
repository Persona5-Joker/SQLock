# Required library: pip install mysql-connector-python
import mysql.connector
from datetime import datetime, timedelta
import hashlib

# TODO: Fill this dictionary with your database connection details.
# It is best practice to load these from a separate config file or environment variables.
DB_CONFIG = {
    'host': '10.147.17.110',             
    'database': 'sqlockdb',             
    'user': 'VinayNair',                 
    'password': 'password',              # Your MySQL password
    'port': 3306,                        # Default MySQL port
    'autocommit': True,
    'connect_timeout': 10
}

def log_suspicious_activity(bad_input):
    """
    Writes a warning to a 'pseudo_log.txt' file when called.
    Use this in your code whenever an input validation check fails.
    """
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_message = f"[{current_time}] Suspicious input blocked: {bad_input}\n"
    with open('pseudo_log.txt', 'a') as log_file:
        log_file.write(log_message)
    print("!!! WARNING: Suspicious activity was detected and logged. !!!")

def find_user_by_id(user_id):
    """
    Safely finds a user using a parameterized query to prevent SQL injection.
    This serves as a template for all functions that read data from your database.
    """
    # --- SECURITY CHECK ---
    # Always validate your inputs before sending them to the database.
    # Here, we expect the ID to be a number (integer).
    if not isinstance(user_id, int):
        log_suspicious_activity(f"Non-integer ID used: {user_id}")
        return None # Stop execution if the input is invalid.

    # The '%s' is a secure placeholder for a parameter.
    query = "SELECT id, username, email FROM users WHERE id = %s"
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        cursor.close()
        connection.close()
        return result
    except mysql.connector.Error as error:
        log_suspicious_activity(f"Database error in find_user_by_id: {error}")
        return None

def is_account_locked(username):
    """Check if account is currently locked due to failed attempts or SQL injection."""
    if not username or not isinstance(username, str):
        log_suspicious_activity(f"Invalid username provided for lockout check: {username}")
        return False
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        query = """
        SELECT failed_attempts, lockout_until, lockout_reason 
        FROM user_security 
        WHERE username = %s
        """
        cursor.execute(query, (username,))
        result = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if result:
            failed_attempts, lockout_until, lockout_reason = result
            if lockout_until and datetime.now() < lockout_until:
                return True
        
        return False
    except mysql.connector.Error as error:
        log_suspicious_activity(f"Database error checking lockout status: {error}")
        return False

def get_lockout_info(username):
    """Get detailed lockout information for a user."""
    if not username or not isinstance(username, str):
        log_suspicious_activity(f"Invalid username for lockout info: {username}")
        return {'locked': False, 'time_remaining': 0, 'failed_attempts': 0}
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        query = """
        SELECT failed_attempts, lockout_until, lockout_reason 
        FROM user_security 
        WHERE username = %s
        """
        cursor.execute(query, (username,))
        result = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if result:
            failed_attempts, lockout_until, lockout_reason = result
            if lockout_until and datetime.now() < lockout_until:
                time_remaining = int((lockout_until - datetime.now()).total_seconds())
                return {
                    'locked': True,
                    'time_remaining': time_remaining,
                    'failed_attempts': failed_attempts,
                    'lockout_reason': lockout_reason,
                    'is_sql_injection_lockout': lockout_reason and 'SQL injection' in lockout_reason
                }
            else:
                return {'locked': False, 'time_remaining': 0, 'failed_attempts': failed_attempts}
        
        return {'locked': False, 'time_remaining': 0, 'failed_attempts': 0}
    except mysql.connector.Error as error:
        log_suspicious_activity(f"Database error getting lockout info: {error}")
        return {'locked': False, 'time_remaining': 0, 'failed_attempts': 0}

def record_failed_login(username):
    """Record a failed login attempt and apply progressive lockout."""
    if not username or not isinstance(username, str):
        log_suspicious_activity(f"Invalid username for failed login recording: {username}")
        return
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # Get current failed attempts
        query = "SELECT failed_attempts FROM user_security WHERE username = %s"
        cursor.execute(query, (username,))
        result = cursor.fetchone()
        
        if result:
            failed_attempts = result[0] + 1
        else:
            failed_attempts = 1
            # Insert new record
            cursor.execute("""
                INSERT INTO user_security (username, failed_attempts, last_failed_attempt)
                VALUES (%s, %s, %s)
            """, (username, 0, datetime.now()))
        
        # Determine lockout duration based on attempts
        lockout_until = None
        if failed_attempts >= 3:
            if failed_attempts == 3:
                lockout_duration = timedelta(minutes=15)  # 15 minutes for 3rd attempt
            elif failed_attempts == 4:
                lockout_duration = timedelta(hours=1)     # 1 hour for 4th attempt
            else:
                lockout_duration = timedelta(hours=24)    # 24 hours for 5th+ attempts
            
            lockout_until = datetime.now() + lockout_duration
            log_suspicious_activity(f"Account {username} locked for {lockout_duration} after {failed_attempts} failed attempts")
        
        # Update the security record
        cursor.execute("""
            UPDATE user_security 
            SET failed_attempts = %s, last_failed_attempt = %s, lockout_until = %s
            WHERE username = %s
        """, (failed_attempts, datetime.now(), lockout_until, username))
        
        cursor.close()
        connection.close()
        
        log_suspicious_activity(f"Failed login attempt for username: {username}")
        
    except mysql.connector.Error as error:
        log_suspicious_activity(f"Database error recording failed login: {error}")

def apply_immediate_sql_lockout(username, detected_pattern):
    """Apply immediate 24-hour lockout for SQL injection attempts."""
    if not username or not isinstance(username, str):
        log_suspicious_activity(f"Invalid username for immediate SQL lockout: {username}")
        return
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # 24-hour lockout for SQL injection
        lockout_until = datetime.now() + timedelta(hours=24)
        lockout_reason = f"SQL injection attempt: {detected_pattern}"
        
        # Insert or update security record with immediate lockout
        cursor.execute("""
            INSERT INTO user_security (username, failed_attempts, lockout_until, lockout_reason, last_failed_attempt)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            lockout_until = VALUES(lockout_until),
            lockout_reason = VALUES(lockout_reason),
            last_failed_attempt = VALUES(last_failed_attempt)
        """, (username, 0, lockout_until, lockout_reason, datetime.now()))
        
        cursor.close()
        connection.close()
        
        log_suspicious_activity(f"IMMEDIATE LOCKOUT: Account {username} locked for 24 hours due to SQL injection attempt: {detected_pattern}")
        
    except mysql.connector.Error as error:
        log_suspicious_activity(f"Database error applying immediate lockout: {error}")

def detect_sql_injection_patterns(input_string):
    """
    Comprehensive SQL injection pattern detection.
    Returns (is_malicious, detected_pattern)
    """
    if not input_string or not isinstance(input_string, str):
        return False, None
    
    # Common SQL injection patterns
    sql_injection_patterns = {
        "'": "Single quote injection",
        '"': "Double quote injection", 
        ";": "Statement terminator",
        "--": "SQL comment",
        "/*": "Block comment start",
        "*/": "Block comment end",
        " or ": "OR condition injection",
        " and ": "AND condition injection",
        " union ": "UNION injection",
        " select ": "SELECT injection",
        " insert ": "INSERT injection",
        " delete ": "DELETE injection",
        " update ": "UPDATE injection",
        " drop ": "DROP injection",
        " create ": "CREATE injection",
        " alter ": "ALTER injection",
        " exec ": "EXEC injection",
        " execute ": "EXECUTE injection",
        "1=1": "Tautology injection",
        "1'='1": "Quote tautology",
        "admin'--": "Admin bypass attempt",
        "' or '1'='1": "Classic OR injection",
        "' or 1=1--": "Numeric OR injection",
        "'; drop table": "Table drop attempt",
        "'; delete from": "Delete injection",
        "xp_": "Extended procedure",
        "sp_": "System procedure",
        "exec(": "Dynamic execution",
        "execute(": "Dynamic execution",
        "%27": "URL encoded single quote",
        "%22": "URL encoded double quote",
        "%3B": "URL encoded semicolon",
        "&#39;": "HTML encoded single quote",
        "&#34;": "HTML encoded double quote",
    }
    
    input_lower = input_string.lower()
    
    # Check for known patterns
    for pattern, description in sql_injection_patterns.items():
        if pattern.lower() in input_lower:
            return True, f"{description} ('{pattern}')"
    
    # Check for multiple suspicious characters
    if len([c for c in input_string if c in "';\"--"]) > 2:
        return True, "Multiple suspicious characters"
    
    return False, None

def reset_failed_attempts(username):
    """Reset failed login attempts for a user after successful login. Will NOT reset SQL injection lockouts."""
    if not username or not isinstance(username, str):
        log_suspicious_activity(f"Invalid username for resetting failed attempts: {username}")
        return
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # Only reset if it's not an SQL injection lockout
        cursor.execute("""
            UPDATE user_security 
            SET failed_attempts = 0, lockout_until = NULL 
            WHERE username = %s AND (lockout_reason IS NULL OR lockout_reason NOT LIKE '%SQL injection%')
        """, (username,))
        
        cursor.close()
        connection.close()
        
    except mysql.connector.Error as error:
        log_suspicious_activity(f"Database error resetting failed attempts: {error}")

def authenticate_user(username, password):
    """
    Secure user authentication with comprehensive security features:
    1. Input validation (Vinay's feature)
    2. SQL injection detection with immediate lockout (Faizan's feature)  
    3. Progressive account lockout after 3 failed attempts (Dani's feature)
    """
    # Feature 1: Input Validation (Vinay)
    if not username or not password:
        log_suspicious_activity("Empty username or password provided")
        return None
        
    if not isinstance(username, str) or not isinstance(password, str):
        log_suspicious_activity(f"Invalid data types for login: username={type(username)}, password={type(password)}")
        return None
    
    # Feature 2: SQL Injection Detection (Faizan)
    username_malicious, username_pattern = detect_sql_injection_patterns(username)
    password_malicious, password_pattern = detect_sql_injection_patterns(password)
    
    if username_malicious or password_malicious:
        detected_pattern = username_pattern if username_malicious else password_pattern
        apply_immediate_sql_lockout(username, detected_pattern)
        log_suspicious_activity(f"CRITICAL: SQL injection detected and immediate lockout applied: {username} - {detected_pattern}")
        return None
    
    # Feature 3: Check Account Lockout (Dani)
    if is_account_locked(username):
        log_suspicious_activity(f"Login attempt on locked account: {username}")
        return None
    
    # Hash the provided password for comparison
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    # Secure parameterized query to prevent SQL injection
    query = """
    SELECT id, username, email, password_hash 
    FROM users 
    WHERE username = %s AND password_hash = %s
    """
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        cursor.execute(query, (username, password_hash))
        result = cursor.fetchone()
        
        if result:
            # Successful login - reset failed attempts (but not SQL injection lockouts)
            reset_failed_attempts(username)
            cursor.close()
            connection.close()
            
            # Return user information as dictionary
            return {
                'id': result[0],
                'username': result[1], 
                'email': result[2]
            }
        else:
            # Failed login - record attempt and apply progressive lockout
            record_failed_login(username)
            cursor.close()
            connection.close()
            return None
            
    except mysql.connector.Error as error:
        log_suspicious_activity(f"Database connection error: {error}")
        return None


# TODO: Add your other database functions below, following the same secure pattern.
#
# REQUIRED DATABASE SETUP:
# You need to create these tables in your 'sqlockdb' database:
#
# 1. Users table:
#    CREATE TABLE users (
#        id INT AUTO_INCREMENT PRIMARY KEY,
#        username VARCHAR(255) NOT NULL UNIQUE,
#        email VARCHAR(255),
#        password_hash VARCHAR(64) NOT NULL,
#        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#    );
#
# 2. User security table for lockout functionality:
#    CREATE TABLE user_security (
#        id INT AUTO_INCREMENT PRIMARY KEY,
#        username VARCHAR(255) NOT NULL UNIQUE,
#        failed_attempts INT DEFAULT 0,
#        last_failed_attempt TIMESTAMP NULL,
#        lockout_until TIMESTAMP NULL,
#        lockout_reason VARCHAR(50) NULL,
#        INDEX idx_username (username),
#        INDEX idx_lockout_until (lockout_until)
#    );
#
# USAGE EXAMPLE:
# # Attempt to authenticate a user
# user = authenticate_user("john_doe", "user_password")
# if user:
#     print(f"Welcome, {user['username']}!")
# else:
#     # Check if account is locked
#     lockout_info = get_lockout_info("john_doe")
#     if lockout_info['locked']:
#         minutes = lockout_info['time_remaining'] // 60
#         seconds = lockout_info['time_remaining'] % 60
#         print(f"Account locked! Try again in {minutes}m {seconds}s")
#     else:
#         print("Invalid credentials.")
#
# SECURITY FEATURES IMPLEMENTED:
# - Input validation for all user inputs (Vinay)
# - SQL Injection detection with immediate 24-hour lockout (Faizan)
# - Progressive account lockout after 3 failed attempts: 15min → 1hr → 24hr (Dani)
# - Comprehensive logging of all suspicious activity to pseudo_log.txt
# - Secure parameterized queries throughout
# - Password hashing (SHA-256)
# - Automatic lockout expiration
#
# TEST FILES LOCATION: ./tests/
# - setup_test_db.py: Database initialization
# - test_comprehensive_security.py: Full security test suite  
# - demo_sqllock.py: Interactive demo
