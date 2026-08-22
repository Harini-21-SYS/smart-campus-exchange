import EmptyState from "../components/EmptyState";

function ComplaintsSection() {
  return (
    <div className="dash-section">
      <div className="section-header">
        <h1>Raise Complaint</h1>
      </div>
      <EmptyState subtitle="You haven't raised any complaints." />
    </div>
  );
}

export default ComplaintsSection;