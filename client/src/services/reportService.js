import { api } from "./api.js";

export function getOperationalReports() {
  return api.get("/reports");
}
