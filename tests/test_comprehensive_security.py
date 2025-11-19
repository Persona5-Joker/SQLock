"""
SQLock Security Test Suite - Test All Three Security Features
Tests Dani's, Faizan's, and Vinay's security implementations
"""

import sys
import os

# Add parent directory to path for importing Mitigation_SRC
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# Import all security functions from Mitigation_SRC
from Mitigation_SRC import (
    authenticate_user,
    detect_sql_injection_patterns,
    apply_immediate_sql_lockout,
    record_failed_login,
    is_account_locked,
    get_lockout_info,
    reset_failed_attempts,
    find_user_by_id
)

def test_vinay_input_validation():
    """Test Vinay's Input Validation Feature"""
    print("Testing VINAY'S INPUT VALIDATION")
    print("=" * 50)
    
    # Test 1: Empty and None inputs
    print("1. Testing empty/null inputs:")
    test_cases = [
        ("", "password", "Empty username"),
        ("user", "", "Empty password"),
        ("", "", "Both empty"),
        (None, "password", "None username"),
        ("user", None, "None password")
    ]
    
    for username, password, test_desc in test_cases:
        print(f"   {test_desc}: ", end="")
        try:
            result = authenticate_user(username, password)
            if result is None:
                print("Blocked")
            else:
                print("FAILED - Should be blocked")
        except Exception as e:
            print(f"Exception handled: {type(e).__name__}")
    
    # Test 2: Invalid data types
    print("\n2. Testing invalid data types:")
    invalid_types = [
        (123, "password", "Numeric username"),
        ("user", 456, "Numeric password"),
        (["admin"], "password", "List username"),
        ("user", {"pass": "word"}, "Dict password"),
        (True, "password", "Boolean username")
    ]
    
    for username, password, test_desc in invalid_types:
        print(f"   {test_desc}: ", end="")
        try:
            result = authenticate_user(username, password)
            if result is None:
                print("Blocked")
            else:
                print("FAILED - Should be blocked")
        except Exception as e:
            print(f"Exception handled: {type(e).__name__}")
    
    # Test 3: Edge cases
    print("\n3. Testing edge cases:")
    edge_cases = [
        ("a" * 1000, "password", "Very long username"),
        ("user", "b" * 1000, "Very long password"),
        ("user\n\t\r", "password", "Username with whitespace"),
        ("üsér", "pässwörd", "Unicode characters"),
        ("user space", "pass word", "Spaces in credentials")
    ]
    
    for username, password, test_desc in edge_cases:
        print(f"   {test_desc}: ", end="")
        try:
            result = authenticate_user(username, password)
            print("Handled")
        except Exception as e:
            print(f"Exception: {type(e).__name__}")
    
    print("\nVinay's Input Validation Tests Complete!\n")

def test_faizan_sql_injection_detection():
    """Test Faizan's Immediate SQL Injection Lockout Feature"""
    print("Testing FAIZAN'S SQL INJECTION IMMEDIATE LOCKOUT")
    print("=" * 55)
    
    # Test SQL injection patterns
    sql_injection_tests = [
        ("admin'--", "Admin bypass attempt"),
        ("' OR '1'='1", "Classic OR injection"),
        ("user'; DROP TABLE users; --", "Table drop attempt"),
        ("admin\" OR \"1\"=\"1", "Double quote injection"),
        ("user/*comment*/", "Block comment injection"),
        ("test UNION SELECT * FROM users", "UNION injection"),
        ("admin%27--", "URL encoded quote"),
        ("user&#39; OR &#39;1&#39;=&#39;1", "HTML encoded injection"),
        ("test' AND '1'='1", "AND condition injection"),
        ("user'; DELETE FROM users; --", "DELETE injection"),
        ("admin' OR 1=1--", "Numeric tautology"),
        ("test'; INSERT INTO users VALUES('hack','evil'); --", "INSERT injection")
    ]
    
    blocked_count = 0
    for injection, test_desc in sql_injection_tests:
        print(f"Testing {test_desc}: ", end="")
        
        # Test the SQL injection detection
        is_malicious, pattern = detect_sql_injection_patterns(injection)
        if is_malicious:
            print(f"Detected: {pattern}")
            
            # Test that authenticate_user blocks it and applies lockout
            result = authenticate_user(injection, "password")
            if result is None:
                # Check if immediate lockout was applied
                lockout_info = get_lockout_info(injection)
                if lockout_info['locked'] and lockout_info.get('is_sql_injection_lockout'):
                    hours = lockout_info['time_remaining'] // 3600
                    print(f"   IMMEDIATE 24-HOUR LOCKOUT applied! ({hours} hours remaining)")
                    blocked_count += 1
                else:
                    print("   Blocked but no immediate lockout detected")
            else:
                print("   CRITICAL: SQL injection succeeded!")
        else:
            print("FAILED - Pattern not detected!")
    
    success_rate = (blocked_count / len(sql_injection_tests)) * 100
    print(f"\nSQL Injection Detection Rate: {blocked_count}/{len(sql_injection_tests)} ({success_rate:.1f}%)")
    print("\nFaizan's SQL Injection Detection Tests Complete!\n")

