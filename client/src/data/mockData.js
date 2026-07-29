// Temporary mock records for frontend development. Replace these with backend API responses when NovaFleet services are available.
export const vehicles = [
  { id: "veh-001", plateNumber: "NVF-2148", model: "Toyota Hilux 2.4G", assignedDriver: "Mara Santos", currentStatus: "Active", gpsStatus: "Online", riskLevel: "Low", location: "Cebu North Branch" },
  { id: "veh-002", plateNumber: "NVF-3921", model: "Mitsubishi Strada", assignedDriver: "Joel Lim", currentStatus: "Active", gpsStatus: "Online", riskLevel: "Medium", location: "Mandaue Route 4" },
  { id: "veh-003", plateNumber: "NVF-5087", model: "Isuzu Traviz", assignedDriver: "Paolo Reyes", currentStatus: "In Service", gpsStatus: "No GPS", riskLevel: "High", location: "Talisay Service Yard" },
  { id: "veh-004", plateNumber: "NVF-7760", model: "Toyota Avanza", assignedDriver: "Lina Ortega", currentStatus: "Active", gpsStatus: "Online", riskLevel: "Low", location: "Lapu-Lapu Field Office" },
  { id: "veh-005", plateNumber: "NVF-8904", model: "Suzuki Carry", assignedDriver: "Ramon Dizon", currentStatus: "Inactive", gpsStatus: "Offline", riskLevel: "Medium", location: "Depot 2" },
];

export const drivers = [
  { id: "drv-001", name: "Mara Santos", licenseNumber: "N05-41-876542", assignedVehicle: "NVF-2148", activeTrip: "TRP-1048", riskScore: 18, status: "Active" },
  { id: "drv-002", name: "Joel Lim", licenseNumber: "N07-19-558214", assignedVehicle: "NVF-3921", activeTrip: "TRP-1051", riskScore: 46, status: "Active" },
  { id: "drv-003", name: "Paolo Reyes", licenseNumber: "N02-77-129845", assignedVehicle: "NVF-5087", activeTrip: "None", riskScore: 72, status: "In Service" },
  { id: "drv-004", name: "Lina Ortega", licenseNumber: "N09-03-665190", assignedVehicle: "NVF-7760", activeTrip: "TRP-1053", riskScore: 21, status: "Active" },
  { id: "drv-005", name: "Ramon Dizon", licenseNumber: "N11-22-019344", assignedVehicle: "NVF-8904", activeTrip: "None", riskScore: 54, status: "Inactive" },
];

export const trips = [
  { id: "TRP-1048", vehicle: "NVF-2148", driver: "Mara Santos", origin: "Cebu North", destination: "Danao Field Center", departureTime: "08:15 AM", tripStatus: "Active" },
  { id: "TRP-1051", vehicle: "NVF-3921", driver: "Joel Lim", origin: "Mandaue", destination: "Consolacion Route", departureTime: "09:05 AM", tripStatus: "Active" },
  { id: "TRP-1053", vehicle: "NVF-7760", driver: "Lina Ortega", origin: "Lapu-Lapu", destination: "Cordova Collections", departureTime: "10:20 AM", tripStatus: "Pending" },
  { id: "TRP-1039", vehicle: "NVF-8904", driver: "Ramon Dizon", origin: "Depot 2", destination: "Carcar Branch", departureTime: "Yesterday", tripStatus: "Complete" },
];

export const alerts = [
  { id: "alt-001", type: "Route deviation", vehicle: "NVF-3921", severity: "High", message: "Vehicle is 2.6 km outside planned route", time: "8 min ago" },
  { id: "alt-002", type: "No GPS signal", vehicle: "NVF-5087", severity: "Critical", message: "GPS signal missing during service transfer", time: "22 min ago" },
  { id: "alt-003", type: "Device sync pending", vehicle: "NVF-8904", severity: "Medium", message: "41 offline records waiting for synchronization", time: "1 hr ago" },
];

