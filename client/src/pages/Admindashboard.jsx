import { useEffect, useEffectEvent, useState } from "react";
import API from "../api/axios";
import DashboardShell from "../components/DashboardShell";
import consultationImage from "../assets/admin-consultation.jpg";
import telehealthImage from "../assets/admin-telehealth.jpg";
import therapyImage from "../assets/admin-therapy.jpg";

function AdminDashboard() {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [psychologists, setPsychologists] = useState([]);
  const [clinicalPsychologists, setClinicalPsychologists] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState({
    patientId: "",
    psychologistId: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function fetchAdminData() {
    try {
      setError("");
      const [pendingRes, assignmentRes] = await Promise.all([
        API.get("/admin/pending-doctors"),
        API.get("/admin/assignment-data")
      ]);

      setPendingDoctors(pendingRes.data.data || []);
      setPatients(assignmentRes.data.data.patients || []);
      setPsychologists(assignmentRes.data.data.psychologists || []);
      setClinicalPsychologists(assignmentRes.data.data.clinicalPsychologists || []);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Failed to load admin data.");
    }
  }

  const initializeDashboard = useEffectEvent(() => {
    fetchAdminData();
  });

  useEffect(() => {
    initializeDashboard();
  }, []);

  const handleDoctorStatus = async (doctorId, status) => {
    try {
      setMessage("");
      setError("");
      await API.put(`/admin/doctor-status/${doctorId}`, { status });
      setPendingDoctors((current) => current.filter((doctor) => doctor._id !== doctorId));
      setMessage(`Doctor ${status} successfully.`);
      fetchAdminData();
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Unable to update doctor status.");
    }
  };

  const handleAssignmentChange = (e) => {
    setAssignmentForm((current) => ({
      ...current,
      [e.target.name]: e.target.value
    }));
  };

  const handleAssignPsychologist = async () => {
    try {
      setMessage("");
      setError("");
      await API.post("/admin/assign-psychologist", {
        patientId: assignmentForm.patientId,
        psychologistId: assignmentForm.psychologistId
      });
      setMessage("Psychologist assigned successfully.");
      fetchAdminData();
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Unable to assign psychologist.");
    }
  };

  return (
    <DashboardShell
      title="Admin Control Center"
      description="Review doctor registrations, approve specialist accounts, and assign each patient to the right psychologist before any later referral."
      tag="Administration"
    >
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Pending doctors</span>
          <p className="stat-value">{pendingDoctors.length}</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Approved psychologists</span>
          <p className="stat-value">{psychologists.length}</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Approved clinicals</span>
          <p className="stat-value">{clinicalPsychologists.length}</p>
        </div>
      </section>

      <section className="dashboard-spotlight admin-spotlight">
        <div className="dashboard-spotlight-copy">
          <span className="dashboard-tagline">Admin oversight</span>
          <h2 className="panel-title">Keep intake, approval, and assignment decisions coordinated.</h2>
          <p className="panel-copy">
            Review professional credentials quickly, maintain specialist availability, and guide
            each patient toward the right care path without losing operational clarity.
          </p>
        </div>

        <div className="dashboard-spotlight-metrics">
          <div className="mini-overview-card">
            <span className="stat-label">Total patients</span>
            <p className="stat-value">{patients.length}</p>
          </div>
          <div className="mini-overview-card">
            <span className="stat-label">Care teams ready</span>
            <p className="stat-value">{psychologists.length + clinicalPsychologists.length}</p>
          </div>
        </div>
      </section>

      <section className="overview-media-grid">
        <article className="media-card">
          <img
            className="media-card-image"
            src={consultationImage}
            alt="Healthcare professional reviewing a consultation with a patient"
          />
          <div className="media-card-body">
            <h3 className="panel-title">Approval Review</h3>
            <p className="panel-copy">
              Verify registration details and keep the intake process calm, clear, and safe.
            </p>
          </div>
        </article>

        <article className="media-card">
          <img
            className="media-card-image"
            src={telehealthImage}
            alt="Healthcare professional managing a telehealth consultation"
          />
          <div className="media-card-body">
            <h3 className="panel-title">Connected Care</h3>
            <p className="panel-copy">
              Support virtual care workflows across psychologists, specialists, and patients.
            </p>
          </div>
        </article>

        <article className="media-card">
          <img
            className="media-card-image"
            src={therapyImage}
            alt="Therapist supporting a patient during a counseling session"
          />
          <div className="media-card-body">
            <h3 className="panel-title">Patient Support</h3>
            <p className="panel-copy">
              Keep assignment decisions aligned with therapy needs and referral readiness.
            </p>
          </div>
        </article>
      </section>

      {error && <p className="status-note">{error}</p>}
      {message && <p className="session-banner">{message}</p>}

      <section className="dashboard-grid">
        <section className="panel card section-card">
          <h3 className="panel-title">Doctor Approvals</h3>
          <p className="panel-copy">
            Review registration details before allowing access to the platform.
          </p>

          {pendingDoctors.length === 0 ? (
            <div className="empty-state">No pending doctor registrations.</div>
          ) : (
            <div className="stack">
              {pendingDoctors.map((doctor) => (
                <article key={doctor._id} className="referral-card">
                  <div className="referral-top">
                    <h4 className="item-title">{doctor.name}</h4>
                    <span className="badge warning">{doctor.role}</span>
                  </div>
                  <p className="item-subtitle">{doctor.email}</p>
                  <p className="item-subtitle">License: {doctor.licenseNumber}</p>
                  <p className="item-subtitle">Qualification: {doctor.qualification}</p>
                  <p className="item-subtitle">Specialization: {doctor.specialization}</p>
                  <p className="item-subtitle">Experience: {doctor.experience} years</p>
                  <p className="item-subtitle">
                    Certification: {doctor.certificationName} ({doctor.certificationYear})
                  </p>
                  <p className="item-subtitle">
                    Issuer: {doctor.certificationIssuer}
                  </p>
                  {doctor.hospitalAffiliation && (
                    <p className="item-subtitle">
                      Affiliation: {doctor.hospitalAffiliation}
                    </p>
                  )}

                  <div className="button-row" style={{ marginTop: "16px" }}>
                    <button
                      className="button"
                      onClick={() => handleDoctorStatus(doctor._id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="danger-button"
                      onClick={() => handleDoctorStatus(doctor._id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel card section-card">
          <h3 className="panel-title">Patient Assignment</h3>
          <p className="panel-copy">
            Admins assign patients to psychologists. Clinical psychologists receive patients only after a psychologist referral is accepted.
          </p>

          <div className="field-group">
            <div className="field">
              <label htmlFor="patientId">Patient</label>
              <select
                id="patientId"
                name="patientId"
                className="input"
                value={assignmentForm.patientId}
                onChange={handleAssignmentChange}
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="psychologistId">Psychologist</label>
              <select
                id="psychologistId"
                name="psychologistId"
                className="input"
                value={assignmentForm.psychologistId}
                onChange={handleAssignmentChange}
              >
                <option value="">Select psychologist</option>
                {psychologists.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="button-row">
              <button className="button" onClick={handleAssignPsychologist}>
                Assign Psychologist
              </button>
            </div>
          </div>

          <div className="session-banner" style={{ marginTop: "18px" }}>
            Clinical assignment rule: a patient reaches a clinical psychologist only through a referral created by the assigned psychologist.
          </div>

          <div className="stack" style={{ marginTop: "18px" }}>
            {patients.map((patient) => (
              <div key={patient._id} className="patient-item">
                <h4 className="item-title">{patient.name}</h4>
                <p className="item-subtitle">
                  Psychologist: {patient.assignedPsychologist?.name || "Not assigned"}
                </p>
                <p className="item-subtitle">
                  Clinical: {patient.assignedClinicalPsychologist?.name || "Not assigned"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </DashboardShell>
  );
}

export default AdminDashboard;
