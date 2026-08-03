import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function AccessDenied() {
  const { signOut } = useAuth();
  const location = useLocation();
  const requested = location.state?.from;
  return <div className="page-shell" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><Card style={{ maxWidth: 520 }}><PageHeader eyebrow="Access Denied" title="This workspace page is restricted" description={requested ? `Your assigned role cannot open ${requested}.` : "Your assigned role does not permit this action."} actions={<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link to="/dashboard"><Button>Go to dashboard</Button></Link><Button variant="secondary" onClick={signOut}>Sign out</Button></div>} /></Card></div>;
}