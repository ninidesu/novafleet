import Card from "../Card.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function RecentFleetEvents({ events }) {
  return (
    <Card title="Recent Map Events">
      <div className="fleet-event-list">
        {events.map((event) => (
          <div className="fleet-event-item" key={event.id}>
            <div><strong>{event.type}</strong><span>{event.vehicle}  {event.time}</span></div>
            <div><StatusBadge status={event.severity} /><StatusBadge status={event.status} /></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

