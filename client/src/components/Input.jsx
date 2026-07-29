import { forwardRef } from "react";

const Input = forwardRef(function Input({ label, id, className = "", ...props }, ref) {
  return (
    <label className="input-wrap" htmlFor={id}>
      {label && <span className="input-label">{label}</span>}
      <input ref={ref} id={id} className={`input ${className}`.trim()} {...props} />
    </label>
  );
});

export default Input;