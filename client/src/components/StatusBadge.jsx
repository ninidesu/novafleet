import { getStatusColor } from "../theme.js";

export default function StatusBadge({ status }) {
  const color = getStatusColor(status);
  return (
    <span className="status-badge" style={{ backgroundColor: color.bg, color: color.fg }}>
      {status}
    </span>
  );
}
