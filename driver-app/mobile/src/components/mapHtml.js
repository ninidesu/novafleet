// Shared Leaflet map HTML for the trip map. Rendered inside a WebView on native
// and an <iframe> on web. Uses CARTO's free basemaps (no API key) for a clean,
// Google-like look, with route casing and a pulsing vehicle marker.
export function buildMapHtml({ plannedRoute = [], path = [], position = null, dark = false }) {
  const data = JSON.stringify({ plannedRoute, path, position });
  const tiles = dark
    ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const bg = dark ? "#0b1220" : "#e8edf2";
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html,body,#map{height:100%;margin:0;background:${bg}}
  .veh{width:16px;height:16px;border-radius:50%;background:#16a34a;border:2px solid #fff;box-shadow:0 0 0 2px rgba(22,163,74,.35)}
  .veh::after{content:'';position:absolute;left:-6px;top:-6px;width:28px;height:28px;border-radius:50%;
    border:2px solid rgba(22,163,74,.6);animation:pulse 1.8s ease-out infinite}
  @keyframes pulse{0%{transform:scale(.5);opacity:.9}100%{transform:scale(1.6);opacity:0}}
  .pin{width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)}
  .leaflet-control-attribution{font-size:9px;opacity:.65}
</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var D = ${data};
  var center = D.position || (D.plannedRoute[0]) || [14.6, 121.03];
  var map = L.map('map', { zoomControl: false }).setView(center, 13);
  L.tileLayer('${tiles}', { maxZoom: 20, attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);

  function pin(latlng, color) {
    return L.marker(latlng, { icon: L.divIcon({ className: '', html: '<div class="pin" style="background:' + color + '"></div>', iconSize: [12,12], iconAnchor: [6,6] }) }).addTo(map);
  }

  // Planned route: dashed with a white halo (casing).
  if (D.plannedRoute.length) {
    L.polyline(D.plannedRoute, { color: '#ffffff', weight: 6, opacity: 0.7 }).addTo(map);
    L.polyline(D.plannedRoute, { color: '#3b82f6', weight: 3, opacity: 0.9, dashArray: '6 7' }).addTo(map);
  }
  // Actual trail: solid green with white casing (Google-directions style).
  if (D.path.length) {
    L.polyline(D.path, { color: '#ffffff', weight: 8, opacity: 0.9 }).addTo(map);
    L.polyline(D.path, { color: '#16a34a', weight: 5 }).addTo(map);
  }

  var origin = D.plannedRoute[0] || D.path[0];
  var dest = D.plannedRoute[D.plannedRoute.length - 1];
  if (origin) pin(origin, '#3b82f6');
  if (dest) pin(dest, '#ef4444');
  if (D.position) {
    L.marker(D.position, { icon: L.divIcon({ className: '', html: '<div class="veh"></div>', iconSize: [16,16], iconAnchor: [8,8] }) }).addTo(map);
  }

  var all = D.plannedRoute.concat(D.path); if (D.position) all.push(D.position);
  if (all.length > 1) { try { map.fitBounds(all, { padding: [26, 26] }); } catch (e) {} }
</script>
</body></html>`;
}
