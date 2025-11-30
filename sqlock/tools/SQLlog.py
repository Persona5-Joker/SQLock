import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
import sys
import json
import re
from datetime import datetime
from urllib.parse import quote_plus

# Database configuration
DB_USER = 'DavidWu'
DB_PASS = 'password'
DB_HOST = '100.114.100.66'
DB_PORT = '3306'
DB_NAME = 'sqlockdb'

# The connection string uses the format:
# 'database_type+driver://user:password@host:port/dbname'
# URL-encode username and password to handle special characters (like spaces)
DATABASE_URL = f"mysql+pymysql://{quote_plus(DB_USER)}:{quote_plus(DB_PASS)}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def create_db_engine():
    """Creates and returns the SQLAlchemy engine."""
    try:
        engine = create_engine(DATABASE_URL)
        return engine
    except Exception as e:
        print(f"❌ Error creating database engine: {e}", file=sys.stderr)
        return None
    
def read_data():
    """Reads data from the database and returns it as a pandas DataFrame."""
    engine = create_db_engine()
    if engine is None:
        return None
    
    query = "SELECT * FROM employee_info"
    try:
        df = pd.read_sql(query, engine)
        return df
    except SQLAlchemyError as e:
        print(f"❌ Error reading data: {e}", file=sys.stderr)
        return None
    
# Common SQLi attack signatures (patterns that suggest malicious input)
SQLI_SIGNATURES = [
    "' OR 1=1 --",         # Classic 'always true' injection
    "or 1=1",              # simpler variant without quotes
    "union select",        # Attempt to combine results from multiple tables
    "waitfor delay",       # Time-based injection attempt
    "xp_cmdshell",         # SQL Server command execution attempt
    "select password from", # Highly suspicious keyword combination
    "drop table",          # Table deletion attempt
    "insert into",         # Unauthorized data insertion
    "delete from",         # Unauthorized data deletion
    "select .* from",      # generic select-from pattern
]


def _signature_to_regex(sig: str) -> str:
    """Convert a human-readable signature into a relaxed regex.

    - Splits on whitespace, removes purely-punctuation tokens (like `--`),
      escapes the rest and joins with '\\s+' so intermediate whitespace/punctuation is allowed.
    - Adds word boundaries for single-word tokens when appropriate.
    """
    sig = sig.strip()
    if not sig:
        return re.escape(sig)

    tokens = re.split(r"\s+", sig)
    cleaned = []
    for t in tokens:
        # strip surrounding quotes
        t2 = re.sub(r"^[\'\"]|[\'\"]$", "", t)
        # skip tokens that are only punctuation (e.g. '--')
        if re.fullmatch(r"[^A-Za-z0-9_=]+", t2):
            continue
        cleaned.append(re.escape(t2))

    if not cleaned:
        return re.escape(sig)
    if len(cleaned) == 1:
        return r"\b" + cleaned[0] + r"\b"
    return r"\b" + r"\s+".join(cleaned) + r"\b"

