import { publicSchema, supabase } from "./supabase.js";
import { getCurrentProfile } from "./fleetResourceService.js";

function titleCase(value, fallback = "Unknown") { return value ? String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : fallback; }
function formatDate(value) { return value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" }) : "Not recorded"; }
function requireData(result, label) { if (result.error) throw new Error(`${label}: ${result.error.message}`); return result.data || []; }

function describeAuditChange(row) {
  const table = titleCase(row.table_name, "Record");
  if (row.action === "INSERT") return `Created ${table}`;
  if (row.action === "DELETE") return `Deleted ${table}`;
  return `Updated ${table}`;
}

export async function getSettingsWorkspace({ includeUsers = true, includeAudit = true } = {}) {
  const [profile, usersResult, auditResult] = await Promise.all([
    getCurrentProfile(),
    includeUsers ? publicSchema.from("profiles").select("id, full_name, role, module, created_at").order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    includeAudit ? supabase.from("audit_logs").select("id, occurred_at, actor_id, action, schema_name, table_name, record_id, old_data, new_data").order("occurred_at", { ascending: false }).limit(250) : Promise.resolve({ data: [], error: null }),
  ]);

  const rawUsers = includeUsers ? requireData(usersResult, "Users") : [];
  const userById = new Map(rawUsers.map((row) => [row.id, row]));
  const users = rawUsers.map((row) => ({
    id: row.id,
    name: row.full_name || "Unnamed user",
    role: titleCase(row.role),
    module: titleCase(row.module),
    createdAt: formatDate(row.created_at),
  }));

  const activities = (includeAudit ? requireData(auditResult, "Audit logs") : []).map((row) => ({
    id: row.id,
    timestamp: formatDate(row.occurred_at),
    actor: row.actor_id ? (userById.get(row.actor_id)?.full_name || `User ${row.actor_id.slice(0, 8)}`) : "System",
    action: describeAuditChange(row),
    resource: row.record_id ? `${row.table_name} · ${row.record_id.slice(0, 8)}` : row.table_name,
    status: "Recorded",
  }));

  return { profile, users, activities };
}
