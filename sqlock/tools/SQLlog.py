import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

# Database configuration
DB_USER = 'KatieHuang'
DB_PASS = 'password'
DB_HOST = '10.147.17.110'
DB_PORT = '3306'
DB_NAME = 'sqlockdb'

# The connection string uses the format:
# 'database_type+driver://user:password@host:port/dbname'
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def create_db_engine():
    """Creates and returns the SQLAlchemy engine."""
    try:
        engine = create_engine(DATABASE_URL)
        print("✅ Database engine created successfully.")
        return engine
    except Exception as e:
        print(f"❌ Error creating database engine: {e}")
        return None
    
def read_data():
    """Reads data from the database and returns it as a pandas DataFrame."""
    engine = create_db_engine()
    if engine is None:
        return None
    
    query = "SELECT * FROM employee_info"  # Replace with your actual table name
    try:
        df = pd.read_sql(query, engine)
        print("✅ Data read successfully.")
        return df
    except SQLAlchemyError as e:
        print(f"❌ Error reading data: {e}")
        return None
    
# Common SQLi attack signatures (patterns that suggest malicious input)
# Note: This is a simplified list; real tools use complex regex patterns.
SQLI_SIGNATURES = [
    "' OR 1=1 --",         # Classic 'always true' injection
    "union select",        # Attempt to combine results from multiple tables
    "waitfor delay",       # Time-based injection attempt
    "xp_cmdshell",         # SQL Server command execution attempt
    "select password from", # Highly suspicious keyword combination
]
    
# Load log data into a DataFrame (Example: Reading a CSV log file)
try:
    log_df = pd.read_csv("C:/Users/katie/AppData/Roaming/HeidiSQL/Sessionlogs/000001.log", 
                         sep=r'\s+', 
                         header=None, 
                         names=['IP', 'Time', 'Method', 'URL', 'Status', 'Size', 'Referrer', 'UserAgent'],
                         engine='python',
                         on_bad_lines='skip')
    print(f"Successfully loaded {log_df.shape[0]} log entries.")
except FileNotFoundError:
    print("Log file not found. Check the path.")
    log_df = pd.DataFrame()

if not log_df.empty:
    
    # Combine all signatures into a single, case-insensitive pattern for searching
    pattern = '|'.join(SQLI_SIGNATURES)
    
    # Create a new column to mark suspicious rows (looking in the URL for simplicity)
    log_df['is_suspicious'] = log_df['URL'].str.contains(pattern, case=False, na=False)
    
    # Filter for only the flagged injection attempts
    flagged_injections = log_df[log_df['is_suspicious'] == True]
    
    print(f"\nFound {flagged_injections.shape[0]} potential SQL injection attempts.")

    # Log the findings to a secure file or database table
    if not flagged_injections.empty:
        # Example: Writing the flagged data to a CSV for human review
        flagged_injections.to_csv("sqli_incidents.csv", index=False)
        print("🚨 Incident data saved to sqli_incidents.csv")
    
# Main execution
dataframe = read_data()
if dataframe is not None:
    print(dataframe.head())  # Display the first few rows of the DataFrame
else :
    print("No data to display.")

