import { useState } from "react";
import API from "../api/axios";

function CreateSession({ patient, onSessionCreated }) {
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    try {
      setCreating(true);
      setMessage("");
      const res = await API.post("/sessions", {
        patientId: patient._id
      });

      onSessionCreated(res.data.data._id);
      setMessage("Session created. You can record progress now.");
    } catch (err) {
      console.log(err);
      setMessage(err.response?.data?.message || "Unable to create session.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="panel card">
      <h3 className="panel-title">Open Session</h3>
      <p className="panel-copy">
        Prepare a working session for <strong>{patient.name}</strong> and move directly into
        progress tracking.
      </p>
      <div className="button-row">
        <button className="button" onClick={handleCreate} disabled={creating}>
          {creating ? "Starting..." : "Start Session"}
        </button>
      </div>
      {message && <p className="session-banner">{message}</p>}
    </section>
  );
}

export default CreateSession;
