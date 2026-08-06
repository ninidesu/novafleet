import { HttpError } from "../lib/httpError.js";

export function notFoundHandler(_req, res) {
  res.status(404).json({ message: "Endpoint not found.", code: "not_found" });
}

// Central error handler. Known HttpErrors map to their status; anything else is
// a 500. The original error is logged; the client sees a safe message + code.
export function errorHandler(error, _req, res, _next) {
  if (error instanceof HttpError) {
    if (error.status >= 500) console.error(error);
    return res.status(error.status).json({ message: error.message, code: error.code });
  }
  console.error(error);
  res.status(500).json({ message: "Unexpected server error.", code: "internal_error" });
}
