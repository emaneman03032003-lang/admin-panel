import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../services/authService";
import "./AdminLoginPage.css";

function AdminLoginPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await adminLogin(email, password);
    if (result.success) {
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="admin-wrapper">
      <div className="twinkle"></div>
      <div className={`login-panel ${open ? "active" : ""}`}>
        
        {!open ? (
          <button className="open-btn" onClick={() => setOpen(true)}>
            🔐 LOGIN
          </button>
        ) : (
          <div className="login-content">
            <h2>Admin Login</h2>
            <form onSubmit={handleAdminLogin}>
              <input
                type="email"
                placeholder="Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button 
                type="submit" 
                className={`submit-btn ${loading ? "loading" : ""}`}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <button className="close-btn" onClick={() => setOpen(false)}>
              ✖
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLoginPage;