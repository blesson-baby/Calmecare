import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import consultationImage from "../assets/admin-consultation.jpg";
import telehealthImage from "../assets/admin-telehealth.jpg";
import therapyImage from "../assets/admin-therapy.jpg";

const roleOptions = [
  {
    value: "admin",
    label: "Admin",
    signinCopy: "Approve professionals and assign patients across the platform.",
    registerCopy: "Admin accounts are created separately by the system."
  },
  {
    value: "patient",
    label: "Patient",
    signinCopy: "View your progress timeline and session updates.",
    registerCopy: "Create a patient account to start tracking your care journey."
  },
  {
    value: "psychologist",
    label: "Psychologist",
    signinCopy: "Manage assigned patients, sessions, and progress notes.",
    registerCopy: "Register with your licence and certification details for review."
  },
  {
    value: "clinicalpsychologist",
    label: "Clinical Psychologist",
    signinCopy: "Review referrals and accept transferred cases.",
    registerCopy: "Register with specialist credentials and clinical certification details."
  }
];

const careHighlights = [
  {
    title: "Specialist-led pathways",
    copy: "Match patients with psychologists and escalate to clinical specialists only when needed."
  },
  {
    title: "Live consultation support",
    copy: "Run video sessions, track call status, and keep shared notes inside one calm workspace."
  },
  {
    title: "Continuous progress review",
    copy: "Monitor mood, anxiety, stress, and depression trends to guide care decisions."
  }
];

const carePrograms = [
  {
    title: "Early assessment and triage",
    copy: "Create a clear intake path for patients, identify warning signs sooner, and support timely intervention."
  },
  {
    title: "Coordinated therapy management",
    copy: "Keep referrals, assigned clinicians, session notes, and progress records aligned across the team."
  },
  {
    title: "Specialist review when severity rises",
    copy: "Give psychologists a structured way to recommend clinical specialists after reviewing a warning."
  }
];

const faqItems = [
  {
    question: "Who can use CalmCare?",
    answer: "Patients, psychologists, clinical psychologists, and admins all use the same platform with role-based dashboards."
  },
  {
    question: "How are referrals handled?",
    answer: "Warnings are surfaced during progress tracking, and psychologists can manually recommend the right clinical specialist."
  },
  {
    question: "Does CalmCare support online consultations?",
    answer: "Yes. Sessions can move into live video consultations with notes, call tracking, and follow-up summaries."
  }
];

