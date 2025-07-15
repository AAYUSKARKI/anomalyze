import type { Request, RequestHandler, Response } from "express";
import { InsertAnomalySchema } from "./anomalyModel";
import { anomalyService } from "@/api/anomaly/anomalyService";
import { logger } from "@/server";

class AnomalyController {
    public insert: RequestHandler = async (req: Request, res: Response) => {
        logger.info("request body",req.body)
        const data = InsertAnomalySchema.parse(req.body);
        const serviceResponse = await anomalyService.insert(data.anomalies);
        res.status(serviceResponse.statusCode).send(serviceResponse);
    }

    public fetch: RequestHandler = async (req: Request, res: Response) => {
        const serviceResponse = await anomalyService.findAll();
        res.status(serviceResponse.statusCode).send(serviceResponse);
    }
}

export const anomalyController = new AnomalyController();