import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const healthcheck = asyncHandler(async (req, res) => {
  const dbState = mongoose.connection.readyState;

  // Map numeric states to readable values
  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbStatus = dbStatusMap[dbState] || "unknown";

  const isHealthy = dbState === 1;

  return res.status(isHealthy ? 200 : 503).json(
    new ApiResponse(
      isHealthy ? 200 : 503,
      {
        status: isHealthy ? "OK" : "FAIL",
        database: dbStatus,
        uptime: process.uptime(),
        timestamp: new Date(),
      },
      isHealthy ? "Server and DB are healthy" : "Database not connected"
    )
  );
});

export { healthcheck };
