import { FaInbox } from "react-icons/fa";

function EmptyState({ subtitle, action }) {
  return (
    <div className="dash-empty">
      <div className="dash-empty-icon">
        <FaInbox />
      </div>
      <h3>No data available</h3>
      <p>{subtitle}</p>
      {action}
    </div>
  );
}

export default EmptyState;