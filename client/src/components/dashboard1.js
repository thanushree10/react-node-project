import React, { useState, useEffect } from "react";
import "./dashboard1.css";
import Calendar from "../Calendar";
import CandidatesVote from './CandidatesVote';

const Dashboard = ({ userName = "User", onVoteNow, onLogout }) => {
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [expandedSection, setExpandedSection] = useState("");
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("English");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loginHistory] = useState([
    { time: "2026-01-25 08:30", device: "Chrome on Windows" },
    { time: "2026-01-24 20:15", device: "Mobile Safari" }
  ]);
  const [dataSharing, setDataSharing] = useState("allow");
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [emailFieldOpen, setEmailFieldOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [securityUpdateOpen, setSecurityUpdateOpen] = useState(false);
  const [showVote, setShowVote] = useState(false);

  const [liveVotes, setLiveVotes] = useState([40, 35, 25, 20, 15, 10]);
  const [editableName, setUserName] = useState(userName);
  const [email, setEmail] = useState("");

  const [showIdentityPanel, setShowIdentityPanel] = useState(false);
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [hasVoted, setHasVoted] = useState(
    localStorage.getItem("hasVoted") === "true"
  );

  const [votedInfo, setVotedInfo] = useState(() => {
    const saved = localStorage.getItem("votedInfo");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const savedVote = localStorage.getItem("votedInfo");
    const voted = localStorage.getItem("hasVoted") === "true";
    if (voted && savedVote) {
      setHasVoted(true);
      setVotedInfo(JSON.parse(savedVote));
    }
  }, []);

  const increaseVote = (index, voteData) => {
    if (hasVoted) return;

    setLiveVotes((prev) => {
      const updated = [...prev];
      updated[index] = Math.min(updated[index] + 5, 100);
      return updated;
    });

    setHasVoted(true);
    setVotedInfo(voteData);
    localStorage.setItem("hasVoted", "true");
    localStorage.setItem("votedInfo", JSON.stringify(voteData));
    setShowVote(false);
  };

  return (
    <div className={`dashboard-root ${theme}`}>
      {sidebarOpen && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo">E-VOTE</div>
            <div className="hamburger right" onClick={() => setSidebarOpen(false)}>
              <span></span><span></span><span></span>
            </div>
          </div>

          <div className="user-box">
            <div className="avatar">👤</div>
            <h3>{editableName}</h3>
          </div>

          <div className="sidebar-menu">
            <div className={`menu-item ${activeMenu === "dashboard" ? "active" : ""}`} onClick={() => setActiveMenu("dashboard")}>📊 Dashboard</div>
            <div className={`menu-item ${activeMenu === "vote" ? "active" : ""}`} onClick={() => {setActiveMenu("vote");setShowVote(true);setSidebarOpen(false);}}>🗳️ Vote</div>
            <div className={`menu-item ${activeMenu === "settings" ? "active" : ""}`} onClick={() => setActiveMenu("settings")}>⚙️ Settings</div>
            <div className="menu-item logout" onClick={onLogout}>🚪 Logout</div>
          </div>
        </aside>
      )}

      <main className="main">
        <div className="top-header">
          {!sidebarOpen && (
            <div className="hamburger left" onClick={() => setSidebarOpen(true)}>
              <span></span><span></span><span></span>
            </div>
          )}

          <div className="dashboard-greeting">
            <h2>Hello, {editableName} 👋</h2>
            <p>Welcome to E-Vote</p>
          </div>
        </div>

        <section className="grid full-width">
          <div className="card">
            <h2>Ongoing Elections</h2>
            {hasVoted && votedInfo ? (
              <div className="voted-info">
                <p>✅ <b>You have voted</b></p>
                <p>🗳️ Candidate: <b>{votedInfo.candidate}</b></p>
                <p>⏰ Time: <b>{votedInfo.time}</b></p>
              </div>
            ) : (
              <button className="vote-btn" onClick={() => setShowVote(true)}>Vote Now</button>
            )}
          </div>

          {activeMenu === "vote" && showVote && (
            <div className="card full">
              <CandidatesVote onVote={(index, voteData) => increaseVote(index, voteData)} />
              <button className="vote-btn" style={{ marginTop: "15px" }} onClick={() => {setShowVote(false);setActiveMenu("dashboard");setSidebarOpen(true);}}>Back to Dashboard</button>
            </div>
          )}

          <div className="card voting-results">
            <h2>Live Results</h2>
            <div className="graph-content">
              {liveVotes.map((value, index) => (
                <div key={index}>
                  <div className="bar-container">
                    <div className="bar-fill" style={{ height: `${value}%` }} />
                    <span className="bar-value">{value}%</span>
                  </div>
                  <div className="x-label">Candidate {index + 1}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card calendar"><Calendar /></div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard1;