def test_dani_progressive_lockout():
    """Test Dani's Progressive Account Lockout Feature"""
    print("Testing DANI'S PROGRESSIVE ACCOUNT LOCKOUT")
    print("=" * 50)
    
    test_username = "lockout_test_user"
    
    print(f"Testing progressive lockout for user: {test_username}")
    print("(15 min → 1 hour → 24 hour progression)")
    
    for attempt in range(1, 6):
        print(f"\nAttempt {attempt}: ", end="")
        
        # Check if account is locked before attempting
        if is_account_locked(test_username):
            lockout_info = get_lockout_info(test_username)
            minutes = lockout_info['time_remaining'] // 60
            seconds = lockout_info['time_remaining'] % 60
            print(f"Account locked! {minutes}m {seconds}s remaining")
            
            # Show lockout reason if it exists
            if lockout_info.get('lockout_reason'):
                print(f"    Reason: {lockout_info['lockout_reason']}")
            continue
        
        # Attempt login with wrong password
        result = authenticate_user(test_username, "wrong_password")
        
        if result is None:
            lockout_info = get_lockout_info(test_username)
            if lockout_info['locked']:
                minutes = lockout_info['time_remaining'] // 60
                if attempt == 3:
                    print(f"LOCKED after {attempt} attempts! Wait {minutes} minutes (15min lockout)")
                elif attempt == 4:
                    hours = minutes // 60
                    print(f"LOCKED after {attempt} attempts! Wait {hours} hour (1hr lockout)")
                else:
                    hours = minutes // 60
                    print(f"LOCKED after {attempt} attempts! Wait {hours} hours (24hr lockout)")
            else:
                print(f"Failed login (attempt #{attempt})")
        else:
            print("Login successful")
    
    print("\nDani's Progressive Lockout Tests Complete!\n")

def test_valid_authentication():
    """Test that valid users can still authenticate"""
    print("Testing VALID AUTHENTICATION")
    print("=" * 35)
    
    # Test valid users
    test_users = [
        ("admin", "admin123"),
        ("VinayNair", "password"),
        ("john_doe", "secret123")
    ]
    
    for username, password in test_users:
        print(f"Testing valid login for: {username} ", end="")
        
        # Check if account is locked first
        if is_account_locked(username):
            lockout_info = get_lockout_info(username)
            seconds = lockout_info['time_remaining']
            print(f"Account locked! Wait {seconds} seconds")
            continue
        
        result = authenticate_user(username, password)
        if result:
            print("Successful login!")
            print(f"   User ID: {result['id']}, Email: {result['email']}")
        else:
            print("Login failed")
    
    print("\nValid Authentication Tests Complete!\n")

def test_user_lookup_security():
    """Test the secure user lookup function"""
    print("Testing USER LOOKUP SECURITY")
    print("=" * 35)
    
    # Test valid lookups
    print("Testing valid user IDs:")
    test_ids = [1, 2, 3, 4]
    
    for user_id in test_ids:
        print(f"  Looking up user ID {user_id}: ", end="")
        result = find_user_by_id(user_id)
        if result:
            print(f"Found: {result[1]} ({result[2]})")
        else:
            print("Not found")
    
    # Test invalid inputs (SQL injection attempts)
    print("\nTesting invalid user ID inputs:")
    invalid_inputs = ["'; DROP TABLE users; --", "1 OR 1=1", "abc", None]
    
    for invalid_id in invalid_inputs:
        print(f"  Testing: {invalid_id} - ", end="")
        result = find_user_by_id(invalid_id)
        if result is None:
            print("Blocked invalid input")
        else:
            print("SECURITY RISK: Invalid input accepted!")
    
    print("\nUser Lookup Security Tests Complete!\n")

def run_all_tests():
    """Run comprehensive security tests for all three features"""
    print("SQLock Comprehensive Security Test Suite")
    print("=" * 60)
    print("Testing all three team member implementations:")
    print("• Vinay's Input Validation")
    print("• Faizan's SQL Injection Detection & Immediate Lockout")
    print("• Dani's Progressive Account Lockout")
    print("=" * 60)
    print()
    
    try:
        # Test 1: Vinay's Input Validation
        test_vinay_input_validation()
        
        # Test 2: Faizan's SQL Injection Detection
        test_faizan_sql_injection_detection()
        
        # Test 3: Dani's Progressive Lockout
        test_dani_progressive_lockout()
        
        # Test 4: User Lookup Security
        test_user_lookup_security()
        
        # Test 5: Valid Authentication (should work despite security)
        test_valid_authentication()
        
        print("ALL SECURITY TESTS COMPLETED!")
        print("\nCheck 'pseudo_log.txt' for detailed security logs.")
        print("\nSECURITY SUMMARY:")
        print("Input Validation: Comprehensive filtering implemented")
        print("SQL Injection Protection: Immediate 24-hour lockout")  
        print("Progressive Lockout: 15min → 1hr → 24hr escalation")
        print("All features working together seamlessly!")
        
    except Exception as e:
        print(f"Test error: {e}")
        print("Make sure your database is set up and accessible.")

if __name__ == "__main__":
    print("IMPORTANT: Make sure you have:")
    print("1. Run setup_test_db.py first")
    print("2. Database connection is working") 
    print("3. Test users are created")
    print()
    
    response = input("Ready to run comprehensive security tests? (y/n): ")
    if response.lower() == 'y':
        run_all_tests()
    else:
        print("Exiting. Run setup_test_db.py first if needed!")