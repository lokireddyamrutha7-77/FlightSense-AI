import pandas as pd
import numpy as np
from pathlib import Path
import time

data_path = Path("data/flights.csv")
print(f"Reading dataset: {data_path}")
start = time.time()

# Read first 100k rows to inspect schema & data types quickly
df_sample = pd.read_csv(data_path, nrows=100000)
print("Sample columns:", df_sample.columns.tolist())
print(df_sample.head(3))

# Full count check (chunked for memory efficiency)
total_rows = 0
missing_arr_delay = 0
cancelled_count = 0
diverted_count = 0
valid_rows = 0

print("Scanning full dataset in chunks...")
chunks = pd.read_csv(data_path, chunksize=500000, usecols=['MONTH', 'DAY', 'DAY_OF_WEEK', 'AIRLINE', 'ORIGIN_AIRPORT', 'DESTINATION_AIRPORT', 'SCHEDULED_DEPARTURE', 'SCHEDULED_ARRIVAL', 'DISTANCE', 'ARRIVAL_DELAY', 'CANCELLED', 'DIVERTED'])

airline_counts = {}
origin_counts = {}
month_counts = {}
delayed_count = 0

for chunk in chunks:
    total_rows += len(chunk)
    cancelled_count += chunk['CANCELLED'].sum()
    diverted_count += chunk['DIVERTED'].sum()
    
    valid = chunk[(chunk['CANCELLED'] == 0) & (chunk['DIVERTED'] == 0) & chunk['ARRIVAL_DELAY'].notna()]
    valid_rows += len(valid)
    delayed_count += (valid['ARRIVAL_DELAY'] > 15).sum()
    
    for m, cnt in valid['MONTH'].value_counts().items():
        month_counts[m] = month_counts.get(m, 0) + cnt

end = time.time()
print(f"Total Rows: {total_rows}")
print(f"Cancelled: {cancelled_count}, Diverted: {diverted_count}")
print(f"Valid Rows with Arrival Delay: {valid_rows}")
print(f"Delayed (>15 mins): {delayed_count} ({delayed_count / valid_rows:.4%})")
print(f"Scan completed in {end - start:.2f}s")
