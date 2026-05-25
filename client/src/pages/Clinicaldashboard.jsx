import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import DashboardShell from "../components/DashboardShell";
import PatientList from "../components/PatientList";
import CreateSession from "../components/CreateSession";
import AddProgress from "../components/AddProgress";
import SessionSummaryList from "../components/SessionSummaryList";
import ProgressChart from "../components/ProgressChart";
import telehealthImage from "../assets/admin-telehealth.jpg";

function ClinicalDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [referrals, setReferrals] = useState([]);
  const [patientListRefreshKey, setPatientListRefreshKey] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState("");
  const [sessionNote, setSessionNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState("");
  const [startingCall, setStartingCall] = useState(false);
  const [progressEntries, setProgressEntries] = useState([]);
  const selectedSession = useMemo(
    () => sessions.find((session) => session._id === sessionId) || null,
    [sessions, sessionId]
  );
  const canAddPostSessionDetails = selectedSession?.status === "completed";
  const initializeDashboard = useEffectEvent(() => {
    fetchReferrals();
    fetchSessions();
  });
  const syncPatientContext = useEffectEvent((patientId, preferredSessionId) => {
    fetchSessions(patientId, preferredSessionId);
    fetchProgressEntries(patientId);
  });

  useEffect(() => {
    initializeDashboard();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await API.get("/referrals/my");
      setReferrals(res.data.data || []);
    } catch (err) {
      console.log(err);
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

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setShowProgress(false);
    setMessage("");
    setSessionNote("");
    setNoteFeedback("");
    fetchSessions(patient._id);
    fetchProgressEntries(patient._id);
  };

  const handleAccept = async (id) => {
    try {
      await API.put(`/referrals/accept/${id}`);
      await fetchReferrals();
      setPatientListRefreshKey((current) => current + 1);
    } catch (err) {
      console.log(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await API.put(`/referrals/respond/${id}`, {
        status: "rejected",
        comments: "Not severe enough"
      });
      await fetchReferrals();
    } catch (err) {
      console.log(err);
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
          ? "Clinical note pinned to the session summary."
          : "Clinical note removed from the session summary."
      );
      fetchSessions(selectedPatient?._id, sessionId);
    } catch (error) {
      console.log(error);
      setNoteFeedback(error.response?.data?.message || "Unable to save the session note.");
    } finally {
      setSavingNote(false);
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
    const patientFromCall = location.state?.patient;
    const sessionFromCall = location.state?.sessionId;

    if (!patientFromCall?._id) {
      return;
    }

    setSelectedPatient(patientFromCall);
    setMessage("");
    setNoteFeedback("");
    syncPatientContext(patientFromCall._id, sessionFromCall);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  return (
    <DashboardShell
      title="Clinical Review Desk"
      description="Review referrals, accept transferred cases, and conduct specialist sessions with clinical notes and progress tracking."
      tag="Specialist"
    >
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total referrals</span>
          <p className="stat-value">{referrals.length}</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending review</span>
          <p className="stat-value">
            {referrals.filter((ref) => ref.status === "pending").length}
          </p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Accepted cases</span>
          <p className="stat-value">
            {referrals.filter((ref) => ref.status === "accepted").length}
          </p>
        </div>
      </section>

      <section className="dashboard-spotlight specialist-spotlight">
        <div className="dashboard-spotlight-copy">
          <span className="dashboard-tagline">Clinical specialist desk</span>
          <h2 className="panel-title">Review referred cases with more clarity and less friction.</h2>
          <p className="panel-copy">
            Accept referrals, continue specialist sessions, and document advanced care notes inside
            a workflow that matches the platform’s healthcare-first tone.
          </p>
        </div>

        <div className="dashboard-spotlight-media">
          <img src={telehealthImage} alt="Clinical specialist coordinating virtual patient care" />
        </div>
      </section>

      <section className="referral-grid">
        {referrals.length === 0 ? (
          <div className="empty-state">No referrals available right now.</div>
        ) : (
          referrals.map((ref) => (
            <article key={ref._id} className="referral-card">
              <div className="referral-top">
                <h3 className="item-title">{ref.patient?.name || "Patient"}</h3>
                <span
                  className={`badge ${
                    ref.status === "pending"
                      ? "warning"
                      : ref.status === "rejected"
                        ? "danger"
                        : ""
                  }`}
                >
                  {ref.status}
                </span>
              </div>
              <p className="item-subtitle">{ref.reason}</p>
              <p className="item-subtitle">
                Referred by: {ref.psychologist?.name || "Psychologist"}
              </p>
              {ref.comments && <p className="item-subtitle">Comment: {ref.comments}</p>}

              {ref.status === "pending" && (
                <div className="button-row" style={{ marginTop: "16px" }}>
                  <button className="button" onClick={() => handleAccept(ref._id)}>
                    Accept Case
                  </button>
                  <button className="danger-button" onClick={() => handleReject(ref._id)}>
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </section>

      <section className="dashboard-grid" style={{ marginTop: "22px" }}>
        <PatientList
          key={patientListRefreshKey}
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
                  fetchSessions(selectedPatient?._id, id);
                }}
              />

              {sessionId && (
                <section className="panel card section-card">
                  <h3 className="panel-title">Continue Clinical Session</h3>
                  <p className="panel-copy">
                    {canAddPostSessionDetails
                      ? "The consultation is completed. Add the clinical summary and progress review now."
                      : "Finish the specialist consultation first. Session notes and progress unlock after the call ends."}
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
                      placeholder="Pin the clinical summary or specialist guidance for this session."
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
                            setNoteFeedback("Clinical note removed from the session summary.");
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
                  onSaved={() => fetchProgressEntries(selectedPatient?._id)}
                />
              )}

              <SessionSummaryList
                title={`Clinical Consultation History for ${selectedPatient.name}`}
                sessions={sessions}
                userRole="clinicalpsychologist"
                emptyMessage="Select a referred patient to review consultation details."
              />

              <ProgressChart
                title={`Clinical Progress Trend for ${selectedPatient.name}`}
                progressEntries={progressEntries}
                emptyMessage="Select a referred patient to visualize progress."
              />
            </>
          ) : (
            <div className="empty-state">
              Select an accepted patient to conduct a clinical session.
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}

export default ClinicalDashboard;