def analyze_logs_from_database():
    """
    Reads logs from the database 'logs' table and analyzes them for SQL injection patterns.
    Returns a list of flagged incidents.
    """
    engine = create_db_engine()
    if engine is None:
        return []
    
    try:
        # Read from the logs table
        query = "SELECT * FROM logs"
        log_df = pd.read_sql(query, engine)
        print(f"📊 Loaded {len(log_df)} log entries from database.", file=sys.stderr)
    except SQLAlchemyError as e:
        print(f"❌ Error reading logs from database: {e}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return []

    if log_df.empty:
        print("⚠️  No logs found in database.", file=sys.stderr)
        return []
    
    # Build a robust regex pattern from the signatures
    additional_patterns = [
        r"\bor\s*1\s*=\s*1\b",
        r"\bunion\s+select\b",
        r"\bdrop\s+table\b",
        r"\binsert\s+into\b",
        r"\bdelete\s+from\b",
        r"\bselect\b.*\bfrom\b",
    ]

    signature_patterns = [_signature_to_regex(s) for s in SQLI_SIGNATURES]
    # Use a non-capturing group to avoid creating regex capture groups
    pattern = '(?:' + '|'.join(signature_patterns + additional_patterns) + ')'

    # Determine which column contains the message/query to analyze
    # Try a list of likely column names first, then fall back to first text column
    preferred_cols = ['message', 'msg', 'query', 'query_template', 'request', 'log', 'body', 'payload', 'source', 'level']
    search_column = None
    for c in preferred_cols:
        if c in log_df.columns:
            search_column = c
            break
    if search_column is None:
        for col in log_df.columns:
            if log_df[col].dtype == 'object':
                search_column = col
                break
    
    if search_column is None:
        print("❌ Could not find a suitable text column to analyze in logs table.", file=sys.stderr)
        return []
    
    print(f"🔍 Analyzing column: {search_column}", file=sys.stderr)
    
    # Mark suspicious rows using regex search (case-insensitive)
    try:
        log_df['is_suspicious'] = log_df[search_column].astype(str).str.contains(pattern, case=False, na=False, regex=True)
    except re.error as e:
        # Fallback: if our pattern compilation fails, fall back to a simple substring check
        print(f"⚠️  Regex error building pattern: {e}. Falling back to substring checks.", file=sys.stderr)
        simple_pattern = '|'.join([s for s in SQLI_SIGNATURES])
        log_df['is_suspicious'] = log_df[search_column].astype(str).str.contains(simple_pattern, case=False, na=False)
    
    # Filter flagged injections
    flagged_injections = log_df[log_df['is_suspicious'] == True]
    
    print(f"🚨 Found {len(flagged_injections)} suspicious entries.", file=sys.stderr)
    
    # Convert to list of dicts for easier processing
    incidents = []
    for _, row in flagged_injections.iterrows():
        incidents.append({
            'timestamp': row.get('timestamp', datetime.now()),
            'level': row.get('level', 'unknown'),
            'message': row.get('message', str(row[search_column])),
            'source': row.get('source', 'database_logs'),
            'decision': 'block',  # All flagged incidents are blocked
            'suspicion_score': 90,  # High suspicion for pattern matches
            'query_template': str(row[search_column])
        })
    
    return incidents

def save_incidents_to_db(incidents):
    """
    Saves flagged incidents to the Security_Event table.
    """
    if not incidents:
        return 0
    
    engine = create_db_engine()
    if engine is None:
        return 0
    
    count = 0
    try:
        # Use a transaction context to ensure commits; use SQLAlchemy text() for safe binding
        with engine.begin() as connection:
            sql = text(
                "INSERT INTO Security_Event (decision, suspicion_score, query_template) VALUES (:decision, :score, :template)"
            )
            for incident in incidents:
                connection.execute(
                    sql,
                    {
                        'decision': incident['decision'],
                        'score': incident['suspicion_score'],
                        'template': incident['query_template'],
                    },
                )
                count += 1
    except Exception as e:
        print(f"❌ Error saving incidents to database: {e}", file=sys.stderr)
        return 0
    
    return count
    
# Main execution
if __name__ == "__main__":
    # Check if running as CLI tool or imported as module
    if len(sys.argv) > 1 and sys.argv[1] == '--from-db':
        # Database mode: analyze logs from database table
        print(f"📂 Analyzing logs from database table...", file=sys.stderr)
        incidents = analyze_logs_from_database()
        
        print(f"\n🔍 Found {len(incidents)} potential SQL injection attempts.", file=sys.stderr)
        
        if incidents:
            # Save to CSV for review
            incidents_df = pd.DataFrame(incidents)
            incidents_df.to_csv("sqli_incidents.csv", index=False)
            print("📄 Incident data saved to sqli_incidents.csv", file=sys.stderr)
            
            # Also save to database
            saved_count = save_incidents_to_db(incidents)
            print(f"💾 Saved {saved_count} incidents to Security_Event table", file=sys.stderr)
            
            # Output JSON for API consumption
            print("\n" + json.dumps({
                'success': True,
                'incidents_found': len(incidents),
                'incidents_saved': saved_count
            }))
        else:
            print("✅ No suspicious activity detected.", file=sys.stderr)
            print(json.dumps({
                'success': True,
                'incidents_found': 0,
                'incidents_saved': 0
            }))
    else:
        # No arguments or different arguments: just read and display employee data (original behavior)
        dataframe = read_data()
        if dataframe is not None:
            print("✅ Data read successfully.")
            print(dataframe.head())
        else:
            print("❌ No data to display.")
