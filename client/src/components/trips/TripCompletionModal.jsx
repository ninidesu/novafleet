import { useEffect, useRef, useState } from "react";
export default function TripCompletionModal({trip,onClose,onConfirm}) {
  const ref=useRef(); const [saving,setSaving]=useState(false); const [error,setError]=useState("");
  useEffect(()=>ref.current?.focus(),[trip]); if(!trip)return null;
  const confirm=async()=>{setSaving(true);setError("");try{await onConfirm();}catch(confirmError){setError(confirmError.message||"Unable to complete trip.");}finally{setSaving(false);}};
  return <div className="modal-backdrop"><div className="trip-modal" role="dialog" aria-modal="true" aria-labelledby="completion-title"><h2 id="completion-title">Complete {trip.tripCode}</h2><p className="page-description">This will set the trip status to completed and record the current time as its end time.</p>{error&&<div className="trip-form-alert" role="alert">{error}</div>}<div className="trip-form-actions"><button ref={ref} className="button secondary" onClick={onClose} disabled={saving}>Cancel</button><button className="button primary" onClick={confirm} disabled={saving}>{saving?"Completing...":"Confirm Completion"}</button></div></div></div>;
}