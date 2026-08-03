import { listFleetRecords } from "../lib/fleetQuery.js";
export function listRiskScores(limit = 50) { return listFleetRecords("risk_scores", { limit, orderBy: "created_at" }); }