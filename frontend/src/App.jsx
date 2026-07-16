import {  Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing/Landing";
import Auth from "./pages/Auth/Auth";

function App() {
  return (
   <>
      <Routes>

        {/* Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Login / Register */}
        <Route path="/auth" element={<Auth />} />

      </Routes>
      </>
   
  );
}

export default App;