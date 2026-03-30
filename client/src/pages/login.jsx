import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await API.post("/auth/login", {
      email,
      password
    });

    // ✅ Store token separately
    localStorage.setItem("token", res.data.token);

    // ✅ Store user separately
    localStorage.setItem("user", JSON.stringify(res.data.user));

    const role = res.data.user.role;

    if (role === "patient") navigate("/patient");
    if (role === "psychologist") navigate("/psychologist");
    if (role === "clinicalpsychologist") navigate("/clinical");

  } catch (err) {
  console.log("STATUS:", err.response?.status);
  console.log("DATA:", err.response?.data);

  alert(err.response?.data?.message || "Login failed");
}
};

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">Login</button>
    </form>
  );
}

export default Login;