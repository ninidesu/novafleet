import { fleetDb, publicDb } from "../config/supabase.js";
import { fromDbError } from "../lib/httpError.js";
import { formatDateTimeDetailed, titleCase } from "../lib/format.js";
import { currentProfile } from "./profile.service.js";

function requireData(result, label) {
  if (result.error) throw fromDbError(result.error, label);
  return result.data || [];
}

function describeAuditChange(row) {
  const table = titleCase(row.table_name, "Record");
  if (row.action === "INSERT") return `Created ${table}`;
  if (row.action === "DELETE") return `Deleted ${table}`;
  return `Updated ${table}`;
}

// includeUsers/includeAudit are admin-only sections; the caller (route) gates
// them by role so a dispatcher only ever gets their own profile.
export async function getSettingsWorkspace(auth, { includeUsers = true, includeAudit = true } = {}) {
  const [usersResult, auditResult] = await Promise.all([
    includeUsers
      ? publicDb.from("profiles").select("id, full_name, role, module, created_at").order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    includeAudit
      ? fleetDb
          .from("audit_logs")
          .select("id, occurred_at, actor_id, action, schema_name, table_name, record_id, old_data, new_data")
          .order("occurred_at", { ascending: false })
          .limit(250)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const rawUsers = includeUsers ? requireData(usersResult, "Users") : [];
  const userById = new Map(rawUsers.map((row) => [row.id, row]));
  const users = rawUsers.map((row) => ({
    id: row.id,
    name: row.full_name || "Unnamed user",
    role: titleCase(row.role),
    module: titleCase(row.module),
    createdAt: formatDateTimeDetailed(row.created_at),
  }));

  const activities = (includeAudit ? requireData(auditResult, "Audit logs") : []).map((row) => ({
    id: row.id,
    timestamp: formatDateTimeDetailed(row.occurred_at),
    actor: row.actor_id ? userById.get(row.actor_id)?.full_name || `User ${row.actor_id.slice(0, 8)}` : "System",
    action: describeAuditChange(row),
    resource: row.record_id ? `${row.table_name} · ${row.record_id.slice(0, 8)}` : row.table_name,
    status: "Recorded",
  }));

  return { profile: currentProfile(auth), users, activities };
}
