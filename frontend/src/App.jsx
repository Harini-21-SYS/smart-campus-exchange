import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing/Landing";
import Auth from "./pages/Auth/Auth";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Profile from "./pages/Profile/Profile";
import StudentDashboard from "./pages/student/StudentDashboard";

function App() {
  return (
    <Routes>

      <Route path="/" element={<Landing />} />

      <Route path="/auth" element={<Auth />} />

      <Route
        path="/StudentDashboard"
        element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;