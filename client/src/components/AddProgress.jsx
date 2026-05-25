import { useState } from "react";
import API from "../api/axios";

function AddProgress({ sessionId, onSaved }) {
  const [form, setForm] = useState({
    moodScore: "",
    anxietyLevel: "",
    stressLevel: "",
    depressionLevel: "",
    notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);
      setFeedback("");
      const res = await API.post("/session-progress/create", {
        sessionId,
        moodScore: Number(form.moodScore),
        anxietyLevel: Number(form.anxietyLevel),
        stressLevel: Number(form.stressLevel),
        depressionLevel: Number(form.depressionLevel),
        notes: form.notes
      });

      setFeedback(res.data.message);
      onSaved?.(res.data.data);
      setForm({
        moodScore: "",
        anxietyLevel: "",
        stressLevel: "",
        depressionLevel: "",
        notes: ""
      });
    } catch (err) {
      console.log(err);
      setFeedback(err.response?.data?.message || "Unable to save progress.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel card">
      <h3 className="panel-title">Session Progress</h3>
      <p className="panel-copy">Capture emotional indicators from 0 to 10 and add context notes.</p>

      <div className="metric-grid" style={{ marginBottom: "16px" }}>
        <input
          className="metric-input"
          name="moodScore"
          placeholder="Mood score"
          onChange={handleChange}
          value={form.moodScore}
        />
        <input
          className="metric-input"
          name="anxietyLevel"
          placeholder="Anxiety level"
          onChange={handleChange}
          value={form.anxietyLevel}
        />
        <input
          className="metric-input"
          name="stressLevel"
          placeholder="Stress level"
          onChange={handleChange}
          value={form.stressLevel}
        />
        <input
          className="metric-input"
          name="depressionLevel"
          placeholder="Depression level"
          onChange={handleChange}
          value={form.depressionLevel}
        />
      </div>

      <textarea
        className="textarea"
        name="notes"
        placeholder="Clinical notes, observations, or immediate concerns"
        onChange={handleChange}
        value={form.notes}
      />

      <div className="button-row" style={{ marginTop: "16px" }}>
        <button className="button" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save Progress"}
        </button>
      </div>

      {feedback && <p className="session-banner">{feedback}</p>}
    </section>
  );
}

export default AddProgress;
