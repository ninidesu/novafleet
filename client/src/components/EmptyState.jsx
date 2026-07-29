export default function EmptyState({ title = "No records found", description = "Try adjusting your search or filters." }) {
  return (
    <div className="empty-state">
      <div className="empty-state-title">{title}</div>
      <div>{description}</div>
    </div>
  );
}
