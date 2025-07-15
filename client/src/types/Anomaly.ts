export interface AnomalyAlert {
  id: string;
  timestamp: string;
  rowId: number;
  featureValues: Record<string, number>;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  score: number;
}

export interface AnomalyData {
  timestamp: string;
  Usage_kWh: number;
  'CO2(tCO2)': number;
  Lagging_Current_Power_Factor: number;
  Anomaly_Label: string;
  FMEA_Diagnosis: string;
  Alert_Level: number;
}

export interface AnomalyResponse {
  date: string;
  usageKwh: number;
  co2Tco2: number;
  powerFactor: number;
  anomalyLabel: string;
  fmeaDiagnosis: string;
  alertLevel: number;
}