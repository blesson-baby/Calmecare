import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import DashboardShell from "../components/DashboardShell";
import SessionSummaryList from "../components/SessionSummaryList";
import ProgressChart from "../components/ProgressChart";
import therapyImage from "../assets/admin-therapy.jpg";

function PatientDashboard() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadDashboard = async () => {
      try {
        const [progressRes, activeSessionRes, sessionsRes] = await Promise.all([
          API.get(`/session-progress/patient/${user.id}`),
          API.get("/sessions/active/me"),
          API.get("/sessions/mine")
        ]);

        setProgress(progressRes.data.data || []);
        setActiveSession(activeSessionRes.data.data || null);
        setSessions(sessionsRes.data.data || []);
      } catch (err) {
        console.log(err.response?.data || err.message);
      }
    };

    loadDashboard();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      API.get("/sessions/active/me")
        .then((res) => {
          setActiveSession(res.data.data || null);
        })
        .catch((err) => {
          console.log(err.response?.data || err.message);
        });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [user?.id]);

  if (!user) {
    return <p>Please log in to view your dashboard.</p>;
  }

  const latest = progress[progress.length - 1];

  return (
    <DashboardShell
      title={`Welcome, ${user.name}`}
      description="Track your recent session updates and watch how your care journey is moving over time."
      tag="Patient Portal"
    >
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Sessions recorded</span>
          <p className="stat-value">{progress.length}</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Latest mood</span>
          <p className="stat-value">{latest?.moodScore ?? "--"}</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Latest stress</span>
          <p className="stat-value">{latest?.stressLevel ?? "--"}</p>
        </div>
      </section>

      <section className="dashboard-spotlight patient-spotlight">
        <div className="dashboard-spotlight-copy">
          <span className="dashboard-tagline">Patient care overview</span>
          <h2 className="panel-title">Stay close to your treatment journey.</h2>
          <p className="panel-copy">
            Review your latest progress markers, watch for follow-up sessions, and keep track of
            what your care team has documented after each consultation.
          </p>
        </div>

        <div className="dashboard-spotlight-media">
          <img src={therapyImage} alt="Calm therapy support session" />
        </div>
      </section>

      {activeSession && (
        <section className="panel card section-card emphasis-card">
          <h3 className="panel-title">Live consultation ready</h3>
          <p className="panel-copy">
            {activeSession.psychologist?.name || "Your psychologist"} has started a video
            consultation for this session.
          </p>
          <div className="button-row">
            <button
              className="button"
              onClick={() => navigate(`/session/${activeSession._id}/call`)}
            >
              Join Video Call
            </button>
          </div>
        </section>
      )}

      {progress.length === 0 ? (
        <div className="empty-state">
          No session data yet. Your progress cards will appear here after your first session update.
        </div>
      ) : (
        <>
          <ProgressChart
            title="Progress Trend"
            progressEntries={progress}
            emptyMessage="No progress trend available yet."
          />

          <section className="timeline-list">
            {progress.map((item, index) => (
              <article key={item._id || index} className="timeline-item detail-card">
                <div className="timeline-top">
                  <h3 className="item-title">Session {index + 1}</h3>
                  <span className={`badge ${item.warningTriggered ? "warning" : ""}`}>
                    {item.warningTriggered ? "Needs attention" : "Stable update"}
                  </span>
                </div>

                <div className="compact-session-table" style={{ marginTop: "16px" }}>
                  <div className="compact-session-row">
                    <span className="detail-key">Mood</span>
                    <span className="compact-metric-value">{item.moodScore ?? "--"}</span>
                  </div>
                  <div className="compact-session-row">
                    <span className="detail-key">Anxiety</span>
                    <span className="compact-metric-value">{item.anxietyLevel ?? "--"}</span>
                  </div>
                  <div className="compact-session-row">
                    <span className="detail-key">Stress</span>
                    <span className="compact-metric-value">{item.stressLevel ?? "--"}</span>
                  </div>
                  <div className="compact-session-row">
                    <span className="detail-key">Depression</span>
                    <span className="compact-metric-value">{item.depressionLevel ?? "--"}</span>
                  </div>
                </div>

                {item.notes && <p className="session-banner">{item.notes}</p>}
              </article>
            ))}
          </section>
        </>
      )}

      <SessionSummaryList
        title="Consultation Details"
        sessions={sessions}
        userRole="patient"
        emptyMessage="No consultation summaries available yet."
      />
    </DashboardShell>
  );
}

export default PatientDashboard;
