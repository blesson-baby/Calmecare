import { Link, useLocation, useNavigate } from "react-router-dom";

const navConfig = {
  admin: [
    { label: "Dashboard", to: "/admin" },
    { label: "Approvals", to: "/admin" },
    { label: "Assignments", to: "/admin" }
  ],
  psychologist: [
    { label: "Dashboard", to: "/psychologist" },
    { label: "Patients", to: "/psychologist" },
    { label: "Sessions", to: "/psychologist" }
  ],
  clinicalpsychologist: [
    { label: "Dashboard", to: "/clinical" },
    { label: "Referrals", to: "/clinical" },
    { label: "Sessions", to: "/clinical" }
  ],
  patient: [
    { label: "Dashboard", to: "/patient" },
    { label: "Progress", to: "/patient" },
    { label: "Sessions", to: "/patient" }
  ]
};

function DashboardShell({ title, description, tag, children, actions }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = navConfig[user?.role] || [{ label: "Dashboard", to: "/" }];
  const roleLabel =
    user?.role === "clinicalpsychologist"
      ? "Clinical Specialist"
      : user?.role === "psychologist"
        ? "Psychologist"
        : user?.role === "patient"
          ? "Patient"
          : "Administrator";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <main className="app-shell route-page">
      <section className="page-shell dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <div className="brand-mark">C</div>
            <div>
              <strong className="brand-title">CalmCare</strong>
              <p className="brand-copy">{roleLabel}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <Link
                key={`${item.label}-${item.to}`}
                className={
                  location.pathname === item.to ? "sidebar-link active" : "sidebar-link"
                }
                to={item.to}
              >
                <span className="sidebar-icon">{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-user card">
            <div className="sidebar-avatar">
              {user?.name?.slice(0, 1)?.toUpperCase() || "C"}
            </div>
            <div>
              <strong className="item-title">{user?.name || "CalmCare user"}</strong>
              <p className="item-subtitle">{roleLabel}</p>
            </div>
            <button className="button sidebar-logout" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </aside>

        <section className="dashboard-page">
          <header className="dashboard-header">
            <div className="dashboard-header-copy">
              {tag && <span className="dashboard-tag">{tag}</span>}
              <h1 className="page-title">{title}</h1>
              {description && <p className="page-copy">{description}</p>}

              <div className="dashboard-header-badges">
                <span className="header-chip">Secure care coordination</span>
                <span className="header-chip">Live consultation ready</span>
              </div>
            </div>

            <div className="dashboard-meta">
              {user?.name && <span className="meta-pill">{user.name}</span>}
              {user?.role && <span className="meta-pill">{user.role}</span>}
              {actions}
            </div>
          </header>

          {children}
        </section>
      </section>
    </main>
  );
}

export default DashboardShell;
