const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short"
});

const formatDuration = (start, end) => {
  if (!start || !end) {
    return "--";
  }

  const totalMinutes = Math.max(
    1,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
};

function SessionSummaryList({ title, sessions, userRole, emptyMessage }) {
  if (!sessions.length) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <section className="timeline-list">
      {title && <h3 className="panel-title">{title}</h3>}
      {sessions.map((session, index) => {
        const counterpart =
          userRole === "patient" ? session.psychologist?.name : session.patient?.name;
        const conductedOn =
          session.callStartedAt || session.sessionDate
            ? dateFormatter.format(new Date(session.callStartedAt || session.sessionDate))
            : "--";

        return (
          <article key={session._id || index} className="timeline-item detail-card">
            <div className="timeline-top">
              <h3 className="item-title">Consultation {sessions.length - index}</h3>
              <span
                className={`badge ${
                  session.status === "completed"
                    ? ""
                    : session.status === "cancelled"
                      ? "danger"
                      : "warning"
                }`}
              >
                {session.status}
              </span>
            </div>

            <div className="detail-table" style={{ marginTop: "16px" }}>
              <div className="detail-row">
                <span className="detail-key">
                  {userRole === "patient" ? "Psychologist" : "Patient"}
                </span>
                <span className="detail-value">{counterpart || "--"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Conducted on</span>
                <span className="detail-value">{conductedOn}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Duration</span>
                <span className="detail-value">
                  {formatDuration(session.callStartedAt, session.callEndedAt)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Call state</span>
                <span className="detail-value value-pill">{session.callStatus || "--"}</span>
              </div>
            </div>

            {session.notes ? (
              <div className="session-note-card detail-note-card">
                <span className="stat-label">Consultation note</span>
                <p className="session-note-copy">{session.notes}</p>
              </div>
            ) : (
              <p className="session-banner">No consultation note has been pinned for this session yet.</p>
            )}
          </article>
        );
      })}
    </section>
  );
}

export default SessionSummaryList;
