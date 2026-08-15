import {  Routes, Route } from "react-router-dom";
import Products from "./pages/Products/Products";
import Landing from "./pages/Landing/Landing";
import Auth from "./pages/Auth/Auth";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Profile from "./pages/Profile/Profile";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
function App() {
  return (
   <>
      <Routes>

  <Route path="/" element={<Landing />} />

  <Route path="/auth" element={<Auth />} />

  <Route
    path="/products"
    element={
      <ProtectedRoute>
        <Products />
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
   <Route
        path="/StudentDashboard"
        element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

</Routes>
      </>
   
  );
}

export default App;