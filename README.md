# SQLock

**`DROP` threats, not tables.**

## Overview

SQLock is a security system designed to detect and prevent SQL injection (SQLi) attacks111. This project was created for the CS4389 Data and Applications Security course.

The primary goal is to create a secure database solution for real-world applications by building a tool that not only blocks malicious queries but also logs them for analysis3333. The system works by analyzing user inputs at the application layer and logging suspicious activity to identify potential attack patterns.

## Features

SQL Injection Prevention: Actively detects and mitigates SQLi attacks.

Advanced Logging: Logs user inputs, including timestamps, user information, and the raw query string, to trace potential attacks.

Pattern Analysis: Includes tools to analyze logs to identify probable SQL injection patterns.

Rule-Based Detection: Uses a set of detection rules to identify common SQLi payloads, such as tautologies (`or 1=1`), SQL comments (`--`, `/*`), `UNION` `SELECT` queries, and more.

## Installation

### Prerequisites

- Python
- MySQL 
- A MySQL management tool (e.g., HeidiSQL )
- ZeroTier (Maybe)

### Setup Instructions

1. **Clone the repo**
    
    Bash
    
    ```
    git clone https://github.com/username/SQLock.git
    ```
    
2. **Go to project folder**
    
    Bash
    
    ```
    cd SQLock
    ```
    
3. **Install Python dependencies** (Assuming a `requirements.txt` file)
    
    Bash
    
    ```
    pip install -r requirements.txt
    ```
    
4. **Join the ZeroTier Network**
    
    - *this step only needs to be done if locally hosting database on separate device*
		
    - Install ZeroTier from the [Zerotier Download page](https://www.zerotier.com/download/).
        
    - Join the network using the ID: `Unique per situation`.
        
5. **Set up the Database**
    
    - Ensure your ZeroTier connection is active.
        
    - Connect to the MySQL database using your management tool with the following credentials:
        
        - **IP Address:** `zerotier IP address for your server`
            
        - **Usernames:** `Whatever you created during database creation`
            
        - **Password:** `Whatever you created during database creation`
            
    - Populate the database by running the `Employee_Info.sql` script.
        

## Usage

_Further instructions on running the main application will be added here._

Example of how to run the main script (placeholder):

Bash

```
# Run the main application
python main.py
```

### Run Instructions (Node.js / Next.js)

This repository contains a Next.js (T3) application. To run the web demo locally:

```bash
cd sqlock
npm install
cp .env.example .env
# Edit .env to point DATABASE_URL to your MySQL instance
npx prisma migrate deploy
npm run dev
```

Open the demo pages in your browser:

- Input page: http://localhost:3000/input
- Logs page: http://localhost:3000/logs
- Flags page: http://localhost:3000/flags

Credits: CS4389 project team

## 🧩 Project Structure

Current project organization:

```
SQLock/
├── Mitigation-SRC              # Main security module
├── pseudo_log.txt              # Security event logging
├── tests/                      # All testing files
│   ├── setup_test_db.py        # Database initialization
│   ├── test_comprehensive_security.py  # Full test suite
│   ├── demo_sqllock.py         # Interactive demo
│   └── README.md               # Test documentation
├── sqlock/                     # Next.js web interface
└── README.md                   # This file
```

## 🧠 Technologies Used

- **Languages:** Python, SQL, HTML (for web interface)
    
- **Database:** MySQL
    
- **Tools:**
    
    - ZeroTier (for collaborative networking) 
        
    - GitHub (for source code management)
        
    - Mockaroo (for mock data generation)
        
    - HeidiSQL (for database management)
        

## 🧪 Running Tests

_Test instructions will be added here._

Bash

```
# Example
pytest
```

## 📄 License

This project is licensed under the MIT License. (A `LICENSE` file will be added to the repository).

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

- This project is for the CS4389 Data and Applications Security course at The University of Texas at Dallas - Richardson.

## 📚 References

1. Smith, J. et al. *Deep Learning for Image Segmentation*, IEEE, 2020.  
2. Johnson, A. *A Novel Graph-Based Clustering Algorithm*, arXiv:2103.04567.  
3. Dataset: [CIFAR-10](https://www.cs.toronto.edu/~kriz/cifar.html)
