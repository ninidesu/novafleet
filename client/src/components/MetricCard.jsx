import Card from "./Card.jsx";

export default function MetricCard({ label, value, meta }) {
  return (
    <Card className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {meta && <div className="metric-meta">{meta}</div>}
    </Card>
  );
}
