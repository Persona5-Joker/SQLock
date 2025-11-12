import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
import sys
import json
from datetime import datetime
from urllib.parse import quote_plus

# Database configuration
DB_USER = 'DavidWu'
DB_PASS = 'password'
DB_HOST = '10.147.17.110'
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
    "union select",        # Attempt to combine results from multiple tables
    "waitfor delay",       # Time-based injection attempt
    "xp_cmdshell",         # SQL Server command execution attempt
    "select password from", # Highly suspicious keyword combination
    "drop table",          # Table deletion attempt
    "insert into",         # Unauthorized data insertion
    "delete from",         # Unauthorized data deletion
]

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
    
    # Combine all signatures into a single pattern
    pattern = '|'.join(SQLI_SIGNATURES)
    
    # Determine which column contains the message/query to analyze
    # Adjust column name based on your actual table structure
    # Common column names: 'message', 'source', 'level', etc.
    search_column = None
    if 'message' in log_df.columns:
        search_column = 'message'
    elif 'source' in log_df.columns:
        search_column = 'source'
    elif 'level' in log_df.columns:
        search_column = 'level'
    else:
        # Use first text column
        for col in log_df.columns:
            if log_df[col].dtype == 'object':
                search_column = col
                break
    
    if search_column is None:
        print("❌ Could not find a suitable text column to analyze in logs table.", file=sys.stderr)
        return []
    
    print(f"🔍 Analyzing column: {search_column}", file=sys.stderr)
    
    # Mark suspicious rows
    log_df['is_suspicious'] = log_df[search_column].astype(str).str.contains(pattern, case=False, na=False)
    
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
        with engine.connect() as connection:
            for incident in incidents:
                sql = """
                    INSERT INTO Security_Event (decision, suspicion_score, query_template)
                    VALUES (%s, %s, %s)
                """
                connection.execute(sql, (
                    incident['decision'],
                    incident['suspicion_score'],
                    incident['query_template']
                ))
                count += 1
            connection.commit()
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