export const routeDeviations = [
  { id: "dev-001", vehicle: "NVF-3921", driver: "Joel Lim", detectedTime: "Today, 10:42 AM", deviationDistance: "2.6 km", severity: "High", reviewStatus: "Under Review" },
  { id: "dev-002", vehicle: "NVF-7760", driver: "Lina Ortega", detectedTime: "Today, 9:18 AM", deviationDistance: "0.8 km", severity: "Medium", reviewStatus: "Pending" },
  { id: "dev-003", vehicle: "NVF-2148", driver: "Mara Santos", detectedTime: "Yesterday, 4:02 PM", deviationDistance: "0.3 km", severity: "Low", reviewStatus: "Complete" },
];

export const riskScores = [
  { id: "risk-001", driver: "Mara Santos", score: 18, riskLevel: "Low", harshBrakingCount: 1, speedingCount: 0, routeDeviations: 1, lastCalculated: "Today, 10:00 AM" },
  { id: "risk-002", driver: "Joel Lim", score: 46, riskLevel: "Medium", harshBrakingCount: 4, speedingCount: 2, routeDeviations: 3, lastCalculated: "Today, 10:00 AM" },
  { id: "risk-003", driver: "Paolo Reyes", score: 72, riskLevel: "High", harshBrakingCount: 5, speedingCount: 4, routeDeviations: 2, lastCalculated: "Today, 10:00 AM" },
  { id: "risk-004", driver: "Lina Ortega", score: 21, riskLevel: "Low", harshBrakingCount: 0, speedingCount: 1, routeDeviations: 1, lastCalculated: "Today, 10:00 AM" },
];

export const devices = [
  { id: "IOT-8401", assignedVehicle: "NVF-2148", connectionStatus: "Online", gpsStatus: "Online", lastSynchronization: "2 min ago", pendingRecords: 0 },
  { id: "IOT-8402", assignedVehicle: "NVF-3921", connectionStatus: "Online", gpsStatus: "Online", lastSynchronization: "5 min ago", pendingRecords: 3 },
  { id: "IOT-8403", assignedVehicle: "NVF-5087", connectionStatus: "Offline", gpsStatus: "No GPS", lastSynchronization: "2 hr ago", pendingRecords: 18 },
  { id: "IOT-8404", assignedVehicle: "NVF-7760", connectionStatus: "Online", gpsStatus: "Online", lastSynchronization: "1 min ago", pendingRecords: 0 },
  { id: "IOT-8405", assignedVehicle: "NVF-8904", connectionStatus: "Offline", gpsStatus: "Offline", lastSynchronization: "Yesterday", pendingRecords: 41 },
];

export const maintenance = [
  { id: "mnt-001", vehicle: "NVF-5087", maintenanceType: "GPS module inspection", dueDate: "Today", status: "Overdue" },
  { id: "mnt-002", vehicle: "NVF-2148", maintenanceType: "Oil change", dueDate: "July 20, 2026", status: "Scheduled" },
  { id: "mnt-003", vehicle: "NVF-3921", maintenanceType: "Brake inspection", dueDate: "July 24, 2026", status: "Pending" },
  { id: "mnt-004", vehicle: "NVF-7760", maintenanceType: "Tire rotation", dueDate: "August 2, 2026", status: "Scheduled" },
];

export const dashboardMetrics = [
  { label: "Registered Vehicles", value: "18", meta: "5 currently assigned to high-priority routes" },
  { label: "Vehicles Online", value: "15", meta: "83% reporting within the last 10 minutes" },
  { label: "Active Trips", value: "12", meta: "3 routes have pending synchronization" },
  { label: "High-Risk Alerts", value: "4", meta: "2 require review before end of day" },
  { label: "Devices Offline", value: "3", meta: "Includes 1 vehicle with no GPS signal" },
  { label: "Pending Maintenance", value: "6", meta: "1 overdue inspection" },
];

export const reports = [
  { id: "report-001", title: "Fleet Summary", description: "Vehicle utilization, online status, and branch coverage." },
  { id: "report-002", title: "Driver Performance", description: "Risk trends, safety events, and assignment history." },
  { id: "report-003", title: "Trip History", description: "Completed routes, field visits, and timing exceptions." },
  { id: "report-004", title: "Route Deviations", description: "Deviation frequency, severity, and review resolution." },
  { id: "report-005", title: "Device Connectivity", description: "IoT uptime, GPS signal health, and sync backlog." },
  { id: "report-006", title: "Maintenance", description: "Upcoming service, overdue items, and vehicle downtime." },
];
