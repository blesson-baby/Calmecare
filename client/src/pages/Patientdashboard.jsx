import { useEffect, useState } from "react";
import API from "../api/axios";

function PatientDashboard() {
  const [progress, setProgress] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await API.get(`/session-progress/${user.id}`);
      setProgress(res.data.data);
    } catch (err) {
      console.log(err.response?.data);
    }
  };

  return (
    <div>
      <h2>Welcome {user.name}</h2>

      <h3>Your Progress</h3>

      {progress.length === 0 ? (
        <p>No session data yet</p>
      ) : (
        progress.map((item, index) => (
          <div key={index}>
            <p>Session {index + 1}</p>
            <p>Stress: {item.stressLevel}</p>
            <p>Anxiety: {item.anxietyLevel}</p>
            <p>Mood: {item.moodScore}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default PatientDashboard;