from flask import Flask, request, jsonify, Response
import numpy as np
from flask_cors import CORS
import pandas as pd
from io import StringIO
from datetime import datetime, timedelta
import traceback

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def index():
    return 'Hello, World!'

@app.route('/train', methods=['POST', 'OPTIONS'])
def train():
    if request.method == 'OPTIONS':
        return ('', 200)

    try:
        data = request.json
        csv_content = data.get('csvContent')
        model_type = data.get('modelType')
        file_id = data.get('fileId')

        if not csv_content or not isinstance(csv_content, str):
            return jsonify({'error': 'Invalid or missing CSV content'}), 400
        if not model_type or not isinstance(model_type, str):
            return jsonify({'error': 'Invalid or missing model type'}), 400
        if not file_id or not isinstance(file_id, str):
            return jsonify({'error': 'Invalid or missing file ID'}), 400

        # Parse CSV content
        data_points = parse_csv(csv_content)
        if not data_points:
            return jsonify({'error': 'No valid data points found in CSV'}), 400

        anomalies = detect_anomalies(data_points)

        return jsonify(anomalies), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def parse_csv(csv_content):
    # Parse CSV content into a DataFrame
    df = pd.read_csv(StringIO(csv_content))
    df.columns = df.columns.str.strip().str.lower()  # Normalize column names
    return df.to_dict(orient='records')

def analyze_metric(value, mean, std):
    z_score = abs((value - mean) / std) if std != 0 else 0
    percentage_deviation = ((value - mean) / mean * 100) if mean != 0 else 0

    severity = 'normal'
    if z_score > 3.5:
        severity = 'critical'
    elif z_score > 2.8:
        severity = 'moderate'
    elif z_score > 2.0:
        severity = 'minor'

    return {
        'value': value,
        'mean': mean,
        'std': std,
        'zScore': z_score,
        'percentageDeviation': percentage_deviation,
        'isAnomaly': z_score > 2.0,
        'severity': severity,
        'direction': 'high' if value > mean else 'low'
    }

def generate_fmea_diagnosis(analyses):
    causes = []
    recommendations = []

    # Energy consumption analysis
    if analyses['usage_kwh']['isAnomaly']:
        severity_text = analyses['usage_kwh']['severity'].upper()
        deviation = abs(analyses['usage_kwh']['percentageDeviation'])
        
        if analyses['usage_kwh']['direction'] == 'high':
            causes.append(f"{severity_text}: Energy consumption {deviation:.1f}% above normal")
            if analyses['usage_kwh']['severity'] == 'critical':
                recommendations.extend([
                    'Immediate inspection of high-energy equipment',
                    'Check for system overload conditions',
                    'Verify emergency protocols'
                ])
            elif analyses['usage_kwh']['severity'] == 'moderate':
                recommendations.extend([
                    'Schedule equipment maintenance',
                    'Review operational efficiency',
                    'Check for unauthorized usage'
                ])
            else:
                recommendations.extend([
                    'Monitor equipment performance',
                    'Review energy usage patterns',
                    'Consider optimization opportunities'
                ])
        else:
            causes.append(f"{severity_text}: Energy consumption {deviation:.1f}% below normal")
            recommendations.extend([
                'Verify equipment operation',
                'Check for measurement errors',
                'Review production schedules'
            ])

    # CO2 emissions analysis
    if analyses['co2_tco2']['isAnomaly']:
        severity_text = analyses['co2_tco2']['severity'].upper()
        deviation = abs(analyses['co2_tco2']['percentageDeviation'])
        
        if analyses['co2_tco2']['direction'] == 'high':
            causes.append(f"{severity_text}: CO2 emissions {deviation:.1f}% above normal")
            if analyses['co2_tco2']['severity'] == 'critical':
                recommendations.extend([
                    'Immediate emission control system check',
                    'Verify combustion efficiency',
                    'Emergency protocol review'
                ])
            elif analyses['co2_tco2']['severity'] == 'moderate':
                recommendations.extend([
                    'Schedule emission system maintenance',
                    'Check fuel quality',
                    'Review operational parameters'
                ])
            else:
                recommendations.extend([
                    'Monitor emission trends',
                    'Regular system checks',
                    'Consider efficiency improvements'
                ])
        else:
            causes.append(f"{severity_text}: CO2 emissions {deviation:.1f}% below normal")
            recommendations.extend([
                'Verify sensor calibration',
                'Check production levels',
                'Review system efficiency'
            ])

    # Power factor analysis
    if analyses['power_factor']['isAnomaly']:
        severity_text = analyses['power_factor']['severity'].upper()
        value = analyses['power_factor']['value']
        
        if value < 0.85:
            causes.append(f"{severity_text}: Low power factor ({value:.2f})")
            if analyses['power_factor']['severity'] == 'critical':
                recommendations.extend([
                    'Immediate capacitor bank inspection',
                    'Check for equipment malfunction',
                    'Review reactive power compensation'
                ])
            elif analyses['power_factor']['severity'] == 'moderate':
                recommendations.extend([
                    'Schedule power factor correction',
                    'Monitor reactive power',
                    'Check motor loads'
                ])
            else:
                recommendations.extend([
                    'Regular power factor monitoring',
                    'Consider system optimization',
                    'Plan preventive maintenance'
                ])
        elif value > 0.98:
            causes.append(f"{severity_text}: Power factor over-compensation ({value:.2f})")
            recommendations.extend([
                'Adjust compensation settings',
                'Review capacitor bank sizing',
                'Monitor leading power factor'
            ])

    return f"CAUSES:\n{'\n'.join(causes)}\n\nRECOMMENDATIONS:\n{'\n'.join(['• ' + r for r in recommendations])}"

