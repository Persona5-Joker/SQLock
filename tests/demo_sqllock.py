"""
SQLock Security System - Demo Usage
Shows how to use all three security features in practice
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
    is_account_locked,
    get_lockout_info
)

def demo_authentication():
    """Demonstrate the authentication system"""
    print("SQLock Security System Demo")
    print("=" * 40)
    
    while True:
        print("\nAvailable test users:")
        print("• admin / admin123")
        print("• VinayNair / password") 
        print("• test_user / testpass")
        print("• john_doe / secret123")
        print("\nOr try SQL injection attacks to see immediate lockout!")
        print("Examples: admin'-- OR ' OR '1'='1")
        
        username = input("\nEnter username (or 'quit' to exit): ").strip()
        if username.lower() == 'quit':
            break
            
        password = input("Enter password: ").strip()
        
        print(f"\nAttempting login for: {username}")
        print("-" * 30)
        
        # Check if account is already locked
        if is_account_locked(username):
            lockout_info = get_lockout_info(username)
            minutes = lockout_info['time_remaining'] // 60
            seconds = lockout_info['time_remaining'] % 60
            
            print(f"ACCOUNT LOCKED!")
            print(f"   Time remaining: {minutes}m {seconds}s")
            if lockout_info.get('lockout_reason'):
                print(f"   Reason: {lockout_info['lockout_reason']}")
            if lockout_info.get('is_sql_injection_lockout'):
                print("   Type: SQL Injection Lockout (24 hours)")
            else:
                print("   Type: Failed Attempt Lockout (Progressive)")
            continue
        
        # Attempt authentication
        user = authenticate_user(username, password)
        
        if user:
            print("LOGIN SUCCESSFUL!")
            print(f"   Welcome, {user['username']}!")
            print(f"   User ID: {user['id']}")
            print(f"   Email: {user['email']}")
        else:
            print("LOGIN FAILED!")
            
            # Check if this caused a lockout
            if is_account_locked(username):
                lockout_info = get_lockout_info(username)
                minutes = lockout_info['time_remaining'] // 60
                
                if lockout_info.get('is_sql_injection_lockout'):
                    hours = minutes // 60
                    print(f"SQL INJECTION DETECTED!")
                    print(f"   IMMEDIATE 24-HOUR LOCKOUT APPLIED!")
                    print(f"   Time remaining: {hours} hours")
                else:
                    failed_attempts = lockout_info['failed_attempts']
                    if failed_attempts >= 3:
                        print(f"ACCOUNT LOCKED after {failed_attempts} failed attempts!")
                        print(f"   Time remaining: {minutes} minutes")
                    else:
                        print(f"   Failed attempts: {failed_attempts}/3")
            else:
                print("   Invalid credentials. Try again.")

if __name__ == "__main__":
    print("Welcome to the SQLock Security System Demo!")
    print("\nThis demo shows all three security features:")
    print("1. Vinay's Input Validation")
    print("2. Faizan's SQL Injection Detection & Immediate Lockout")  
    print("3. Dani's Progressive Account Lockout")
    print("\nTry both legitimate logins and attack attempts!")
    
    demo_authentication()
    
    print("\nThanks for trying SQLock!")
    print("Check 'pseudo_log.txt' for security event logs.")