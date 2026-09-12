// ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toUpperCase();

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && role !== requiredRole.toUpperCase()) {
    // Logged in, but wrong role for this page — send them to
    // where they actually belong instead of showing an error here.
    return (
      <Navigate to={role === "ADMIN" ? "/AdminDashboard" : "/StudentDashboard"} replace />
    );
  }

  return children;
}

export default ProtectedRoute;