# Data Directory

This directory stores raw datasets, preprocessed flight CSV/Parquet files, and sample benchmark data for training the **FlightSense AI** model.

## 📄 Dataset Schema

The `sample_flights.csv` file provides a sample schema compatible with US Department of Transportation (BTS) data:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `flight_number` | String | Carrier and flight code (e.g., AA-1042) |
| `carrier` | String | IATA Airline Code (e.g. AA, DL, UA, WN) |
| `origin` | String | Departure Airport IATA Code (e.g. JFK, ORD, ATL) |
| `destination` | String | Arrival Airport IATA Code (e.g. LAX, SFO, MIA) |
| `dep_time` | ISO String | Scheduled departure time |
| `arr_time` | ISO String | Scheduled arrival time |
| `distance` | Integer | Distance in miles |
| `aircraft_type` | String | Aircraft model (e.g., Boeing 737-800) |
| `temp_celsius` | Float | Temperature at origin airport (°C) |
| `wind_speed_knots` | Float | Wind speed at origin airport (knots) |
| `precipitation_mm` | Float | Rain/snow precipitation (mm) |
| `visibility_miles` | Float | Visibility (miles) |
| `dep_delay` | Float | Departure delay in minutes |
| `arr_delay` | Float | Arrival delay in minutes |
| `is_delayed` | Integer | Binary classification target (1 if arr_delay >= 15 else 0) |
