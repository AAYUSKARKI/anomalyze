import { z } from 'zod';

export const AnomalySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  date: z.string().transform((date) => new Date(date)),
  usageKwh: z.number(),
  co2Tco2: z.number(),
  powerFactor: z.number(),
  anomalyLabel: z.string(),
  fmeaDiagnosis: z.string(),
  alertLevel: z.string(),  
  fileId: z.string()
});

export const InsertAnomalySchema = z.object({
  anomalies: z.array(
    z.object({
      date: z.string().transform((date) => new Date(date)),
      usageKwh: z.number(),
      co2Tco2: z.number(),
      powerFactor: z.number(),
      anomalyLabel: z.string(),
      fmeaDiagnosis: z.string(),
      alertLevel: z.string(),
      fileId: z.string(),
    })
  ),
});

export type Anomaly = z.infer<typeof AnomalySchema>;
export type InsertAnomaly = z.infer<typeof InsertAnomalySchema>;