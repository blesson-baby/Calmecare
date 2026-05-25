import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

import PatientDashboard from "./pages/Patientdashboard";
import PsychologistDashboard from "./pages/Psychologistdashboard";
import ClinicalDashboard from "./pages/Clinicaldashboard";
import AdminDashboard from "./pages/Admindashboard";
import VideoCall from "./pages/VideoCall";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient"
          element={
            <ProtectedRoute role="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/psychologist"
          element={
            <ProtectedRoute role="psychologist">
              <PsychologistDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clinical"
          element={
            <ProtectedRoute role="clinicalpsychologist">
              <ClinicalDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/session/:sessionId/call"
          element={
            <ProtectedRoute>
              <VideoCall />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
