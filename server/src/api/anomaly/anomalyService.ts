import { StatusCodes } from "http-status-codes";
import type { Anomaly, InsertAnomaly } from "./anomalyModel";
import { AnomalyRepository } from "@/api/anomaly/anomalyRepository";
import { ServiceResponse } from "@/common/utils/serviceResponse";
export class AnomalyService {
    private anomalyRepository: AnomalyRepository;

    constructor(repository: AnomalyRepository = new AnomalyRepository()) {
        this.anomalyRepository = repository;
    }

    async insert(data: InsertAnomaly['anomalies']): Promise<ServiceResponse<Anomaly[] | null>> {
        try {
            console.log("running")
            const anomalyCreated = await this.anomalyRepository.createAsync(data);
            return ServiceResponse.success<Anomaly[]>("Anomaly created", anomalyCreated, StatusCodes.CREATED);
        } catch (ex) {
            const errorMessage = `Error creating Anomaly: ${(ex as Error).message}`;
            return ServiceResponse.failure("An error occurred while creating Anomaly.", null, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async findAll(): Promise<ServiceResponse<Anomaly[] | null>> {
        try {
            const anomalyCreated = await this.anomalyRepository.getAsync();
            return ServiceResponse.success<Anomaly[]>("Anomaly created", anomalyCreated, StatusCodes.CREATED);
        } catch (ex) {
            const errorMessage = `Error creating Anomaly: ${(ex as Error).message}`;
            return ServiceResponse.failure("An error occurred while creating Anomaly.", null, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}

export const anomalyService = new AnomalyService();