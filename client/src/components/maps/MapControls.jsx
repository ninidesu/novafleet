export default function MapControls({ followVehicle, labelsVisible, routeVisibility, onFitAll, onCenterSelected, onToggleFollow, onToggleLabels, onToggleRoute }) {
  return (
    <div className="fleet-map-controls" aria-label="Map display controls">
      <button type="button" onClick={onFitAll}>Fit All</button>
      <button type="button" onClick={onCenterSelected}>Center Selected</button>
      <button type="button" className={followVehicle ? "active" : ""} onClick={onToggleFollow}>Follow</button>
      <button type="button" className={labelsVisible ? "active" : ""} onClick={onToggleLabels}>Labels</button>
      {Object.entries(routeVisibility).map(([route, visible]) => (
        <button type="button" className={visible ? "active" : ""} key={route} onClick={() => onToggleRoute(route)}>{route}</button>
      ))}
    </div>
  );
}
