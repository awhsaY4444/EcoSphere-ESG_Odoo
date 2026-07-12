import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Environmental from "./pages/Environmental";
import Social from "./pages/Social";
import Governance from "./pages/Governance";
import Gamification from "./pages/Gamification";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import EcoTwin from "./pages/EcoTwin";
import CarbonDNA from "./pages/CarbonDNA";
import EcoPilot from "./pages/EcoPilot";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="environmental" element={<Environmental />} />
          <Route path="ecotwin" element={<EcoTwin />} />
          <Route path="carbon-dna" element={<CarbonDNA />} />
          <Route path="ecopilot" element={<EcoPilot />} />
          <Route path="social" element={<Social />} />
          <Route path="governance" element={<Governance />} />
          <Route path="gamification" element={<Gamification />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
