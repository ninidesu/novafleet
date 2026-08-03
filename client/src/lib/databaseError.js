export class DatabaseError extends Error {
  constructor(message, { code = null, details = null, hint = null, kind = "unknown", cause = null } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "DatabaseError";
    this.code = code;
    this.details = details;
    this.hint = hint;
    this.kind = kind;
  }
}

export class SupabaseConfigurationError extends DatabaseError {
  constructor(message) {
    super(message, { kind: "configuration" });
    this.name = "SupabaseConfigurationError";
  }
}

function getErrorKind(error) {
  if (error?.code === "42501") return "permission";
  if (error?.code === "3F000" || error?.code === "PGRST106") return "schema";
  if (error?.code === "42P01" || error?.code === "PGRST205") return "missing_resource";
  if (error instanceof TypeError || /network|fetch failed|failed to fetch/i.test(error?.message || "")) return "network";
  return "query";
}

export function normalizeDatabaseError(error, context = "database request") {
  if (error instanceof DatabaseError) return error;
  return new DatabaseError(error?.message || `Unable to complete ${context}.`, {
    code: error?.code ?? null, details: error?.details ?? null, hint: error?.hint ?? null,
    kind: getErrorKind(error), cause: error,
  });
}