# FlightSense AI — Database Schema Specification

Target Database System: **PostgreSQL 14+**
ORM Framework: **SQLAlchemy 2.0 / Pydantic v2**

---

## 🗄️ Entity Relationship Diagram (Conceptual)

```
+------------------------+          +------------------------+
|        Airports        |          |        Airlines        |
+------------------------+          +------------------------+
| code (PK)              |          | code (PK)              |
| name                   |          | name                   |
| city, state, country   |          | fleet_size             |
| lat, lon               |          +-----------+------------+
+-----------+------------+                      |
            |                                   |
            | 1:N                               | 1:N
            v                                   v
+------------------------------------------------------------+
|                          Flights                           |
+------------------------------------------------------------+
| id (PK)                                                    |
| flight_number                                              |
| carrier_code (FK -> Airlines.code)                         |
| origin_code (FK -> Airports.code)                          |
| dest_code (FK -> Airports.code)                            |
| scheduled_departure_utc                                   |
| distance_miles                                             |
| status                                                     |
+-----------------------------+------------------------------+
                              | 1:N
                              v
+------------------------------------------------------------+
|                     PredictionLogs                         |
+------------------------------------------------------------+
| id (PK, UUID)                                              |
| flight_id (FK -> Flights.id, optional)                     |
| input_features_json                                        |
| delay_probability                                          |
| predicted_delay_minutes                                    |
| risk_level                                                 |
| shap_values_json                                           |
| actual_delay_minutes (NULL until resolved)                 |
| created_at                                                 |
+------------------------------------------------------------+
```

---

## 📜 Table Definitions (SQL DDL)

```sql
-- 1. AIRPORTS TABLE
CREATE TABLE airports (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50),
    country VARCHAR(100) DEFAULT 'USA',
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    timezone VARCHAR(50) DEFAULT 'America/New_York'
);

-- 2. AIRLINES TABLE
CREATE TABLE airlines (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) DEFAULT 'USA',
    fleet_size INT DEFAULT 0
);

-- 3. FLIGHTS TABLE
CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL,
    carrier_code VARCHAR(10) REFERENCES airlines(code),
    origin_code VARCHAR(10) REFERENCES airports(code),
    dest_code VARCHAR(10) REFERENCES airports(code),
    scheduled_departure TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_arrival TIMESTAMP WITH TIME ZONE NOT NULL,
    distance_miles INT NOT NULL,
    aircraft_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PREDICTION LOGS TABLE
CREATE TABLE prediction_logs (
    id VARCHAR(50) PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL,
    carrier_code VARCHAR(10),
    origin_code VARCHAR(10),
    dest_code VARCHAR(10),
    input_features JSONB NOT NULL,
    delay_probability NUMERIC(5, 4) NOT NULL,
    predicted_delay_minutes NUMERIC(6, 2) NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    shap_values JSONB,
    actual_delay_minutes NUMERIC(6, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. MODEL METRICS TABLE
CREATE TABLE model_metrics (
    id SERIAL PRIMARY KEY,
    model_version VARCHAR(50) NOT NULL,
    roc_auc NUMERIC(5, 4),
    precision_score NUMERIC(5, 4),
    recall_score NUMERIC(5, 4),
    f1_score NUMERIC(5, 4),
    mae_minutes NUMERIC(6, 2),
    trained_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    parameters JSONB
);
```
