# SQL Injection Attack Scenarios

This document outlines realistic scenarios where SQL injection vulnerabilities can be exploited to demonstrate security risks.

---

## Scenario 1: Employee Self-Service Portal - Password Reset

### Business Context
Employees use a self-service portal to reset their passwords. They need to verify their identity by providing their Employee ID and email address. The system then displays their security question which they must answer correctly before resetting their password.

### User Flow
1. Employee navigates to "Forgot Password" page
2. Employee enters their **Employee ID** and **Email Address**
3. System queries database to verify the employee exists and retrieve their security information
4. System displays the employee's security question and personal details for verification
5. If verification passes, employee can reset password

### Vulnerability
The search query is vulnerable to SQL injection. An attacker can:
- **Bypass authentication**: Use SQL injection to retrieve any employee's information without knowing their actual credentials
- **Data exfiltration**: Extract sensitive employee data (SSN, salary, address, bank details) by manipulating the query
- **Mass data dump**: Use UNION attacks to dump the entire employee database

### Attack Vectors
- **OR-based bypass**: `' OR '1'='1' --` in email field returns all employees
- **UNION attack**: `' UNION SELECT employee_id, SSN, Salary, bank_routing_number FROM employee_info --` extracts sensitive data
- **Conditional extraction**: `' OR Salary > 100000 --` targets high-earning employees

### Why This Makes Sense
- **Realistic use case**: Password reset portals commonly exist in enterprise applications
- **Legitimate data display**: The system naturally needs to show some user information for verification
- **Common vulnerability**: Input validation is often weak in password reset flows
- **High impact**: Exposed data includes PII, financial information, and authentication details

---

## Scenario 2: Employee Directory Search

### Business Context
HR and managers need to search for employees in the company directory. They can search by name, department, employee ID, or email to find contact information and organizational details.

### User Flow
1. User navigates to "Employee Directory" or "Search Employees"
2. User enters search criteria: 
   - **Name** (first or last)
   - **Department**
   - **Employee ID**
   - **Email**
3. System queries the database and displays matching employees
4. Results show employee details: name, email, department, phone, office location

### Vulnerability
The search functionality concatenates user input directly into SQL queries without parameterization. An attacker can:
- **Unrestricted access**: View all employees regardless of permissions
- **Sensitive data exposure**: Extract salary information, SSNs, and banking details not normally visible
- **Cross-table attacks**: Use UNION to access other database tables (payroll, performance reviews, etc.)
- **Boolean-based blind injection**: Infer data through true/false responses

### Attack Vectors
- **Wildcard search**: `%' OR '1'='1' --` returns all employees
- **UNION-based extraction**: `' UNION SELECT employee_id, SSN, Salary, bank_routing_number, NULL, NULL, NULL, NULL FROM employee_info --`
- **Subquery injection**: `' OR employee_id IN (SELECT employee_id FROM employee_info WHERE Salary > 150000) --`
- **Data filtering**: `' OR department = 'Executive' --` targets specific groups

### Why This Makes Sense
- **Common enterprise feature**: Most companies have employee directories
- **Expected data display**: Users expect to see results, so data output is natural
- **Multiple input fields**: Provides various injection points
- **Varying permission levels**: Some users should only see limited data, but SQL injection bypasses this
- **Business justification**: IT and HR legitimately need search functionality

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  - Input forms for search/verification                  │
│  - Displays query results                               │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ POST /api/search or /api/verify
                  │ { employeeId, email, name, department }
                  │
┌─────────────────▼───────────────────────────────────────┐
│              API Route (Next.js)                        │
│  - Receives user input                                  │
│  - ⚠️  Concatenates input directly into SQL string      │
│  - Executes query                                       │
│  - Returns results (including sensitive data)           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ Vulnerable SQL Query:
                  │ SELECT * FROM employee_info 
                  │ WHERE employee_id = ${input}
                  │   AND email = '${input}'
                  │
┌─────────────────▼───────────────────────────────────────┐
│              MySQL Database                             │
│  - employee_info table                                  │
│    • employee_id                                        │
│    • first_name, last_name                              │
│    • email, password                                    │
│    • SSN (sensitive)                                    │
│    • Salary (sensitive)                                 │
│    • bank_routing_number (sensitive)                    │
│    • Address (PII)                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Recommendation

**Use Scenario 1 (Password Reset/Verification)** as it:
- Has a clear, single-purpose flow
- Naturally justifies displaying user information
- Is simpler to implement and understand
- Provides realistic context for SQL injection demonstration
- Makes sense why the application would return database records

**Alternative: Use Scenario 2 (Employee Directory)** if you want:
- Multiple search parameters (more attack vectors)
- More realistic enterprise application feel
- Ability to demonstrate different types of injection techniques
- Clear business justification for the feature

Both scenarios are significantly more realistic than an "application portal" that accepts all employee details for verification.
