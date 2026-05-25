const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short"
});

function ProgressHistoryList({
  title,
  progressEntries,
  deletingId,
  onDelete,
  emptyMessage
}) {
  if (!progressEntries.length) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <section className="timeline-list">
      {title && <h3 className="panel-title">{title}</h3>}
      {progressEntries.map((entry, index) => (
        <article key={entry._id || index} className="timeline-item detail-card">
          <div className="timeline-top">
            <h3 className="item-title">Progress Entry {progressEntries.length - index}</h3>
            <span className={`badge ${entry.warningTriggered ? "warning" : ""}`}>
              {entry.warningTriggered ? "Warning raised" : "Saved"}
            </span>
          </div>

          <div className="detail-table" style={{ marginTop: "16px" }}>
            <div className="detail-row">
              <span className="detail-key">Recorded on</span>
              <span className="detail-value">
                {entry.createdAt ? dateFormatter.format(new Date(entry.createdAt)) : "--"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Mood</span>
              <span className="detail-value metric-pill">{entry.moodScore ?? "--"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Anxiety</span>
              <span className="detail-value metric-pill">{entry.anxietyLevel ?? "--"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Stress</span>
              <span className="detail-value metric-pill">{entry.stressLevel ?? "--"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Depression</span>
              <span className="detail-value metric-pill">{entry.depressionLevel ?? "--"}</span>
            </div>
          </div>

          {entry.notes ? (
            <div className="session-note-card detail-note-card">
              <span className="stat-label">Progress note</span>
              <p className="session-note-copy">{entry.notes}</p>
            </div>
          ) : (
            <p className="session-banner">No progress note saved for this entry.</p>
          )}

          <div className="button-row" style={{ marginTop: "16px" }}>
            <button
              className="danger-button"
              onClick={() => onDelete(entry)}
              disabled={deletingId === entry._id}
            >
              {deletingId === entry._id ? "Deleting..." : "Delete Progress"}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

export default ProgressHistoryList;
