import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import RobustScaler
from sklearn.covariance import EllipticEnvelope
from datetime import datetime

# ---------------------------
# Generate FMEA Diagnosis
# ---------------------------
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
        deviation = abs(analyses['power_factor']['percentageDeviation'])
        
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
        else:
            causes.append(f"{severity_text}: Power factor deviation {deviation:.1f}% from normal ({value:.2f})")
            recommendations.extend([
                'Monitor power factor trends',
                'Check system stability',
                'Review power factor correction settings'
            ])

    return f"CAUSES:\n{'\n'.join(causes)}\n\nRECOMMENDATIONS:\n{'\n'.join(['• ' + r for r in recommendations])}"

# ---------------------------
# Main function
# ---------------------------
def train_and_detect_anomalies_from_df(df: pd.DataFrame):
    try:
        # Ensure timestamp column
        if 'timestamp' not in df.columns:
            if 'date' in df.columns:
                df.rename(columns={'date': 'timestamp'}, inplace=True)
            else:
                df['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        df['timestamp'] = pd.to_datetime(df['timestamp'])

        # Features
        features = ['usage_kwh', 'co2_tco2', 'power_factor']
        for col in features:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col].fillna(df[col].mean(), inplace=True)

        # Scale features
        scaler = RobustScaler()
        X_scaled = scaler.fit_transform(df[features])

        # Models
        contamination = 0.1
        iforest = IsolationForest(n_estimators=200, contamination=contamination, random_state=42)
        ee = EllipticEnvelope(contamination=contamination, random_state=42)

        preds_iforest = iforest.fit_predict(X_scaled)
        preds_ee = ee.fit_predict(X_scaled)

        # Combine predictions
        df['Anomaly'] = ((preds_iforest + preds_ee) / 2 < 0).astype(int) * -1

        # Stats for analysis
        means = df[features].mean()
        stds = df[features].std()

        anomalies = []
        for _, row in df[df['Anomaly'] == -1].iterrows():
            analyses = {}
            for metric in features:
                mean = means[metric]
                std = stds[metric]
                value = row[metric]
                deviation = ((value - mean) / mean * 100) if mean != 0 else 0
                z_score = abs((value - mean) / std) if std != 0 else 0

                # Severity
                if z_score > 3.0:
                    severity = "critical"
                elif z_score > 2.0:
                    severity = "moderate"
                elif z_score > 1.5:
                    severity = "minor"
                else:
                    severity = "normal"

                analyses[metric] = {
                    'isAnomaly': severity != 'normal',
                    'severity': severity,
                    'percentageDeviation': deviation,
                    'direction': 'high' if value > mean else 'low',
                    'value': value
                }

            # Skip if no anomaly
            if not any(a['isAnomaly'] for a in analyses.values()):
                continue

            # FMEA Diagnosis
            diagnosis = generate_fmea_diagnosis(analyses)
            alert_level = max(
                (a['severity'] for a in analyses.values() if a['isAnomaly']),
                key=lambda s: ['minor', 'moderate', 'critical'].index(s)
            )

            anomaly_types = ', '.join(f"{analyses[m]['severity'].upper()} {m}" for m in analyses if analyses[m]['isAnomaly'])

            anomalies.append({
                'timestamp': row['timestamp'].isoformat(),
                'Usage_kWh': float(row['usage_kwh']),
                'CO2(tCO2)': float(row['co2_tco2']),
                'Lagging_Current_Power_Factor': float(row['power_factor']),
                'Anomaly_Label': f"Anomaly in: {anomaly_types}",
                'FMEA_Diagnosis': diagnosis,
                'Alert_Level': alert_level
            })

        return anomalies

    except Exception as e:
        return [{'error': str(e)}]
