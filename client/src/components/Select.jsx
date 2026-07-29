export default function Select({ label, id, className = "", children, error, ...props }) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <label className="input-wrap" htmlFor={id}>
      {label && <span className="input-label">{label}</span>}
      <select
        id={id}
        className={`input select ${className}`.trim()}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={errorId}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span id={errorId} className="field-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
