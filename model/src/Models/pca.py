import pandas as pd
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from datetime import datetime

def generate_fmea_diagnosis_pca(analyses):
    causes = []
    recommendations = []

    # Energy consumption analysis
    if analyses['usage_kwh']['isAnomaly']:
        severity_text = analyses['usage_kwh']['severity'].upper()
        deviation = abs(analyses['usage_kwh']['percentageDeviation'])
        if analyses['usage_kwh']['direction'] == 'high':
            causes.append(f"{severity_text}: Energy consumption {deviation:.1f}% above normal")
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


def train_and_detect_anomalies_from_df(df: pd.DataFrame):
    try:
        # Ensure timestamp column
        if 'timestamp' not in df.columns:
            if 'date' in df.columns:
                df.rename(columns={'date': 'timestamp'}, inplace=True)
            else:
                df['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        df['timestamp'] = pd.to_datetime(df['timestamp'])

        # Select numeric features
        features = ['usage_kwh', 'co2_tco2', 'power_factor']
        for col in features:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col].fillna(df[col].mean(), inplace=True)

        # Normalize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(df[features])

        # PCA for dimensionality reduction
        pca = PCA(n_components=2)
        X_pca = pca.fit_transform(X_scaled)

        # Reconstruction error
        X_reconstructed = pca.inverse_transform(X_pca)
        reconstruction_errors = np.sum((X_scaled - X_reconstructed) ** 2, axis=1)

        # Anomaly detection (Top 10% as anomalies)
        threshold = np.percentile(reconstruction_errors, 90)
        df['Anomaly'] = (reconstruction_errors > threshold).astype(int) * -1

        # Prepare output
        anomalies = []
        means = df[features].mean()
        stds = df[features].std()

        for idx, row in df[df['Anomaly'] == -1].iterrows():
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

            if not any(a['isAnomaly'] for a in analyses.values()):
                continue

            # Generate FMEA Diagnosis
            diagnosis = generate_fmea_diagnosis_pca(analyses)
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
