import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import ProtectedRoute from "./components/ProtectedRoute";

// Dummy dashboards (we'll build later)
import PatientDashboard from "./pages/Patientdashboard";
import PsychologistDashboard from "./pages/Psychologistdashboard";
import ClinicalDashboard from "./pages/Clinicaldashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Patient */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute role="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        {/* Psychologist */}
        <Route
          path="/psychologist"
          element={
            <ProtectedRoute role="psychologist">
              <PsychologistDashboard />
            </ProtectedRoute>
          }
        />

        {/* Clinical Psychologist */}
        <Route
          path="/clinical"
          element={
            <ProtectedRoute role="clinicalpsychologist">
              <ClinicalDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;