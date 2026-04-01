import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import DashboardLayout from './components/dashboard/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';

// Admin pages
import DashboardPage from './pages/dashboard/DashboardPage';
import IncidentsPage from './pages/dashboard/IncidentsPage';
import RiskMapPage from './pages/dashboard/RiskMapPage';
import MapTrackingPage from './pages/dashboard/MapTrackingPage';
import UsersPage from './pages/dashboard/UsersPage';
import AnimalsPage from './pages/animals/AnimalsPage';
import AlertsPage from './pages/alerts/AlertsPage';
import ProtectedAreasSectionPage from './pages/protected-areas/ProtectedAreasSectionPage';
import CreatePatrolPage from './pages/patrols/CreatePatrolPage';
import PatrolDetailsPage from './pages/patrols/PatrolDetailsPage';

// Ranger pages
import RangerDashboardPage from './pages/dashboard/RangerDashboardPage';
import RangerMyIncidentsPage from './pages/dashboard/RangerMyIncidentsPage';

// Shared pages
import ReportIncidentPage from './pages/dashboard/ReportIncidentPage';
import MovementsPage from './pages/movements/MovementsPage';
import PatrolsPage from './pages/patrols/PatrolsPage';
import ProfilePage from './pages/dashboard/ProfilePage';

import { getUserRole, getDefaultDashboardPathByRole } from './utils/auth';

function App() {
    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route
                    path="/"
                    element={<Navigate to={getDefaultDashboardPathByRole(getUserRole())} replace />}
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* All dashboard routes require authentication */}
                <Route path="/dashboard" element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                        {/* Index: redirect to the correct role dashboard */}
                        <Route
                            index
                            element={
                                <Navigate
                                    to={getDefaultDashboardPathByRole(getUserRole())}
                                    replace
                                />
                            }
                        />

                        {/* ── Admin-only routes ── */}
                        <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                            <Route path="admin" element={<DashboardPage />} />
                            <Route path="incidents" element={<IncidentsPage />} />
                            <Route path="risk-map" element={<RiskMapPage />} />
                            <Route path="map-tracking" element={<MapTrackingPage />} />
                            <Route path="animals" element={<AnimalsPage />} />
                            <Route path="users" element={<UsersPage />} />
                            <Route path="alerts" element={<AlertsPage />} />
                            <Route path="protected-areas" element={<ProtectedAreasSectionPage />} />
                            <Route path="patrols/create" element={<CreatePatrolPage />} />
                        </Route>

                        {/* ── Ranger-only routes ── */}
                        <Route element={<RoleRoute allowedRoles={['RANGER']} />}>
                            <Route path="ranger" element={<RangerDashboardPage />} />
                            <Route path="ranger-risk-map" element={<RiskMapPage rangerView />} />
                            <Route path="my-incidents" element={<RangerMyIncidentsPage />} />
                        </Route>

                        {/* ── Shared routes (Admin + Ranger) ── */}
                        <Route
                            element={<RoleRoute allowedRoles={['ADMIN', 'RANGER']} />}
                        >
                            <Route path="incidents/report" element={<ReportIncidentPage />} />
                            <Route path="movements" element={<MovementsPage />} />
                            <Route path="patrols" element={<PatrolsPage />} />
                            <Route path="patrols/:id" element={<PatrolDetailsPage />} />
                            <Route path="profile" element={<ProfilePage />} />
                        </Route>

                        {/* Catch-all inside dashboard → role home */}
                        <Route
                            path="*"
                            element={
                                <Navigate
                                    to={getDefaultDashboardPathByRole(getUserRole())}
                                    replace
                                />
                            }
                        />
                    </Route>
                </Route>

                {/* Global catch-all */}
                <Route
                    path="*"
                    element={<Navigate to={getDefaultDashboardPathByRole(getUserRole())} replace />}
                />
            </Routes>
        </Router>
    );
}

export default App;
