# SQLock

**`DROP` threats, not tables.**

## Overview

SQLock is a web-based security demonstration system designed to detect and prevent SQL injection (SQLi) attacks. This project was created for the CS4389 Data and Applications Security course at The University of Texas at Dallas.

The primary goal is to create a teaching/proof-of-concept application that demonstrates secure database interaction patterns. The system uses a rule-based detection engine to analyze SQL queries at the application layer, logs all suspicious activity to a MySQL database, and provides a real-time dashboard for security event analysis.

## Features

 **SQL Injection Detection**: Client-side rule-based detector analyzes queries for suspicious patterns before execution

 **Advanced Logging**: Records all security events with timestamps, decision outcomes (allow/challenge/block), and suspicion scores to a MySQL database

 **Real-Time Dashboard**: Three-page web interface for interacting with the system:
   - **Input Page**: Test SQL queries against the detection engine
   - **Logs Page**: View all recorded security events
   - **Flags Page**: Filter and analyze blocked or challenged attempts

 **Safe Query Execution**: Restricted to SELECT queries on the `employee_info` table with parameterized queries to prevent actual SQL injection

 **Rule-Based Detection**: Identifies common SQLi patterns including:
   - SQL tautologies (e.g., `OR 1=1`)
   - SQL comments (`--`, `/*`)
   - `UNION` and `DROP` statements
   - Suspicious operator combinations
SQL Injection Prevention: Actively detects and mitigates SQLi attacks.

Advanced Logging: Logs user inputs, including timestamps, user information, and the raw query string, to trace potential attacks.

Pattern Analysis: Includes tools to analyze logs to identify probable SQL injection patterns.

Rule-Based Detection: Uses a set of detection rules to identify common SQLi payloads, such as tautologies (`or 1=1`), SQL comments (`--`, `/*`), `UNION` `SELECT` queries, and more.

## Installation

### Prerequisites

- **Node.js** (v20 or higher recommended)
- **MySQL** (v8.0 or higher)
- A MySQL management tool (e.g., HeidiSQL, MySQL Workbench, or phpMyAdmin)
- **npm** or **pnpm** package manager

### Setup Instructions

1. **Clone the repository**
    
    ```bash
    git clone https://github.com/Persona5-Joker/SQLock.git
    ```
    
2. **Navigate to project folder**
    
    ```bash
    cd SQLock
    ```
    
3. **Install dependencies**
    
    ```bash
    npm install
    ```
    
4. **Set up the Database**
    
    - Create a MySQL database for the project (e.g., `sqlock_db`)
        
    - Create a `Logs` table with the following schema:
        
        ```sql
        CREATE TABLE Logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ts_utc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            decision VARCHAR(50) NOT NULL,
            suspicion_score INT NOT NULL,
            query_template TEXT
        );
        ```
        
    - Create an `employee_info` table for testing queries (or import your own schema)
        
5. **Configure environment variables**
    
    ```bash
    cp .env.example .env
    ```
    
    Edit `.env` and set your MySQL connection string:
    
    ```bash
    DATABASE_URL="mysql://username:password@localhost:3306/sqlockdb"
    ```

## Usage

### Running the Application

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Application Pages

- **Home Page**: `http://localhost:3000`
  - Project overview and team information
  
- **Input Page**: `http://localhost:3000/input`
  - Test SQL queries against the detection engine
  - See real-time detection results and suspicion scores
  - Execute safe SELECT queries against the database
  
- **Logs Page**: `http://localhost:3000/logs`
  - View all recorded security events (up to 200 most recent)
  - Sortable and paginated table of events
  
- **Flags Page**: `http://localhost:3000/flags`
  - View only blocked or challenged security events
  - Analyze potential attack patterns

### Detection Logic

The application uses a client-side rule-based detection engine that analyzes queries for suspicious patterns:

- **Block (Score 90)**: Queries containing `DROP`, `UNION`, `OR 1=1`, or SQL comments (`--`)
- **Challenge (Score 55)**: Queries with suspicious combinations of `OR` and `=` operators
- **Allow (Score 0)**: Clean queries that pass all checks

All decisions are logged to the database via the `/api/log` endpoint for analysis.

### API Endpoints

The application exposes two REST API endpoints:

- **POST `/api/query`**: Execute a SELECT query on the `employee_info` table
  ```json
  {
    "query": "SELECT * FROM employee_info WHERE id = 1"
  }
  ```

- **POST `/api/log`**: Log a security event
  ```json
  {
    "decision": "block",
    "score": 90,
    "query": "SELECT * FROM employee_info WHERE 1=1"
  }
  ```

### Building for Production

```bash
npm run build
npm start
```

### Development Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format:check` - Check code formatting
- `npm run format:write` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking
- `npm run check` - Run both linting and type checking

## 🔒 Security Features

### Multi-Layer Protection

1. **Input Validation**: All queries are validated and normalized before processing
2. **Query Restriction**: Only `SELECT` queries are permitted
3. **Table Restriction**: Queries are limited to the `employee_info` table only
4. **Parameterized Queries**: All database operations use prepared statements via `mysql2`
5. **Pattern Detection**: Rule-based engine identifies suspicious SQL patterns
6. **Comprehensive Logging**: All security events are logged with timestamps and metadata

### Database Schema

The `Logs` table stores all detection results:

```sql
CREATE TABLE Logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ts_utc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decision VARCHAR(50) NOT NULL,      -- 'allow', 'challenge', or 'block'
    suspicion_score INT NOT NULL,       -- 0-100 risk score
    query_template TEXT                  -- The query that was analyzed
);
```

## Project Structure

```
SQLock/
├── Mitigation_SRC.py           # Standalone Python mitigation module
├── mitigation_tool_history.md  # History of mitigation tool changes
├── mitigation_tool_improvements.MD # Planned improvements
├── test_queries.txt            # Test SQL queries
├── test_sqlock_security.py     # Security test script
├── src/                        # Next.js application source
│   ├── app/                    # App router pages and API
│   ├── components/             # React components
│   ├── lib/                    # Utility functions
│   ├── server/                 # Server-side logic (DB, logging)
│   └── ...
├── public/                     # Static assets
├── tests/                      # Additional test files
├── package.json                # Project dependencies and scripts
└── README.md                   # This file
```
```

## 🧠 Technologies Used

### Core Stack
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **React 19** - UI library
- **Tailwind CSS 4** - Utility-first styling
- **MySQL2** - MySQL database driver for Node.js

### UI Components & Styling
- **Shadcn UI** - Reusable component library
- **Radix UI** - Accessible UI primitives
- **Lucide React** - Icon library
- **next-themes** - Dark/light mode support

### Data & Validation
- **TanStack Table** - Powerful table management
- **Zod** - Schema validation
- **@t3-oss/env-nextjs** - Type-safe environment variables

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PostCSS** - CSS processing

### Infrastructure
- **MySQL** - Primary database for security event storage
- **Node.js** - JavaScript runtime


## 👤 Author / Maintainers

This project is maintained by the following group members:

- Satyam Garg 
    
- Danielle Bryan
    
- David Wu
    
- Vinay Nair
    
- Noly Sia
    
- Faizan-Ali Lalani
    
- Caiyun (Katie) Huang
    

## Acknowledgments

- This project was developed for the **CS4389 Data and Applications Security** course at **The University of Texas at Dallas - Richardson**.