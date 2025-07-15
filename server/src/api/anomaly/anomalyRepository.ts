import { prisma } from "@/prisma/client";
import type{ Anomaly, InsertAnomaly } from "./anomalyModel";

export class AnomalyRepository {
    async createAsync(anomaly: InsertAnomaly['anomalies']): Promise<Anomaly[]> {
        return prisma.$transaction(
            anomaly.map((anomaly) => prisma.anomaly.create({ data: anomaly }))
        )
    }

    async getAsync(): Promise<Anomaly[]> {
        return prisma.anomaly.findMany();
    }
}
