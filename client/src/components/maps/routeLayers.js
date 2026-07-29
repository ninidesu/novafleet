export const routeLayerStyles = {
  planned: { color: "#64748B", weight: 4, dashArray: "8 8", opacity: 0.8 },
  actual: { color: "#2E6BE6", weight: 4, opacity: 0.9 },
  deviation: { color: "#B91C1C", weight: 5, opacity: 0.95 },
};

export function getVehicleRouteLayers(vehicle) {
  if (!vehicle) return [];
  return [
    { id: "planned", positions: vehicle.plannedRoute, style: routeLayerStyles.planned },
    { id: "actual", positions: vehicle.actualRoute, style: routeLayerStyles.actual },
    { id: "deviation", positions: vehicle.deviationRoute, style: routeLayerStyles.deviation },
  ].filter((layer) => layer.positions?.length > 1);
}

// Future route history, geofencing, trip playback, and deviation calculations can be added here.
