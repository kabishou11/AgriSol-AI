# Energy Monitoring Module

## Overview
A comprehensive energy monitoring and optimization system with real-time data visualization, weather-based generation forecasting, and intelligent optimization recommendations.

## Features

### 1. Real-time Monitoring
- **Today's Generation**: Live solar generation data with trend indicators
- **Today's Consumption**: Real-time energy consumption tracking
- **Self-Sufficiency Rate**: Dynamic calculation with progress visualization
- **Savings Calculation**: Automatic revenue and savings computation

### 2. Generation Forecast
- **7-Day Weather Forecast**: Integration with Open-Meteo API
- **Solar Generation Prediction**: Based on sunshine duration and cloud cover
- **Daily Breakdown**: Detailed forecast with weather conditions
- **Revenue Estimation**: Predicted earnings from energy generation

### 3. Optimization Recommendations
- **Intelligent Suggestions**: AI-powered optimization advice
- **Priority Levels**: High, medium, and low priority recommendations
- **Actionable Insights**: Specific actions to improve efficiency
- **Real-time Alerts**: Peak consumption and low self-sufficiency warnings

### 4. Energy Storage
- **Capacity Recommendations**: Optimal battery storage calculations
- **Payback Period**: ROI analysis for storage systems
- **Deficit Analysis**: Energy gap identification
- **Savings Estimation**: Annual savings projections

### 5. Equipment Management
- **Device Registry**: Track all energy generation and storage devices
- **Status Monitoring**: Real-time device status tracking
- **Capacity Management**: Monitor installed capacity
- **Easy Addition**: Simple interface to add new devices

### 6. Data Visualization
- **Generation Trend Chart**: Area chart showing generation over time
- **Consumption Structure**: Pie chart of energy usage by category
- **Energy Flow Diagram**: Sankey diagram showing energy distribution
- **Monthly Comparison**: Bar chart comparing generation and consumption
- **Real-time Gauge**: Live power generation indicator
- **Annual Statistics**: Yearly trends and self-sufficiency rates

## API Endpoints

### Energy Records
```
POST /api/energy/record
```
Record energy generation and consumption data.

**Request Body:**
```json
{
  "generation": 45.5,
  "consumption": 38.2,
  "gridImport": 0,
  "gridExport": 7.3,
  "batteryCharge": 2.0,
  "batteryDischarge": 0,
  "deviceType": "solar"
}
```

### Today's Data
```
GET /api/energy/today
```
Get today's energy statistics.

**Response:**
```json
{
  "generation": "45.50",
  "consumption": "38.20",
  "gridImport": "0.00",
  "gridExport": "7.30",
  "selfSufficiency": "119.11",
  "savings": "4.65",
  "timestamp": "2026-03-11T10:30:00.000Z"
}
```

### Forecast
```
GET /api/energy/forecast?latitude=39.9&longitude=116.4&capacity=10
```
Get 7-day generation forecast.

**Response:**
```json
{
  "forecast": {
    "daily": [...],
    "total": "150.50",
    "averageDaily": "21.50"
  },
  "recommendations": [...],
  "storage": {...},
  "revenue": {...}
}
```

### Statistics
```
GET /api/energy/statistics?period=week
```
Get historical statistics (day/week/month/year).

### Optimization
```
POST /api/energy/optimize
```
Get optimization suggestions.

### Devices
```
GET /api/energy/devices
POST /api/energy/devices
```
Manage energy devices.

## Database Schema

### energy_records
```sql
CREATE TABLE energy_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  generation REAL NOT NULL,
  consumption REAL NOT NULL,
  grid_import REAL DEFAULT 0,
  grid_export REAL DEFAULT 0,
  battery_charge REAL DEFAULT 0,
  battery_discharge REAL DEFAULT 0,
  device_type TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### energy_devices
```sql
CREATE TABLE energy_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  capacity REAL,
  status TEXT DEFAULT 'active',
  installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Services

### Energy Prediction Service
Located at: `server/src/services/energy-prediction.js`

**Functions:**
- `calculateSolarForecast()`: Weather-based solar generation prediction
- `analyzeConsumptionPattern()`: Historical consumption analysis
- `generateOptimizationRecommendations()`: AI-powered suggestions
- `calculateStorageRecommendations()`: Battery capacity calculations
- `calculateRevenue()`: Financial analysis
- `getEnergyPrediction()`: Comprehensive prediction data

### Weather Service
Located at: `server/src/services/weather.js`

**Functions:**
- `getWeatherData()`: Fetch weather from Open-Meteo API
- `calculateSolarPotential()`: Solar energy potential calculation
- `calculateWindPotential()`: Wind energy potential calculation
- `calculateSolarRadiation()`: Solar radiation analysis
- `clearWeatherCache()`: Cache management

**Features:**
- 30-minute caching
- Automatic fallback to cached data
- Comprehensive weather parameters

## Frontend Components

### Energy.vue
Main energy monitoring dashboard with:
- Real-time statistics cards
- Generation forecast table
- Optimization recommendations
- Storage recommendations
- Equipment management
- Interactive charts

### EnergyCharts.vue
Reusable chart components:
- Generation trend (area chart)
- Consumption structure (pie chart)
- Energy flow (Sankey diagram)
- Monthly comparison (bar chart)
- Real-time gauge
- Annual statistics

## Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Seed Sample Data
```bash
npm run seed
```

### 3. Start Server
```bash
npm run dev
```

### 4. Access Dashboard
Navigate to the Energy page in the web interface.

## Configuration

### Weather API
The system uses Open-Meteo API (free, no API key required).

Default location: Beijing (39.9°N, 116.4°E)

To change location, update the API calls in `Energy.vue`:
```javascript
const data = await api.energy.getForecast({
  latitude: YOUR_LATITUDE,
  longitude: YOUR_LONGITUDE,
  capacity: YOUR_CAPACITY_IN_KW
})
```

### Electricity Rates
Default rates in `energy-prediction.js`:
```javascript
const rates = {
  grid: 0.6,    // Grid feed-in rate (元/kWh)
  retail: 1.0   // Retail electricity rate (元/kWh)
}
```

## Usage Examples

### Record Energy Data
```javascript
await api.energy.record({
  generation: 45.5,
  consumption: 38.2,
  gridExport: 7.3
})
```

### Get Forecast
```javascript
const forecast = await api.energy.getForecast({
  latitude: 39.9,
  longitude: 116.4,
  capacity: 10
})
```

### Add Device
```javascript
await api.energy.addDevice({
  deviceName: '太阳能板组A',
  deviceType: 'solar',
  capacity: 5.0
})
```

## Performance

- **Weather API**: Cached for 30 minutes
- **Auto-refresh**: Dashboard updates every 30 seconds
- **Database**: Indexed for fast queries
- **Charts**: Optimized with ECharts

## Future Enhancements

1. **WebSocket Integration**: Real-time data streaming
2. **Mobile App**: Native mobile application
3. **Advanced Analytics**: Machine learning predictions
4. **Battery Management**: Detailed battery optimization
5. **Grid Integration**: Smart grid communication
6. **Cost Optimization**: Dynamic pricing strategies
7. **Alerts System**: Email/SMS notifications
8. **Export Reports**: PDF/Excel report generation

## Troubleshooting

### No Forecast Data
- Check internet connection
- Verify latitude/longitude values
- Check Open-Meteo API status

### Missing Charts
- Ensure ECharts is installed
- Check browser console for errors
- Verify chart data format

### Database Errors
- Run `npm run seed` to reset data
- Check database file permissions
- Verify SQLite installation

## Support

For issues or questions, please refer to the main project documentation.
