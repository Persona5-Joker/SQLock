# SQLock Security Tests

This folder contains all testing files for the SQLock security system.

## 📁 Test Files

### `setup_test_db.py`
- **Purpose**: Database initialization and test user creation
- **Usage**: `python setup_test_db.py`
- **Features**: Creates required tables and sample users with hashed passwords

### `test_comprehensive_security.py`
- **Purpose**: Comprehensive automated testing of all three security features
- **Usage**: `python test_comprehensive_security.py`
- **Tests**:
  - Vinay's Input Validation
  - Faizan's SQL Injection Detection & Immediate Lockout
  - Dani's Progressive Account Lockout
  - User lookup security
  - Valid authentication

### `demo_sqllock.py`
- **Purpose**: Interactive demo for manual testing
- **Usage**: `python demo_sqllock.py`
- **Features**: Live demonstration of security features with real-time feedback

## Quick Start

1. **Setup Database**:
   ```bash
   cd tests
   python setup_test_db.py
   ```

2. **Run Full Test Suite**:
   ```bash
   python test_comprehensive_security.py
   ```

3. **Try Interactive Demo**:
   ```bash
   python demo_sqllock.py
   ```

## Expected Results

- **Input Validation**: 100% blocking of invalid inputs
- **SQL Injection**: 100% detection and immediate 24-hour lockout
- **Progressive Lockout**: 15min → 1hr → 24hr escalation after failed attempts
- **Security Logging**: All events recorded in `pseudo_log.txt`

## Requirements

- Python 3.8+
- mysql-connector-python
- Active database connection (see DB_CONFIG in parent Mitigation-SRC)
- Test users created via setup_test_db.py