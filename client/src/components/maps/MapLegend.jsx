import { fleetStatusConfig } from "../../config/fleetStatus.js";
import { routeLayerStyles } from "./routeLayers.js";

export default function MapLegend({ compact = false }) {
  return (
    <div className={`fleet-map-legend ${compact ? "compact" : ""}`} aria-label="Map legend">
      {Object.entries(fleetStatusConfig).map(([status, config]) => (
        <span key={status}><i className="legend-marker" style={{ backgroundColor: config.color }}>{config.symbol}</i>{status}</span>
      ))}
      <span><i className="legend-marker selected">?</i>Selected</span>
      {!compact && Object.entries(routeLayerStyles).map(([route, style]) => (
        <span key={route}><i className="legend-line" style={{ borderColor: style.color }} />{route === "deviation" ? "Deviation" : `${route[0].toUpperCase()}${route.slice(1)} Route`}</span>
      ))}
    </div>
  );
}
