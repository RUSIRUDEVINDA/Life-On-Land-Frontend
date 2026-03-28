import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import IncidentsPage from "./pages/dashboard/IncidentsPage";
import RiskMapPage from "./pages/dashboard/RiskMapPage";
import ReportIncidentPage from "./pages/dashboard/ReportIncidentPage";
import AnimalsPage from "./pages/animals/AnimalsPage";
import MovementsPage from "./pages/movements/MovementsPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="incidents/report" element={<ReportIncidentPage />} />
            <Route path="risk-map" element={<RiskMapPage />} />
            <Route path="animals" element={<AnimalsPage />} />
            <Route path="movements" element={<MovementsPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}


export default App;
