import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PatientList from "../components/PatientList";
import CreateSession from "../components/CreateSession";
import AddProgress from "../components/AddProgress";
import DashboardShell from "../components/DashboardShell";
import API from "../api/axios";
import SessionSummaryList from "../components/SessionSummaryList";
import ProgressChart from "../components/ProgressChart";
import consultationImage from "../assets/admin-consultation.jpg";

function PsychologistDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
  const [message, setMessage] = useState("");
  const [startingCall, setStartingCall] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionNote, setSessionNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState("");
  const [severityWarning, setSeverityWarning] = useState(false);
  const [clinicalOptions, setClinicalOptions] = useState([]);
  const [referralForm, setReferralForm] = useState({
    clinicalPsychologist: "",
    reason: "High severity detected during session review"
  });
  const [creatingReferral, setCreatingReferral] = useState(false);
  const [referralFeedback, setReferralFeedback] = useState("");
  const [progressEntries, setProgressEntries] = useState([]);
  const selectedSession = useMemo(
    () => sessions.find((session) => session._id === sessionId) || null,
    [sessions, sessionId]
  );
  const canAddPostSessionDetails = selectedSession?.status === "completed";
  const initializeDashboard = useEffectEvent(() => {
    fetchSessions();
    fetchClinicalOptions();
  });
  const syncPatientContext = useEffectEvent((patientId, preferredSessionId) => {
    fetchSessions(patientId, preferredSessionId);
    fetchProgressEntries(patientId);
  });

  const fetchClinicalOptions = async () => {
    try {
      const res = await API.get("/referrals/clinical-options");
      setClinicalOptions(res.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchSessions = async (patientId, preferredSessionId) => {
    try {
      const suffix = patientId ? `?patientId=${patientId}` : "";
      const res = await API.get(`/sessions/mine${suffix}`);
      const nextSessions = res.data.data || [];
      setSessions(nextSessions);

      const matchedSession =
        nextSessions.find((session) => session._id === preferredSessionId) ||
        nextSessions.find((session) => session._id === sessionId) ||
        nextSessions[0] ||
        null;

      setSessionId(matchedSession?._id || null);
      setSessionNote(matchedSession?.notes || "");
      setShowProgress(false);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchProgressEntries = async (patientId) => {
    if (!patientId) {
      setProgressEntries([]);
      return;
    }

    try {
      const res = await API.get(`/session-progress/patient/${patientId}`);
      setProgressEntries([...(res.data.data || [])].reverse());
    } catch (error) {
      console.log(error);
    }
  };

  const handleSaveSessionNote = async () => {
    if (!sessionId) {
      return;
    }

    try {
      setSavingNote(true);
      setNoteFeedback("");
      await API.put(`/sessions/${sessionId}`, {
        notes: sessionNote
      });
      setNoteFeedback(
        sessionNote.trim()
          ? "Psychologist note pinned to the session summary."
          : "Psychologist note removed from the session summary."
      );
      fetchSessions(selectedPatient?._id, sessionId);
    } catch (error) {
      console.log(error);
      setNoteFeedback(error.response?.data?.message || "Unable to save the session note.");
    } finally {
      setSavingNote(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setShowProgress(false);
    setMessage("");
    setSessionNote("");
    setNoteFeedback("");
    setSeverityWarning(false);
    setReferralFeedback("");
    setReferralForm({
      clinicalPsychologist: "",
      reason: "High severity detected during session review"
    });
    fetchSessions(patient._id);
    fetchProgressEntries(patient._id);
  };

  const handleCreateReferral = async () => {
    if (!sessionId || !selectedPatient?._id) {
      return;
    }

    try {
      setCreatingReferral(true);
      setReferralFeedback("");
      const res = await API.post("/referrals", {
        patient: selectedPatient._id,
        session: sessionId,
        clinicalPsychologist: referralForm.clinicalPsychologist,
        reason: referralForm.reason
      });
      setReferralFeedback(res.data.message || "Referral created successfully.");
      setSeverityWarning(false);
    } catch (error) {
      console.log(error);
      setReferralFeedback(error.response?.data?.message || "Unable to create referral.");
    } finally {
      setCreatingReferral(false);
    }
  };

  const handleStartVideoCall = async () => {
    if (!sessionId) {
      return;
    }

    try {
      setStartingCall(true);
      setMessage("");
      await API.post(`/sessions/${sessionId}/start-call`);
      navigate(`/session/${sessionId}/call`);
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Unable to start the video consultation.");
    } finally {
      setStartingCall(false);
    }
  };

  useEffect(() => {
    initializeDashboard();
  }, []);

  useEffect(() => {
    const patientFromCall = location.state?.patient;
    const sessionFromCall = location.state?.sessionId;

    if (!patientFromCall?._id) {
      return;
    }

    setSelectedPatient(patientFromCall);
    setMessage("");
    setNoteFeedback("");
    setSeverityWarning(false);
    setReferralFeedback("");
    setReferralForm({
      clinicalPsychologist: "",
      reason: "High severity detected during session review"
    });
    syncPatientContext(patientFromCall._id, sessionFromCall);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  return (
    <DashboardShell
      title="Psychologist Workspace"
      description="Review assigned patients, open focused sessions, and document emotional progress with less friction."
      tag="Care Team"
    >
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Selected patient</span>
          <p className="stat-value">{selectedPatient?.name || "--"}</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Session status</span>
          <p className="stat-value">{selectedSession?.status || "Idle"}</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Post-session review</span>
          <p className="stat-value">{canAddPostSessionDetails ? "Ready" : "Locked"}</p>
        </div>
      </section>

      <section className="dashboard-spotlight clinician-spotlight">
        <div className="dashboard-spotlight-copy">
          <span className="dashboard-tagline">Psychologist workflow</span>
          <h2 className="panel-title">Guide each patient from session to structured follow-up.</h2>
          <p className="panel-copy">
            Open focused consultations, record progress carefully, and escalate to clinical review
            only when the warning indicators genuinely support it.
          </p>
        </div>

        <div className="dashboard-spotlight-media">
          <img src={consultationImage} alt="Psychologist reviewing patient care notes" />
        </div>
      </section>

      <section className="dashboard-grid">
        <PatientList
          onSelectPatient={handleSelectPatient}
          selectedPatient={selectedPatient}
        />

        <div className="stack">
          {selectedPatient ? (
            <>
              <CreateSession
                patient={selectedPatient}
                onSessionCreated={(id) => {
                  setSessionId(id);
                  setShowProgress(false);
                  setMessage("");
                  setSessionNote("");
                  setNoteFeedback("");
                  setSeverityWarning(false);
                  setReferralFeedback("");
                  fetchSessions(selectedPatient?._id, id);
                }}
              />

              {sessionId && (
                <section className="panel card section-card">
                  <h3 className="panel-title">Continue Session</h3>
                  <p className="panel-copy">
                    {canAddPostSessionDetails
                      ? "The consultation is completed. Add the session note and progress review now."
                      : "Run or finish the consultation first. Session notes and progress become available after the call ends."}
                  </p>
                  <div className="button-row">
                    <button
                      className="button"
                      onClick={handleStartVideoCall}
                      disabled={startingCall || canAddPostSessionDetails}
                    >
                      {startingCall ? "Opening call..." : "Start Video Call"}
                    </button>
                    <button
                      className="ghost-button"
                      onClick={() => setShowProgress(true)}
                      disabled={!canAddPostSessionDetails}
                    >
                      Add Progress
                    </button>
                  </div>
                  {message && <p className="status-note">{message}</p>}

                  {canAddPostSessionDetails ? (
                    <div className="stack" style={{ marginTop: "18px" }}>
                    <textarea
                      className="textarea"
                      placeholder="Pin the psychologist note that both you and the patient should see under this session."
                      value={sessionNote}
                      onChange={(event) => setSessionNote(event.target.value)}
                    />
                  <div className="button-row">
                      <button
                        className="ghost-button"
                        onClick={handleSaveSessionNote}
                        disabled={savingNote}
                      >
                        {savingNote ? "Saving note..." : "Save Session Note"}
                      </button>
                      <button
                        className="danger-button"
                        onClick={() => {
                          setSessionNote("");
                          setNoteFeedback("");
                        }}
                        disabled={savingNote}
                      >
                        Clear Note Draft
                      </button>
                      <button
                        className="danger-button"
                        onClick={async () => {
                          if (!sessionId) {
                            return;
                          }

                          try {
                            setSavingNote(true);
                            setSessionNote("");
                            setNoteFeedback("");
                            await API.put(`/sessions/${sessionId}`, { notes: "" });
                            setNoteFeedback("Psychologist note removed from the session summary.");
                            fetchSessions(selectedPatient?._id, sessionId);
                          } catch (error) {
                            console.log(error);
                            setNoteFeedback(
                              error.response?.data?.message || "Unable to remove the session note."
                            );
                          } finally {
                            setSavingNote(false);
                          }
                        }}
                        disabled={savingNote}
                      >
                        Remove Saved Note
                      </button>
                    </div>
                    {noteFeedback && <p className="session-banner">{noteFeedback}</p>}
                    </div>
                  ) : (
                    <p className="session-banner" style={{ marginTop: "18px" }}>
                      Complete the consultation to unlock the session note and progress form.
                    </p>
                  )}
                </section>
              )}

              {showProgress && canAddPostSessionDetails && (
                <AddProgress
                  sessionId={sessionId}
                  onSaved={(progress) => {
                    const warning = Boolean(progress?.warningTriggered);
                    setSeverityWarning(warning);
                    fetchProgressEntries(selectedPatient?._id);
                    setReferralFeedback(
                      warning
                        ? "Severity warning detected. Review the case and manually refer if needed."
                        : ""
                    );
                  }}
                />
              )}

              {severityWarning && (
                <section className="panel card section-card emphasis-card">
                  <h3 className="panel-title">Referral Recommendation</h3>
                  <p className="panel-copy">
                    This session triggered a severity warning. Review the case and manually refer
                    the patient to the most suitable clinical psychologist.
                  </p>

                  <div className="field-group">
                    <div className="field">
                      <label htmlFor="clinicalPsychologist">Recommended clinical psychologist</label>
                      <select
                        id="clinicalPsychologist"
                        className="input"
                        value={referralForm.clinicalPsychologist}
                        onChange={(event) =>
                          setReferralForm((current) => ({
                            ...current,
                            clinicalPsychologist: event.target.value
                          }))
                        }
                      >
                        <option value="">Select clinical psychologist</option>
                        {clinicalOptions.map((doctor) => (
                          <option key={doctor._id} value={doctor._id}>
                            {doctor.name}
                            {doctor.specialization ? ` - ${doctor.specialization}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="referralReason">Referral reason</label>
                      <textarea
                        id="referralReason"
                        className="textarea"
                        value={referralForm.reason}
                        onChange={(event) =>
                          setReferralForm((current) => ({
                            ...current,
                            reason: event.target.value
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="button-row" style={{ marginTop: "16px" }}>
                    <button
                      className="button"
                      onClick={handleCreateReferral}
                      disabled={creatingReferral}
                    >
                      {creatingReferral ? "Creating referral..." : "Refer Patient"}
                    </button>
                  </div>

                  {referralFeedback && <p className="session-banner">{referralFeedback}</p>}
                </section>
              )}

              <SessionSummaryList
                title={selectedPatient ? `Consultation History for ${selectedPatient.name}` : "Recent Consultations"}
                sessions={sessions}
                userRole="psychologist"
                emptyMessage="Select a patient or finish a session to see consultation details here."
              />

              <ProgressChart
                title={`Progress Trend for ${selectedPatient.name}`}
                progressEntries={progressEntries}
                emptyMessage="Select a patient to visualize session progress."
              />
            </>
          ) : (
            <div className="empty-state">
              Select a patient from the left to start a session workflow.
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}

export default PsychologistDashboard;
