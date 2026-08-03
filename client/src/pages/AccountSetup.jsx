import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function AccountSetup() {
  const { profileState, signOut } = useAuth();
  const title = profileState === "error" ? "We could not verify your workspace access" : "Your NovaFleet account needs setup";
  const description = profileState === "error" ? "Your sign-in is valid, but NovaFleet could not retrieve the profile required for access. Please contact your administrator." : "Ask a NovaFleet administrator to create your fleet profile and assign an approved role.";
  return <div className="page-shell" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><Card style={{ maxWidth: 520 }}><PageHeader eyebrow="Account Access" title={title} description={description} actions={<Button variant="secondary" onClick={signOut}>Sign out</Button>} /></Card></div>;
}