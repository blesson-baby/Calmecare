import { useEffect, useState } from "react";
import API from "../api/axios";

function PatientList({ onSelectPatient, selectedPatient }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get("/patients/my");
        setPatients(res.data.data || []);
      } catch (err) {
        console.log(err);
        setError(err.response?.data?.message || "Failed to load patients");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  if (loading) return <div className="empty-state">Loading patients...</div>;
  if (error) return <div className="empty-state">{error}</div>;
  if (patients.length === 0) return <div className="empty-state">No patients assigned yet.</div>;

  return (
    <div className="panel card">
      <h3 className="panel-title">Assigned Patients</h3>
      <p className="panel-copy">Choose a patient to open a session and record observations.</p>

      <div className="stack">
        {patients.map((p) => (
          <div
            key={p._id}
            className={`patient-item ${selectedPatient?._id === p._id ? "active" : ""}`}
          >
            <button className="patient-button" onClick={() => onSelectPatient(p)}>
              <h4 className="item-title">{p.name}</h4>
              <p className="item-subtitle">{p.email || "Patient profile available"}</p>
            </button>

            {p.assignedClinicalPsychologist && (
              <p className="status-note">Transferred to clinical psychologist</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PatientList;
