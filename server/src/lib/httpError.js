export class HttpError extends Error {
  constructor(status, message, code = null) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message, code) => new HttpError(400, message, code);
export const unauthorized = (message = "Authentication required.", code) => new HttpError(401, message, code);
export const forbidden = (message = "You do not have access to this resource.", code) => new HttpError(403, message, code);
export const notFound = (message = "Resource not found.", code) => new HttpError(404, message, code);
export const conflict = (message, code) => new HttpError(409, message, code);

// Translate a Supabase/Postgres error into a friendly HttpError. Falls back to
// a generic 500 with the original message preserved for logs.
export function fromDbError(error, context = "database request") {
  if (!error) return null;
  const messages = {
    "23505": conflict("A record with those unique details already exists.", "unique_violation"),
    "23503": conflict("This record is referenced by other data and cannot be changed.", "foreign_key_violation"),
    "42P01": new HttpError(500, "A required table is missing. Run the Supabase migrations.", "undefined_table"),
  };
  if (error.code && messages[error.code]) return messages[error.code];
  return new HttpError(500, error.message || `Unable to complete ${context}.`, error.code || "db_error");
}
