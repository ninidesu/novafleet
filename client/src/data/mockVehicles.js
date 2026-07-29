const now = Date.now();

// Temporary frontend records. Replace this prop source with API or Socket.IO data later.
export const mockVehicles = [
  { id: "VEH-001", plateNumber: "NVA-2148", driver: "Mara Santos", latitude: 14.5995, longitude: 120.9842, status: "Moving", speed: 42, heading: "Northeast  48", updatedAt: now, currentTrip: "TRP-1048", origin: "Manila Branch", destination: "Quezon City Field Center", tripProgress: 62, riskLevel: "Low", riskScore: 18, gpsStatus: "Online", networkStatus: "4G  Strong", battery: 91, lastSync: "Just now", pendingOfflineRecords: 0, plannedRoute: [[14.5995, 120.9842], [14.6091, 121.0223], [14.6337, 121.0434]], actualRoute: [[14.5995, 120.9842], [14.6072, 121.0148], [14.6213, 121.0352]], deviationRoute: [] },
  { id: "VEH-002", plateNumber: "NVA-3921", driver: "Joel Lim", latitude: 14.6507, longitude: 121.0494, status: "Idle", speed: 0, heading: "North  4", updatedAt: now - 35000, currentTrip: "TRP-1051", origin: "Quezon City Branch", destination: "Fairview Collection Area", tripProgress: 44, riskLevel: "Medium", riskScore: 46, gpsStatus: "Online", networkStatus: "4G  Good", battery: 76, lastSync: "35 sec ago", pendingOfflineRecords: 3, plannedRoute: [[14.6507, 121.0494], [14.6760, 121.0437], [14.7003, 121.0318]], actualRoute: [[14.6507, 121.0494], [14.6702, 121.0521]], deviationRoute: [] },
  { id: "VEH-003", plateNumber: "NVA-5087", driver: "Paolo Reyes", latitude: 14.5547, longitude: 121.0244, status: "Stopped", speed: 0, heading: "East  93", updatedAt: now - 185000, currentTrip: "TRP-1054", origin: "Makati Branch", destination: "Taguig Field Office", tripProgress: 31, riskLevel: "High", riskScore: 72, gpsStatus: "Online", networkStatus: "4G  Fair", battery: 58, lastSync: "3 min ago", pendingOfflineRecords: 18, plannedRoute: [[14.5547, 121.0244], [14.5706, 121.0327], [14.5832, 121.0515]], actualRoute: [[14.5547, 121.0244], [14.5681, 121.0250]], deviationRoute: [[14.5681, 121.0250], [14.5745, 121.0164]] },
  { id: "VEH-004", plateNumber: "NVA-7760", driver: "Lina Ortega", latitude: 14.5764, longitude: 121.0851, status: "Moving", speed: 34, heading: "West  271", updatedAt: now, currentTrip: "TRP-1053", origin: "Pasig Branch", destination: "Marikina Collection Area", tripProgress: 73, riskLevel: "Low", riskScore: 21, gpsStatus: "Online", networkStatus: "4G  Strong", battery: 84, lastSync: "Just now", pendingOfflineRecords: 0, plannedRoute: [[14.5764, 121.0851], [14.5862, 121.0695], [14.5998, 121.0612]], actualRoute: [[14.5764, 121.0851], [14.5844, 121.0732]], deviationRoute: [] },
  { id: "VEH-005", plateNumber: "NVA-8904", driver: "Ramon Dizon", latitude: 14.6760, longitude: 120.9794, status: "Offline", speed: 0, heading: "Unknown", updatedAt: now - 2880000, currentTrip: "No active trip", origin: "Caloocan Depot", destination: "", tripProgress: 0, riskLevel: "Medium", riskScore: 54, gpsStatus: "Offline", networkStatus: "No signal", battery: 24, lastSync: "48 min ago", pendingOfflineRecords: 41, plannedRoute: [], actualRoute: [], deviationRoute: [] },
];

export const recentFleetEvents = [
  { id: "event-001", type: "Route deviation detected", vehicle: "NVA-5087", time: "3 min ago", severity: "High", status: "Open" },
  { id: "event-002", type: "Harsh braking", vehicle: "NVA-3921", time: "12 min ago", severity: "Medium", status: "Acknowledged" },
  { id: "event-003", type: "GPS signal lost", vehicle: "NVA-8904", time: "48 min ago", severity: "Critical", status: "Open" },
  { id: "event-004", type: "Device reconnected", vehicle: "NVA-2148", time: "1 hr ago", severity: "Low", status: "Resolved" },
  { id: "event-005", type: "Offline records synchronized", vehicle: "NVA-7760", time: "2 hr ago", severity: "Low", status: "Resolved" },
];

