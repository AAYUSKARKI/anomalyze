import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { anomalyController } from "./anomalyController";
import { AnomalySchema, InsertAnomalySchema } from "./anomalyModel";

export const anomalyRegistry = new OpenAPIRegistry();
export const anomalyRouter: Router = express.Router();

anomalyRegistry.register("Anomaly", AnomalySchema);

anomalyRegistry.registerPath({
    method: "post",
    path: "/anomaly/insert",
    tags: ["Anomaly"],
    request: { 
        body:{
            content:{
                "application/json":{schema:InsertAnomalySchema}
            }
        }
     },
    responses: createApiResponse(AnomalySchema, "Success"),
});

anomalyRouter.post("/insert", anomalyController.insert);

anomalyRegistry.registerPath({
    method: "get",
    path: "/anomaly/fetch",
    tags: ["Anomaly"],
    responses: createApiResponse(AnomalySchema, "Success"),
});

anomalyRouter.get("/fetch", anomalyController.fetch);
