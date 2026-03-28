import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import MapTrackingPage from "./pages/dashboard/MapTrackingPage";
import IncidentsPage from "./pages/dashboard/IncidentsPage";
import RiskMapPage from "./pages/dashboard/RiskMapPage";
import ReportIncidentPage from "./pages/dashboard/ReportIncidentPage";
import ProtectedAreasPage from "./pages/protected-areas/ProtectedAreasPage";
import ProtectedAreasMapPage from "./pages/protected-areas/ProtectedAreasMapPage";
import ProtectedAreasSectionPage from "./pages/protected-areas/ProtectedAreasSectionPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="maps" element={<MapTrackingPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="incidents/report" element={<ReportIncidentPage />} />
            <Route path="risk-map" element={<RiskMapPage />} />

            <Route path="protected-areas" element={<ProtectedAreasSectionPage />}>
              <Route index element={<Navigate to="map" replace />} />
              <Route path="map" element={<ProtectedAreasMapPage />} />
              <Route path="manage" element={<ProtectedAreasPage />} />
            </Route>
          </Route>

          <Route
            path="/protected-areas/*"
            element={<Navigate to="/dashboard/protected-areas" replace />}
          />
          <Route path="/map" element={<Navigate to="/dashboard/protected-areas/map" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
