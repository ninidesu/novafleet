import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function NotFound() {
  return (
    <div className="page-shell" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Card style={{ maxWidth: 460 }}>
        <PageHeader
          eyebrow="Not Found"
          title="Page not available"
          description="This page is unavailable. Return to the dashboard to continue."
          actions={<Link to="/dashboard"><Button>Go to dashboard</Button></Link>}
        />
      </Card>
    </div>
  );
}
