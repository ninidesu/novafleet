export default function LoadingState({ title = "Loading", description = "Preparing the latest fleet view." }) {
  return (
    <div className="loading-state">
      <div className="loading-state-title">{title}</div>
      <div>{description}</div>
    </div>
  );
}
