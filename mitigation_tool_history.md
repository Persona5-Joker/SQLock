# The Evolution of SQLock's Mitigation Engine

This document chronicles the development journey of the SQLock mitigation tool (`Mitigation_SRC.py`), detailing the problems encountered at each stage and the engineering solutions implemented to solve them.

## 1. The Foundation: Basic Pattern Matching
**Commit:** `da61af7eedc474d86db92e6c0ef285ec29d06982`
**Date:** Wed Nov 12 23:13:44 2025 -0600
**Author:** Vinay A. Nair

### The Challenge
We needed a way to detect SQL injection attempts in user inputs to protect the database.

### The Solution
A Python script was created with a basic `detect_sql_injection_patterns` function.

### Technical Details
- **Mechanism:** Implemented a simple "blocklist" of strings (e.g., `1=1`, `admin'--`).
- **Heuristic:** Used a basic character counter: if an input had more than 2 suspicious characters (like `'` or `;`), it was flagged.
- **Code Snippet:**
  ```python
  # Check for multiple suspicious characters
  if len([c for c in input_string if c in "';\"--"]) > 2:
      return True, "Multiple suspicious characters"
  ```
- **Limitation:** This approach was binary (Safe/Malicious) and prone to false positives. A user named "O'Reilly" would be blocked simply for having a quote.

## 2. Bridging the Gap: Serverless CLI Integration
**Commit:** `05c8e0213f551b7c9bf922d418a6bf3405af99c9`
**Date:** Wed Nov 19 16:41:03 2025 -0600
**Author:** Satyam Garg

### The Challenge
The SQLock frontend is built with Next.js (Node.js), but our detection logic was in Python. We needed a way to invoke the Python logic from the web server without rewriting the entire engine in JavaScript.

### The Solution
The script was refactored to function as a Command Line Interface (CLI) tool, enabling "serverless-style" invocation.

### Technical Details
- **CLI Arguments:** Added `argparse` to accept `--query`, `--username`, and `--apply-lockout`.
- **JSON Output:** Structured the output as a JSON object printed to `stdout`.
- **Integration:** The Next.js API route (`src/app/api/mitigation/route.ts`) spawns a child process to run the script and parses the JSON result.
- **Code Snippet:**
  ```python
  # Output format for Next.js
  response = {
      "success": True,
      "malicious": malicious,
      "pattern": pattern,
      "lockout_applied": lockout_applied,
  }
  print(json.dumps(response))
  ```

## 3. Adding Nuance: The Weighted Scoring System
**Commit:** `edbc3735272161c0e4a44d1f470bd9a048c92057`
**Date:** Thu Nov 20 18:44:26 2025 -0600
**Author:** Satyam Garg

### The Challenge
The binary detection was too aggressive. Legitimate inputs were getting blocked, and the system lacked the nuance to distinguish between a typo and an attack.

### The Solution
We moved from a boolean flag to a **Weighted Scoring System (0-100)**.

### Technical Details
- **Context-Awareness:** Instead of banning `'` entirely, we used Regex to check if `'` is followed by SQL keywords (e.g., `' OR`, `' AND`). This reduced false positives for names like "O'Reilly".
- **Scoring Logic:**
    - **+50 points:** Suspicious context (quote + keyword).
    - **+100 points:** Known attack signatures (Dictionary match).
    - **+20 points:** Heuristic noise (too many special characters).
- **Thresholds:** A score of **80** was established as the threshold for blocking.
- **Regex Implementation:**
  ```python
  # Regex explanation: ' followed by optional space, then OR, AND, ;, --, #, or /*
  if re.search(r"'\s*(or|and|;|--|#|/\*)", input_lower):
      score += 50
  ```

## 4. Audit Trails: Database Logging
**Commit:** `310805e4f282e48d22e85d7b07f32d5a32fb9a82`
**Date:** Thu Nov 20 19:30:58 2025 -0600
**Author:** Satyam Garg

### The Challenge
We had no persistent record of attacks or false positives, making it impossible to tune the system or investigate incidents.

### The Solution
Integrated MySQL logging directly into the mitigation tool.

### Technical Details
- **New Function:** Created `log_security_event(decision, score, query_text)`.
- **Database Schema:** Inserts a record into the `Logs` table with the decision ("block"/"allow"), suspicion score, and the query text.
- **Workflow:** This function is called immediately after the detection logic in `authenticate_user`.

## 5. Context Distinction: Query vs. Input
**Commit:** `896369af2850d0ce5eb314c108aa706bd0d3ec39`
**Date:** Thu Nov 20 22:14:12 2025 -0600
**Author:** Satyam Garg

### The Challenge
The tool was being used to analyze both *raw user input* (e.g., form fields) and *full SQL queries* (for simulation). The tool was flagging valid full queries as malicious because they naturally contained keywords like `SELECT` and `FROM`.

### The Solution
Implemented logic to detect the "intent" of the string: is it a full query or a raw input fragment?

### Technical Details
- **Full Statement Detection:** Uses Regex to check if the string starts with a standard SQL command.
  ```python
  is_full_statement = re.match(r"^\s*(select|insert|update|delete|create|alter|drop)\b", input_lower)
  ```
- **Adaptive Rules:**
    - **If Full Statement:** Standard keywords (`SELECT`, `INSERT`) are ignored to prevent false positives.
    - **If Raw Input:** Stricter rules apply. We added a high-risk check (+85 points) for standalone logic operators (`' OR`, `' AND`) which are classic injection starters.
    - **Code Snippet:**
      ```python
      if not is_full_statement:
          if re.search(r"'\s*(or|and)\b", input_lower):
              score += 85 # High score for injection starter
      ```

## 6. Hardening: Normalization & Smart Quotes
**Commit:** `3970725b87b5210eb8509729a2211b641d5373ba` (Current HEAD)
**Date:** Thu Nov 20 23:03:53 2025 -0600
**Author:** Satyam Garg

### The Challenge
Sophisticated attackers (or copy-paste users) might use "smart quotes" (curly quotes like `’`) which bypass standard regex checks but might still be interpreted as quotes by some database engines or normalization layers.

### The Solution
Input normalization and expanded dictionary attacks.

### Technical Details
- **Normalization:** Added `normalize_quotes()` to convert all variations of curly quotes to standard straight quotes (`'`) *before* analysis.
  ```python
  value.replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"')
  ```
- **Tautology Detection:** Improved Regex to catch quoted tautologies like `OR '1'='1'`, which were previously missed if the spacing wasn't exact.
- **Quick Fail:** Added an initial check for obvious signatures (e.g., `' or '`) to immediately return a score of 100, optimizing performance for clear attacks.
- **Expanded Dictionary:** Added variants like `or '1'='1` and `' or 1=1--` to the blocklist.