function Login() {
  const [mode, setMode] = useState("signin");
  const [selectedRole, setSelectedRole] = useState("patient");
  const [signinForm, setSigninForm] = useState({
    email: "",
    password: ""
  });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
    qualification: "",
    specialization: "",
    experience: "",
    certificationName: "",
    certificationIssuer: "",
    certificationYear: "",
    hospitalAffiliation: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const activeRole = roleOptions.find((role) => role.value === selectedRole);
  const isDoctorRole =
    selectedRole === "psychologist" || selectedRole === "clinicalpsychologist";
  const visibleRoles =
    mode === "signin"
      ? roleOptions
      : roleOptions.filter((role) => role.value !== "admin");

  const handleSigninChange = (e) => {
    setSigninForm((current) => ({
      ...current,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegisterChange = (e) => {
    setRegisterForm((current) => ({
      ...current,
      [e.target.name]: e.target.value
    }));
  };

  const routeByRole = (role) => {
    if (role === "admin") navigate("/admin");
    if (role === "patient") navigate("/patient");
    if (role === "psychologist") navigate("/psychologist");
    if (role === "clinicalpsychologist") navigate("/clinical");
  };

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    resetMessages();

    try {
      const res = await API.post("/auth/login", signinForm);
      const loggedInRole = res.data.user.role;

      if (loggedInRole !== selectedRole) {
        setError(`This account belongs to ${loggedInRole}. Please choose the matching role.`);
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      routeByRole(loggedInRole);
    } catch (err) {
      console.log("STATUS:", err.response?.status);
      console.log("DATA:", err.response?.data);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    resetMessages();

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    const payload = {
      name: registerForm.name,
      email: registerForm.email,
      password: registerForm.password,
      role: selectedRole
    };

    if (isDoctorRole) {
      Object.assign(payload, {
        licenseNumber: registerForm.licenseNumber,
        qualification: registerForm.qualification,
        specialization: registerForm.specialization,
        experience: registerForm.experience,
        certificationName: registerForm.certificationName,
        certificationIssuer: registerForm.certificationIssuer,
        certificationYear: registerForm.certificationYear,
        hospitalAffiliation: registerForm.hospitalAffiliation
      });
    }

    try {
      await API.post("/auth/register", payload);

      setSuccess(
        isDoctorRole
          ? "Professional registration submitted. Your account is pending review."
          : "Registration completed. You can sign in now."
      );
      setMode("signin");
      setSigninForm({
        email: registerForm.email,
        password: registerForm.password
      });
      setRegisterForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        licenseNumber: "",
        qualification: "",
        specialization: "",
        experience: "",
        certificationName: "",
        certificationIssuer: "",
        certificationYear: "",
        hospitalAffiliation: ""
      });
    } catch (err) {
      console.log("STATUS:", err.response?.status);
      console.log("DATA:", err.response?.data);
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="landing-shell route-page">
      <section className="landing-nav">
        <div className="landing-brand">
          <div className="landing-brand-mark">C</div>
          <div>
            <strong>CalmCare</strong>
            <span>Mental health care platform</span>
          </div>
        </div>

        <div className="landing-nav-links">
          <a href="#programs">Programs</a>
          <a href="#workflow">How it works</a>
          <a href="#access">Access portal</a>
        </div>

        <button
          className="button"
          type="button"
          onClick={() => document.getElementById("access")?.scrollIntoView({ behavior: "smooth" })}
        >
          Get Started
        </button>
      </section>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-kicker">Integrated mental health support</span>
          <h1 className="landing-title">
            Specialist care pathways built for therapy teams, patients, and clinical review.
          </h1>
          <p className="landing-description">
            CalmCare helps your team manage assessments, live consultations, progress reviews,
            and specialist referrals inside one healthcare-style platform designed for clarity.
          </p>

          <div className="landing-cta-row">
            <button
              className="button"
              type="button"
              onClick={() => document.getElementById("access")?.scrollIntoView({ behavior: "smooth" })}
            >
              Enter Patient Portal
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => document.getElementById("programs")?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore Services
            </button>
          </div>

          <div className="landing-stat-grid">
            <div className="landing-stat-card">
              <strong>4 roles</strong>
              <span>Admins, patients, psychologists, and clinical specialists.</span>
            </div>
            <div className="landing-stat-card">
              <strong>Live sessions</strong>
              <span>Video consultations and progress capture in one workflow.</span>
            </div>
            <div className="landing-stat-card">
              <strong>Safer referrals</strong>
              <span>Manual specialist recommendations after severity review.</span>
            </div>
          </div>
        </div>

        <div className="landing-hero-visual">
          <article className="landing-hero-card large">
            <img src={consultationImage} alt="Healthcare specialist in a calm consultation setting" />
            <div className="landing-hero-overlay">
              <span>Clinical coordination</span>
              <strong>Case review, referral planning, and secure follow-up.</strong>
            </div>
          </article>

          <article className="landing-hero-card small">
            <img src={telehealthImage} alt="Doctor using telehealth tools on a laptop" />
            <div className="landing-badge-card">
              <span>Telehealth ready</span>
              <strong>Virtual sessions supported</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="landing-section" id="programs">
        <div className="section-heading">
          <span className="landing-kicker">Care programs</span>
          <h2 className="section-title">A medical-style front door for your mental health workflows.</h2>
          <p className="section-copy">
            Inspired by modern healthcare websites, this experience introduces your platform with
            a strong clinical tone while still connecting directly to the app.
          </p>
        </div>

        <div className="landing-feature-grid">
          {carePrograms.map((program) => (
            <article key={program.title} className="landing-feature-card">
              <h3>{program.title}</h3>
              <p>{program.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section-split" id="workflow">
        <div className="landing-content-stack">
          <span className="landing-kicker">Why teams choose CalmCare</span>
          <h2 className="section-title">Healthcare-style coordination without losing the human side of care.</h2>
          <div className="landing-checklist">
            {careHighlights.map((item) => (
              <article key={item.title} className="landing-check-item">
                <div className="landing-check-mark">+</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="landing-image-stack">
          <img className="landing-stack-main" src={therapyImage} alt="Therapist supporting a patient in session" />
          <div className="landing-stack-panel card">
            <span className="landing-kicker">Built for action</span>
            <h3 className="panel-title">From warning to specialist referral</h3>
            <p className="panel-copy">
              Psychologists can review severity warnings, document the session, and choose the most
              suitable clinical specialist before transferring care.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section landing-faq-grid">
        <div className="section-heading">
          <span className="landing-kicker">Frequently asked questions</span>
          <h2 className="section-title">Everything needed to get teams and patients into care quickly.</h2>
        </div>

        <div className="landing-faq-list">
          {faqItems.map((item) => (
            <article key={item.question} className="landing-faq-card">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section auth-section" id="access">
        <div className="auth-intro">
          <span className="landing-kicker">Portal access</span>
          <h2 className="section-title">Sign in or register to enter the right CalmCare workspace.</h2>
          <p className="section-copy">
            Patients can review their journey, psychologists can document care, and specialists can
            manage accepted referrals from one connected platform.
          </p>
        </div>

        <div className={`card login-card ${isDoctorRole && mode === "register" ? "login-card-wide" : ""}`}>
          <div className="auth-toggle">
            <button
              className={mode === "signin" ? "auth-tab active" : "auth-tab"}
              type="button"
              onClick={() => {
                setMode("signin");
                resetMessages();
              }}
            >
              Sign In
            </button>
            <button
              className={mode === "register" ? "auth-tab active" : "auth-tab"}
              type="button"
              onClick={() => {
                setMode("register");
                if (selectedRole === "admin") {
                  setSelectedRole("patient");
                }
                resetMessages();
              }}
            >
              Registration
            </button>
          </div>

          <h2 className="card-title">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="card-subtitle">
            {mode === "signin"
              ? "Choose your role and sign in to the right CalmCare dashboard."
              : "Register with the role that matches how you will use the platform."}
          </p>

          <div className="role-grid">
            {visibleRoles.map((role) => (
              <button
                key={role.value}
                type="button"
                className={selectedRole === role.value ? "role-card active" : "role-card"}
                onClick={() => setSelectedRole(role.value)}
              >
                <strong>{role.label}</strong>
                <span>{mode === "signin" ? role.signinCopy : role.registerCopy}</span>
              </button>
            ))}
          </div>

          <p className="role-copy">
            {mode === "signin" ? activeRole?.signinCopy : activeRole?.registerCopy}
          </p>

          {mode === "register" && selectedRole === "admin" && (
            <div className="empty-state">
              Admin accounts are not created from public registration. Choose another role.
            </div>
          )}

          <form
            onSubmit={mode === "signin" ? handleLogin : handleRegister}
            style={
              mode === "register" && selectedRole === "admin"
                ? { display: "none" }
                : undefined
            }
          >
            <div className={`field-group ${isDoctorRole && mode === "register" ? "field-group-two" : ""}`}>
              {mode === "register" && (
                <div className="field">
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    name="name"
                    className="input"
                    placeholder="Enter your full name"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                  />
                </div>
              )}

              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  className="input"
                  placeholder="you@example.com"
                  value={mode === "signin" ? signinForm.email : registerForm.email}
                  onChange={mode === "signin" ? handleSigninChange : handleRegisterChange}
                />
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  className="input"
                  placeholder="Enter your password"
                  type="password"
                  value={mode === "signin" ? signinForm.password : registerForm.password}
                  onChange={mode === "signin" ? handleSigninChange : handleRegisterChange}
                />
              </div>

              {mode === "register" && (
                <div className="field">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    className="input"
                    placeholder="Re-enter your password"
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                  />
                </div>
              )}

              {mode === "register" && isDoctorRole && (
                <>
                  <div className="field">
                    <label htmlFor="licenseNumber">License number</label>
                    <input
                      id="licenseNumber"
                      name="licenseNumber"
                      className="input"
                      placeholder="Professional license ID"
                      value={registerForm.licenseNumber}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="qualification">Qualification</label>
                    <input
                      id="qualification"
                      name="qualification"
                      className="input"
                      placeholder="M.Phil, PsyD, PhD, MD, etc."
                      value={registerForm.qualification}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="specialization">Specialization</label>
                    <input
                      id="specialization"
                      name="specialization"
                      className="input"
                      placeholder="Trauma, CBT, Child Psychology..."
                      value={registerForm.specialization}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="experience">Years of experience</label>
                    <input
                      id="experience"
                      name="experience"
                      className="input"
                      placeholder="e.g. 8"
                      value={registerForm.experience}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="certificationName">Certification</label>
                    <input
                      id="certificationName"
                      name="certificationName"
                      className="input"
                      placeholder="Clinical certification name"
                      value={registerForm.certificationName}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="certificationIssuer">Issuing authority</label>
                    <input
                      id="certificationIssuer"
                      name="certificationIssuer"
                      className="input"
                      placeholder="Board or institute name"
                      value={registerForm.certificationIssuer}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="certificationYear">Certification year</label>
                    <input
                      id="certificationYear"
                      name="certificationYear"
                      className="input"
                      placeholder="e.g. 2021"
                      value={registerForm.certificationYear}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="hospitalAffiliation">Hospital / clinic affiliation</label>
                    <input
                      id="hospitalAffiliation"
                      name="hospitalAffiliation"
                      className="input"
                      placeholder="Current workplace or practice"
                      value={registerForm.hospitalAffiliation}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </>
              )}
            </div>

            {error && <p className="status-note">{error}</p>}
            {success && <p className="session-banner">{success}</p>}

            <div className="button-row" style={{ marginTop: "22px" }}>
              <button className="button" type="submit" disabled={submitting}>
                {submitting
                  ? mode === "signin"
                    ? "Signing in..."
                    : "Creating account..."
                  : mode === "signin"
                    ? "Login"
                    : "Register"}
              </button>
            </div>
          </form>

          <p className="login-footer">
            {mode === "signin" ? (
              <>
                Need an account?{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setMode("register");
                    if (selectedRole === "admin") {
                      setSelectedRole("patient");
                    }
                    resetMessages();
                  }}
                >
                  Open registration
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setMode("signin");
                    resetMessages();
                  }}
                >
                  Back to sign in
                </button>
              </>
            )}
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
