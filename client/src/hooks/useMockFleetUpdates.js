import { useEffect, useState } from "react";

export default function useMockFleetUpdates(initialVehicles) {
  const [vehicles, setVehicles] = useState(initialVehicles);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      setVehicles((currentVehicles) => currentVehicles.map((vehicle) => {
        if (vehicle.status !== "Moving") return vehicle;
        const speedChange = Math.round((Math.random() - 0.5) * 6);
        return {
          ...vehicle,
          latitude: vehicle.latitude + (Math.random() - 0.5) * 0.00045,
          longitude: vehicle.longitude + (Math.random() - 0.5) * 0.00045,
          speed: Math.max(15, Math.min(60, vehicle.speed + speedChange)),
          tripProgress: Math.min(99, vehicle.tripProgress + 1),
          updatedAt: Date.now(),
          lastSync: "Just now",
        };
      }));
    }, 5000);

    return () => window.clearInterval(refreshTimer);
  }, []);

  return vehicles;
}
