import { useEffect, useState } from "react";
import Button from "./Button.jsx";

export default function SignOutConfirmation({ onCancel, onConfirm }) {
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    const handleKey = (event) => { if (event.key === "Escape" && !signingOut) onCancel(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel, signingOut]);
  const confirm = async () => { setSigningOut(true); try { await onConfirm(); } finally { setSigningOut(false); } };
  return <div className="modal-backdrop signout-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !signingOut) onCancel(); }}>
    <section className="signout-dialog" role="alertdialog" aria-modal="true" aria-labelledby="signout-title" aria-describedby="signout-description">
      <div className="signout-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></svg></div>
      <div><h2 id="signout-title">Sign out of NovaFleet?</h2><p id="signout-description">You will need to sign in again to access fleet operations and administrative records.</p></div>
      <div className="signout-actions"><Button autoFocus type="button" variant="secondary" onClick={onCancel} disabled={signingOut}>Cancel</Button><Button type="button" variant="danger" onClick={confirm} disabled={signingOut}>{signingOut ? "Signing out..." : "Sign out"}</Button></div>
    </section>
  </div>;
}
