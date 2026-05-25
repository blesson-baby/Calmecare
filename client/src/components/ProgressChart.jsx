import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

function ProgressChart({ title, progressEntries, emptyMessage }) {
  if (!progressEntries.length) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  const ordered = [...progressEntries].reverse();
  const labels = ordered.map((_, index) => `S${index + 1}`);
  const latest = ordered[ordered.length - 1];
  const latestRecordedOn = latest?.createdAt
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(latest.createdAt))
    : "--";

  const sharedDatasetStyle = {
    tension: 0.35,
    borderWidth: 3,
    pointRadius: 5,
    pointHoverRadius: 7,
    pointBorderWidth: 2,
    pointBackgroundColor: "#ffffff",
    fill: false
  };

  const data = {
    labels,
    datasets: [
      {
        label: "Mood",
        data: ordered.map((item) => item.moodScore ?? null),
        borderColor: "#3f86dc",
        backgroundColor: "rgba(63, 134, 220, 0.14)",
        pointBorderColor: "#3f86dc",
        ...sharedDatasetStyle
      },
      {
        label: "Anxiety",
        data: ordered.map((item) => item.anxietyLevel ?? null),
        borderColor: "#37b79a",
        backgroundColor: "rgba(55, 183, 154, 0.12)",
        pointBorderColor: "#37b79a",
        ...sharedDatasetStyle
      },
      {
        label: "Stress",
        data: ordered.map((item) => item.stressLevel ?? null),
        borderColor: "#f08c47",
        backgroundColor: "rgba(240, 140, 71, 0.12)",
        pointBorderColor: "#f08c47",
        ...sharedDatasetStyle
      },
      {
        label: "Depression",
        data: ordered.map((item) => item.depressionLevel ?? null),
        borderColor: "#dd6a57",
        backgroundColor: "rgba(221, 106, 87, 0.12)",
        pointBorderColor: "#dd6a57",
        ...sharedDatasetStyle
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 12,
          color: "#27486f"
        }
      },
      tooltip: {
        backgroundColor: "rgba(35, 64, 95, 0.94)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        padding: 12,
        displayColors: true
      }
    },
    scales: {
      x: {
        grid: {
          color: "rgba(108, 136, 176, 0.08)"
        },
        ticks: {
          color: "#6e86a6"
        }
      },
      y: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
          color: "#6e86a6"
        },
        grid: {
          color: "rgba(108, 136, 176, 0.08)"
        }
      }
    }
  };

  return (
    <section className="panel card section-card">
      <h3 className="panel-title">{title}</h3>
      <p className="panel-copy">
        Visual trendline for mood, anxiety, stress, and depression across recorded sessions.
      </p>
      <div className="chart-summary-grid">
        <div className="mini-overview-card">
          <span className="stat-label">Latest update</span>
          <p className="chart-summary-copy">{latestRecordedOn}</p>
        </div>
        <div className="mini-overview-card">
          <span className="stat-label">Mood</span>
          <p className="chart-summary-copy mood-summary">{latest?.moodScore ?? "--"}</p>
        </div>
        <div className="mini-overview-card">
          <span className="stat-label">Anxiety</span>
          <p className="chart-summary-copy anxiety-summary">{latest?.anxietyLevel ?? "--"}</p>
        </div>
        <div className="mini-overview-card">
          <span className="stat-label">Stress</span>
          <p className="chart-summary-copy stress-summary">{latest?.stressLevel ?? "--"}</p>
        </div>
        <div className="mini-overview-card">
          <span className="stat-label">Depression</span>
          <p className="chart-summary-copy depression-summary">
            {latest?.depressionLevel ?? "--"}
          </p>
        </div>
        <div className="mini-overview-card">
          <span className="stat-label">Attention flag</span>
          <p className="chart-summary-copy">
            {latest?.warningTriggered ? "Warning raised" : "Stable"}
          </p>
        </div>
      </div>
      <div className="chart-frame">
        <Line data={data} options={options} />
      </div>
    </section>
  );
}

export default ProgressChart;
