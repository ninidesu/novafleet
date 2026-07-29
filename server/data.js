// In-memory seed data for NovaFleet.
// Non-ASCII glyphs are written as \u escapes so the source stays pure ASCII.

const PESO = "₱"; // peso sign
const MDASH = "—"; // em dash

export const employees = [
  { id: "EMP-1042", name: "Maria Santos", department: "Human Resources", role: "HR Business Partner", status: "Active", hireDate: "Mar 14, 2021", email: "maria.santos@novafleet.local", phone: "+63 917 402 1188", dob: "Feb 9, 1990", address: "Quezon City, NCR", manager: "Rosa Villanueva", employmentType: "Full-time" },
  { id: "EMP-1058", name: "James Cruz", department: "Finance", role: "Senior Accountant", status: "Active", hireDate: "Jul 1, 2020", email: "james.cruz@novafleet.local", phone: "+63 918 220 4471", dob: "Nov 2, 1988", address: "Makati City, NCR", manager: "Elena Ferrer", employmentType: "Full-time" },
  { id: "EMP-1071", name: "Angela Reyes", department: "Client Services", role: "Loan Officer", status: "Active", hireDate: "Jan 10, 2022", email: "angela.reyes@novafleet.local", phone: "+63 906 331 9902", dob: "May 21, 1994", address: "Cebu City, Cebu", manager: "Rosa Villanueva", employmentType: "Full-time" },
  { id: "EMP-1033", name: "Daniel Tan", department: "IT", role: "Systems Administrator", status: "Active", hireDate: "Nov 20, 2019", email: "daniel.tan@novafleet.local", phone: "+63 915 774 0092", dob: "Aug 30, 1986", address: "Pasig City, NCR", manager: "Elena Ferrer", employmentType: "Full-time" },
  { id: "EMP-1104", name: "Sofia Delacruz", department: "Human Resources", role: "Recruitment Specialist", status: "On Leave", hireDate: "May 2, 2023", email: "sofia.delacruz@novafleet.local", phone: "+63 927 118 4420", dob: "Jan 15, 1997", address: "Davao City, Davao", manager: "Maria Santos", employmentType: "Full-time" },
  { id: "EMP-1089", name: "Miguel Ortiz", department: "Fleet & Transportation", role: "Dispatch Coordinator", status: "Active", hireDate: "Sep 15, 2021", email: "miguel.ortiz@novafleet.local", phone: "+63 933 552 6613", dob: "Jun 4, 1992", address: "Iloilo City, Iloilo", manager: "Rosa Villanueva", employmentType: "Full-time" },
  { id: "EMP-1015", name: "Patricia Lim", department: "Facilities", role: "Facilities Manager", status: "Active", hireDate: "Feb 28, 2018", email: "patricia.lim@novafleet.local", phone: "+63 908 991 2270", dob: "Oct 12, 1983", address: "Baguio City, Benguet", manager: "Elena Ferrer", employmentType: "Full-time" },
  { id: "EMP-1067", name: "Carlos Bautista", department: "Supply Chain", role: "Procurement Officer", status: "Inactive", hireDate: "Dec 5, 2020", email: "carlos.bautista@novafleet.local", phone: "+63 919 004 5581", dob: "Mar 27, 1991", address: "Cagayan de Oro, Misamis Oriental", manager: "Maria Santos", employmentType: "Contractual" },
];

export const modules = [
  { key: "dashboard", mono: "OV", label: "Overview" },
  { key: "hrm", mono: "HR", label: "Human Resources", hasChildren: true, children: [
    { key: "hrm-list", label: "Employee Records" },
    { key: "hrm-form", label: "New Hire Onboarding" },
  ] },
  { key: "finance", mono: "FM", label: "Financial Management" },
  { key: "supply", mono: "SC", label: "Supply Chain & Inventory" },
  { key: "fleet", mono: "FT", label: "Fleet & Transportation" },
  { key: "facilities", mono: "FA", label: "Facilities & Admin" },
  { key: "client", mono: "CS", label: "Client Services" },
  { key: "oversight", mono: "IO", label: "Institutional Oversight" },
];

export const departments = ["Human Resources", "Finance", "Client Services", "Fleet & Transportation", "Supply Chain", "Facilities", "IT"];
export const employmentTypes = ["Full-time", "Part-time", "Contractual", "Probationary"];

export const kpiTargets = { loans: 1284, clients: 3920, branches: 42, collection: 96 };

export const kpiCards = [
  { label: "Active Loans", key: "loans", format: "number", delta: "+4.2%", positive: true },
  { label: "Active Clients", key: "clients", format: "number", delta: "+2.8%", positive: true },
  { label: "Branches", key: "branches", format: "plain", delta: "+1", positive: true },
  { label: "Collection Rate", key: "collection", format: "percent", delta: "-0.4%", positive: false },
];

export const chartData = [
  { label: "Jan", pct: 55 }, { label: "Feb", pct: 68 }, { label: "Mar", pct: 72 },
  { label: "Apr", pct: 64 }, { label: "May", pct: 80 }, { label: "Jun", pct: 92 },
];

export const branchData = [
  { name: "Manila Central", pct: 88 }, { name: "Cebu North", pct: 74 }, { name: "Davao South", pct: 66 },
  { name: "Iloilo", pct: 59 }, { name: "Baguio", pct: 45 },
];

export const activityData = [
  { text: `New loan disbursed to Rosario Cooperative ${MDASH} ${PESO}120,000`, time: "12 min ago" },
  { text: "Sofia Delacruz submitted leave request", time: "48 min ago" },
  { text: "Collection target reached for Cebu North branch", time: "2 hr ago" },
  { text: "New client registered via mobile self-service portal", time: "3 hr ago" },
  { text: "Monthly financial report generated", time: "5 hr ago" },
];

export const onboardingTasks = [
  { label: "Employment contract signed", done: true },
  { label: "Government IDs & benefits enrollment", done: true },
  { label: "Workstation & system access provisioned", done: true },
  { label: "Orientation & compliance training", done: false },
];
