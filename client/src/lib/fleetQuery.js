import { fleetDb } from "./supabase.js";
import { normalizeDatabaseError } from "./databaseError.js";

export async function listFleetRecords(table, { columns = "*", limit = 50, orderBy, ascending = false } = {}) {
  let query = fleetDb.from(table).select(columns);
  if (orderBy) query = query.order(orderBy, { ascending });
  const { data, error } = await query.limit(limit);
  if (error) throw normalizeDatabaseError(error, `fleet.${table} read`);
  return data ?? [];
}