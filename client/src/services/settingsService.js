import { api } from "./api.js";

// The API decides which admin-only sections to include based on the caller's
// role; the options are accepted for signature compatibility.
export function getSettingsWorkspace(_options = {}) {
  return api.get("/settings");
}