def detect_anomalies(data):
    metrics = ['usage_kwh', 'co2_tco2', 'power_factor']
    df = pd.DataFrame(data)

    # Calculate statistics for each metric
    stats = {}
    for metric in metrics:
        mean = df[metric].mean()
        std = df[metric].std()
        stats[metric] = {'mean': mean, 'std': std}

    # Detect and analyze anomalies
    results = []
    for index, point in df.iterrows():
        analyses = {
            'usage_kwh': analyze_metric(point['usage_kwh'], stats['usage_kwh']['mean'], stats['usage_kwh']['std']),
            'co2_tco2': analyze_metric(point['co2_tco2'], stats['co2_tco2']['mean'], stats['co2_tco2']['std']),
            'power_factor': analyze_metric(point['power_factor'], stats['power_factor']['mean'], stats['power_factor']['std'])
        }

        if any(a['isAnomaly'] for a in analyses.values()):
            alert_level = max(analyses[metric]['severity'] for metric in analyses)
            diagnosis = generate_fmea_diagnosis(analyses)
            anomaly_types = ', '.join(f"{analyses[metric]['severity'].upper()} {metric}" for metric in analyses if analyses[metric]['isAnomaly'])

            results.append({
                'timestamp': point['timestamp'],  # Changed from 'date' to 'timestamp'
                'Usage_kWh': point['usage_kwh'],
                'CO2(tCO2)': point['co2_tco2'],
                'Lagging_Current_Power_Factor': point['power_factor'],
                'Anomaly_Label': f'Anomaly in: {anomaly_types}',
                'FMEA_Diagnosis': diagnosis,
                'Alert_Level': alert_level
            })

    return results

def predict_next_value(historical_data, days):
    predictions = []
    n = len(historical_data)
    
    # Calculate trend using simple linear regression
    sum_x = sum_y = sum_xy = sum_x2 = 0
    for i, y in enumerate(historical_data):
        sum_x += i
        sum_y += y
        sum_xy += i * y
        sum_x2 += i * i
    
    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x) if (n * sum_x2 - sum_x * sum_x) != 0 else 0
    intercept = (sum_y - slope * sum_x) / n if n > 0 else 0
    
    # Calculate seasonality (weekly)
    season_length = 7
    seasonal_factors = [0] * season_length
    season_counts = [0] * season_length
    
    for i, y in enumerate(historical_data):
        season = i % season_length
        trend = slope * i + intercept
        seasonal_factors[season] += y / trend if trend != 0 else 1
        season_counts[season] += 1
    
    for i in range(season_length):
        seasonal_factors[i] = seasonal_factors[i] / season_counts[i] if season_counts[i] > 0 else 1
    
    # Generate predictions with random variations
    for i in range(days):
        trend = slope * (n + i) + intercept
        seasonal = seasonal_factors[i % season_length]
        random_variation = 1 + (np.random.uniform(-0.05, 0.05))
        predictions.append(trend * seasonal * random_variation)
    
    return predictions

def generate_future_dates(start_date, days):
    dates = []
    current_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    
    for i in range(days):
        current_date += timedelta(days=1)
        dates.append(current_date.isoformat() + 'Z')
    
    return dates

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        return Response('ok', headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
        })

    try:
        data = request.get_json()
        historical_data = data.get('historicalData')
        days = data.get('days')

        if not historical_data or not isinstance(historical_data, list):
            raise ValueError('Invalid historical data')
        
        if not days or not isinstance(days, int):
            raise ValueError('Invalid number of days')

        # Get the last date from historical data
        last_date = historical_data[-1]['date']
        future_dates = generate_future_dates(last_date, days)

        # Predict each metric
        usage_predictions = predict_next_value(
            [d['usage_kwh'] for d in historical_data], days
        )
        co2_predictions = predict_next_value(
            [d['co2_tco2'] for d in historical_data], days
        )
        pf_predictions = predict_next_value(
            [d['power_factor'] for d in historical_data], days
        )

        # Combine predictions
        predictions = [
            {
                'date': date,
                'usage_kwh': max(0, usage_pred),  # Ensure non-negative
                'co2_tco2': max(0, co2_pred),
                'power_factor': min(1, max(0, pf_pred))  # Ensure between 0 and 1
            }
            for date, usage_pred, co2_pred, pf_pred in zip(future_dates, usage_predictions, co2_predictions, pf_predictions)
        ]

        return jsonify(predictions), 200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
        }

    except Exception as e:
        return jsonify({
            'error': str(e),
            'details': traceback.format_exc()
        }), 500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
        }

if __name__ == '__main__':
    app.run(debug=True)
