import React, { useState, useEffect } from "react";
import "./Dashboard.css";

const AdminDashboard = ({ userName = "Admin", onLogout }) => {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const adminId = localStorage.getItem("userId");

  /* ===== DATA STATES ===== */
  const [elections, setElections] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [voters, setVoters] = useState([]);

  /* ===== FETCH DATA ===== */
  useEffect(() => {
    fetch("http://localhost:5000/admin/elections")
      .then(res => res.json())
      .then(setElections)
      .catch(() => {});

    fetch("http://localhost:5000/admin/candidates")
      .then(res => res.json())
      .then(setCandidates)
      .catch(() => {});

    fetch("http://localhost:5000/admin/voters")
      .then(res => res.json())
      .then(setVoters)
      .catch(() => {});
  }, []);

  return (
    <div className="dashboard-root light">
      {/* ================= SIDEBAR ================= */}
      {sidebarOpen && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo">E-VOTE ADMIN</div>

            <div
              className="hamburger right"
              onClick={() => setSidebarOpen(false)}
            >
              <span></span><span></span><span></span>
            </div>
          </div>

          <div className="user-box">
            <div className="avatar">🛡️</div>
            <h3>{userName}</h3>
            <p>Administrator</p>
          </div>

          <div className="sidebar-menu">
            <div
              className={`menu-item ${activeMenu === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveMenu("dashboard")}
            >
              📊 Dashboard
            </div>

            <div
              className={`menu-item ${activeMenu === "elections" ? "active" : ""}`}
              onClick={() => setActiveMenu("elections")}
            >
              🗳️ Elections
            </div>

            <div
              className={`menu-item ${activeMenu === "candidates" ? "active" : ""}`}
              onClick={() => setActiveMenu("candidates")}
            >
              👤 Candidates
            </div>

            <div
              className={`menu-item ${activeMenu === "voters" ? "active" : ""}`}
              onClick={() => setActiveMenu("voters")}
            >
              👥 Voters
            </div>

            <div
              className={`menu-item ${activeMenu === "results" ? "active" : ""}`}
              onClick={() => setActiveMenu("results")}
            >
              📈 Results
            </div>

            <div className="menu-item logout" onClick={onLogout}>
              🚪 Logout
            </div>
          </div>
        </aside>
      )}

      {/* ================= MAIN ================= */}
      <main className="main">
        <div className="top-header">
          {!sidebarOpen && (
            <div className="hamburger left" onClick={() => setSidebarOpen(true)}>
              <span></span><span></span><span></span>
            </div>
          )}

          <div className="dashboard-greeting">
            <h2>Welcome, {userName} 👋</h2>
            <p>Admin Control Panel</p>
          </div>
        </div>

        {/* ================= DASHBOARD ================= */}
        {activeMenu === "dashboard" && (
          <section className="grid full-width">
            <div className="card">
              <h3>Total Elections</h3>
              <p>{elections.length}</p>
            </div>
            <div className="card">
              <h3>Total Candidates</h3>
              <p>{candidates.length}</p>
            </div>
            <div className="card">
              <h3>Registered Voters</h3>
              <p>{voters.length}</p>
            </div>
          </section>
        )}

        {/* ================= ELECTIONS ================= */}
        {activeMenu === "elections" && (
          <div className="card full">
            <h2>🗳️ Elections</h2>
            {elections.map(e => (
              <div key={e.id} className="stat-row">
                <span>{e.title}</span>
                <span className={e.active ? "ongoing" : "pending"}>
                  {e.active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ================= CANDIDATES ================= */}
        {activeMenu === "candidates" && (
          <div className="card full">
            <h2>👤 Candidates</h2>
            {candidates.map(c => (
              <div key={c.id} className="stat-row">
                <span>{c.name}</span>
                <span>{c.election}</span>
              </div>
            ))}
          </div>
        )}

        {/* ================= VOTERS ================= */}
        {activeMenu === "voters" && (
          <div className="card full">
            <h2>👥 Voters</h2>
            {voters.map(v => (
              <div key={v.id} className="stat-row">
                <span>{v.first_name} {v.last_name}</span>
                <span>{v.voted ? "Voted" : "Not Voted"}</span>
              </div>
            ))}
          </div>
        )}

        {/* ================= RESULTS ================= */}
        {activeMenu === "results" && (
          <div className="card full">
            <h2>📈 Election Results</h2>
            <p>Results will be published after election ends.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;