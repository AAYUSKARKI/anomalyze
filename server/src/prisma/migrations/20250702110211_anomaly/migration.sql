-- CreateTable
CREATE TABLE "anomalies" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "usage_kwh" DOUBLE PRECISION NOT NULL,
    "co2_tco2" DOUBLE PRECISION NOT NULL,
    "power_factor" DOUBLE PRECISION NOT NULL,
    "anomaly_label" TEXT NOT NULL,
    "fmea_diagnosis" TEXT NOT NULL,
    "alert_level" INTEGER NOT NULL,
    "file_id" TEXT NOT NULL,

    CONSTRAINT "anomalies_pkey" PRIMARY KEY ("id")
);
