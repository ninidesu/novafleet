import express from "express";
import cors from "cors";
import {
  employees,
  modules,
  departments,
  employmentTypes,
  kpiTargets,
  kpiCards,
  chartData,
  branchData,
  activityData,
  onboardingTasks,
} from "./data.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Mutable copy so new hires persist for the process lifetime.
const employeeStore = [...employees];

const STATUS_COLORS = {
  Active: { bg: "#DCFCE7", fg: "#15803D" },
  "On Leave": { bg: "#FEF3C7", fg: "#B45309" },
  Inactive: { bg: "#F1F5F9", fg: "#64748B" },
};

const initials = (name) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("");

const withDerived = (e) => ({
  ...e,
  initials: initials(e.name),
  badge: STATUS_COLORS[e.status] || STATUS_COLORS.Inactive,
});

// --- Auth (demo only) ---------------------------------------------------
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, message: "Email and password are required" });
  }
  // Demo: any non-empty credentials succeed.
  res.json({
    ok: true,
    token: "demo-token",
    user: { name: "Alex Rivera", role: "Operations Admin", initials: "AR" },
  });
});

// --- Navigation + reference data ----------------------------------------
app.get("/api/modules", (_req, res) => res.json(modules));

app.get("/api/reference", (_req, res) =>
  res.json({ departments, employmentTypes })
);

// --- Dashboard ----------------------------------------------------------
app.get("/api/dashboard", (_req, res) => {
  res.json({
    kpiTargets,
    kpiCards,
    chartData,
    branchData,
    activity: activityData,
  });
});

// --- Employees ----------------------------------------------------------
app.get("/api/employees", (_req, res) => {
  res.json(employeeStore.map(withDerived));
});

app.get("/api/employees/:id", (req, res) => {
  const emp = employeeStore.find((e) => e.id === req.params.id);
  if (!emp) return res.status(404).json({ message: "Employee not found" });
  res.json({ ...withDerived(emp), tasks: onboardingTasks });
});

app.post("/api/employees", (req, res) => {
  const b = req.body || {};
  if (!b.fullName || !b.email) {
    return res.status(400).json({ message: "Full name and email are required" });
  }
  const nextNum = 1105 + employeeStore.length;
  const emp = {
    id: `EMP-${nextNum}`,
    name: b.fullName,
    department: b.department || "Human Resources",
    role: b.position || "New Hire",
    status: "Active",
    hireDate: b.startDate || new Date().toISOString().slice(0, 10),
    email: b.email,
    phone: b.phone || "",
    dob: b.dob || "",
    address: b.address || "",
    manager: b.manager || "",
    employmentType: b.employmentType || "Full-time",
  };
  employeeStore.push(emp);
  res.status(201).json(withDerived(emp));
});

app.listen(PORT, () => {
  console.log(`NovaFleet API listening on http://localhost:${PORT}`);
});
