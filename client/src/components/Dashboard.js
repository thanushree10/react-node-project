import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import Calendar from "../Calendar";
import CandidatesVote from './CandidatesVote';


const Dashboard = ({ userName = "User", onVoteNow, onLogout }) => {
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role"); // "user" | "admin"



  // 🔹 ADDED: Profile & Security panel state
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  // Settings states
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
  // 🔹 LIVE RESULTS STATE (ADD HERE)
const [liveVotes, setLiveVotes] = useState([40, 35, 25, 20, 15, 10]);




  // 🔹 ADDED: Profile identity states (FIX)
  const [editableName, setUsersName] = useState(userName);
  const [email, setEmail] = useState("");


// 🔹 ADDED: Identity & Security panel toggle states
const [showIdentityPanel, setShowIdentityPanel] = useState(false);
const [showSecurityPanel, setShowSecurityPanel] = useState(false);

// 🔹 Security states
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
// 🔹 ADDED: Vote status (ONE PERSON – ONE VOTE)
const [hasVoted, setHasVoted] = useState(
  localStorage.getItem("hasVoted") === "true"
);
// 🔹 ADDED: Voted info (time + candidate)
const [votedInfo, setVotedInfo] = useState(() => {
  const saved = localStorage.getItem("votedInfo");
  return saved ? JSON.parse(saved) : null;
});



  const handleMenuClick = (menu, guideline = false) => {
    setActiveMenu(menu);
    setShowGuidelines(guideline);
    setSidebarOpen(menu === "dashboard");
  };
 useEffect(() => {
  if (!userId || !role) return;

  const url =
    role === "admin"
      ? `http://localhost:5000/admin/profile/${userId}`
      : `http://localhost:5000/user/profile/${userId}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      setUserName(`${data.first_name} ${data.last_name}`);
      setEmail(data.email || "");
    })
    .catch(err => console.error("Profile fetch error:", err));
}, [userId, role]);



  const toggleSection = (section) =>
    setExpandedSection(expandedSection === section ? "" : section);

 // 🔹 ADDED: Identity update handler (FIX)
const handleUpdateIdentity = async () => {
  if (!userId || !role) {
    alert("Not logged in");
    return;
  }

  const [first_name, last_name = ""] = editableName.split(" ");

  const base =
    role === "admin"
      ? "http://localhost:5000/admin/profile"
      : "http://localhost:5000/user/profile";

  try {
    // update name
    const res = await fetch(`${base}/name`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,
        first_name,
        last_name
      })
    });

    if (!res.ok) throw new Error("Name update failed");

    // update email (optional)
    if (email && email.trim() !== "") {
      const emailRes = await fetch(`${base}/email`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          email
        })
      });

      if (!emailRes.ok) throw new Error("Email update failed");
    }

    alert("Profile updated successfully ✅");
    localStorage.setItem("userName", editableName);

  } catch (err) {
    alert(err.message);
  }
};
 // 🔹 ADDED: Password update handler (FIX)
 const handleUpdatePassword = () => {
  if (!currentPassword || !newPassword) {
    alert("Fill all fields");
    return;
  }

  const base =
    role === "admin"
      ? "http://localhost:5000/admin"
      : "http://localhost:5000/user";

  fetch(`${base}/${userId}/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) throw new Error(data.message);
      alert("Password updated ✅");
      setCurrentPassword("");
      setNewPassword("");
    })
    .catch(err => alert(err.message));
};

// 🔹 Increase vote for a candidate (ADD HERE)
const increaseVote = (index, candidateName) => {
  if (hasVoted) return;

  setLiveVotes((prev) => {
    const updated = [...prev];
    updated[index] = Math.min(updated[index] + 5, 100);
    return updated;
  });

  const voteDetails = {
    candidate: candidateName,
    time: new Date().toLocaleString()
  };

  setHasVoted(true);
  setVotedInfo(voteDetails);

  localStorage.setItem("hasVoted", "true");
  localStorage.setItem("votedInfo", JSON.stringify(voteDetails));
};


  return (
    <div className={`dashboard-root ${theme}`}>
      {/* ================= SIDEBAR ================= */}
      {sidebarOpen && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo">E-VOTE</div>

            <div
              className="hamburger right"
              onClick={() => setSidebarOpen(false)}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <div className="user-box">
            <div className="avatar">👤</div>
            <h3>{editableName}</h3>

          </div>

          <div className="sidebar-menu">
            <div
              className={`menu-item ${activeMenu === "dashboard" ? "active" : ""}`}
              onClick={() => handleMenuClick("dashboard")}
            >
              📊 Dashboard
            </div>

            <div
              className={`menu-item ${activeMenu === "vote" ? "active" : ""}`}
              onClick={() => handleMenuClick("vote")}
            >
              🗳️ Vote
            </div>

            <div
              className={`menu-item ${activeMenu === "guideline" ? "active" : ""}`}
              onClick={() => handleMenuClick("guideline", true)}
            >
              📋 Voters Guideline
            </div>

            <div
              className={`menu-item ${activeMenu === "settings" ? "active" : ""}`}
              onClick={() => handleMenuClick("settings")}
            >
              ⚙️ Settings
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
            <div
              className="hamburger left"
              onClick={() => setSidebarOpen(true)}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
          
  {/* 🔹 Greeting section (PASTE HERE) */}
  <div className="dashboard-greeting">
    <h2>Hello, {editableName} 👋</h2>

    <p>Welcome to E-Vote</p>
  </div>

          {/* Profile icon – ALWAYS visible */}
    <div className="top-right-profile">
  <button
    className={`profile-tab ${showIdentityPanel ? "active" : ""}`}
    onClick={() => {
      setShowIdentityPanel(true);
      setShowSecurityPanel(false);
    }}
  >
    🧑 Identity
  </button>

  <button
    className={`profile-tab ${showSecurityPanel ? "active" : ""}`}
    onClick={() => {
      setShowSecurityPanel(true);
      setShowIdentityPanel(false);
    }}
  >
    🔐 Security
  </button>
</div>


          {/* 🔹 Profile & Security panel */}
         {showIdentityPanel && (
  <div className="profile-panel">
    <h3>🪪 Identity</h3>

    <label>
      Name:
      <input
        type="text"
        value={editableName}
        onChange={(e) => setEditableName(e.target.value)}
      />
    </label>

   <label>
  Email:
  <input
    type="email"
    placeholder="Enter email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</label>


    <button className="update-btn" onClick={handleUpdateIdentity}>
      Update Identity
    </button>

    <button
      className="vote-btn"
      onClick={() => setShowIdentityPanel(false)}
    >
      Close
    </button>
  </div>
)}
{showSecurityPanel && (
  <div className="profile-panel">
    <h3>🔒 Security</h3>

    <label>
      Current Password:
      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
    </label>

    <label>
      New Password:
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
    </label>

    <button className="update-btn" onClick={handleUpdatePassword}>
      Update Password
    </button>

    <h4>Recent Logins</h4>
    <ul>
      {loginHistory.map((item, i) => (
        <li key={i}>{item.time} – {item.device}</li>
      ))}
    </ul>

    <button
      className="vote-btn"
      onClick={() => setShowSecurityPanel(false)}
    >
      Close
    </button>
  </div>
)}
</div>

          

        {/* ================= VOTER GUIDELINES ================= */}
         {showGuidelines ? (
          <div className="card full">
            <h2>🧭 Before You Vote</h2>

            <ul className="activities">
              <li>
                <span>🆔 Identity & Access</span>
                <span className="ongoing">Required</span>
              </li>
              <li>
                <span>• Login using your registered account</span>
              </li>
              <li>
                <span>• Do not share your login credentials</span>
              </li>
              <li>
                <span>• Voting is allowed only once per voter</span>
              </li>

              <li>
                <span>🔐 Security & Privacy</span>
                <span className="done">Secure</span>
              </li>
              <li>
                <span>• Your vote is encrypted and anonymous</span>
              </li>
              <li>
                <span>• No one can see who you voted for</span>
              </li>
              <li>
                <span>• Do not refresh or close browser while voting</span>
              </li>

              <li>
                <span>🖥️ Device & Network</span>
                <span className="pending">Important</span>
              </li>
              <li>
                <span>• Use a personal device</span>
              </li>
              <li>
                <span>• Avoid public Wi-Fi or shared computers</span>
              </li>
              <li>
                <span>• Ensure stable internet connection</span>
              </li>

              <li>
                <span>🗳️ Voting Rules</span>
                <span className="ongoing">Mandatory</span>
              </li>
              <li>
                <span>• Select only one candidate</span>
              </li>
              <li>
                <span>• Vote cannot be changed after submission</span>
              </li>
              <li>
                <span>• Confirm carefully before final submit</span>
              </li>

              <li>
                <span>⏰ Time & Validity</span>
                <span className="pending">Check</span>
              </li>
              <li>
                <span>• Votes accepted only during election period</span>
              </li>
              <li>
                <span>• Late submissions are not counted</span>
              </li>

              <li>
                <span>⚠️ Fair Voting</span>
                <span className="done">Ethical</span>
              </li>
              <li>
                <span>• Do not attempt multiple votes</span>
              </li>
              <li>
                <span>• Suspicious activity may cancel vote</span>
              </li>
              <li>
                <span>• Follow ethical and legal practices</span>
              </li>
            </ul>


            <button
              className="vote-btn"
              onClick={() => {
                setShowGuidelines(false);
                setActiveMenu("dashboard");
                setSidebarOpen(true);
              }}
            >
              Back to Dashboard
            </button>
          </div>
        ) : activeMenu === "settings" ? (
          <div className="card full">
            <h2>⚙️ Settings</h2>

            {/* ================= SETTINGS SECTIONS ================= */}
            {/* Voting Preferences */}
            <div className="settings-section">
              <h3 onClick={() => toggleSection("voting")}>
                Voting Preferences {expandedSection === "voting" ? "▲" : "▼"}
              </h3>
              {expandedSection === "voting" && (
                <ul className="activities">
                  <li>
                    Notifications:{" "}
                    <label>
                      <input
                        type="checkbox"
                        checked={notificationsEnabled}
                        onChange={() =>
                          setNotificationsEnabled(!notificationsEnabled)
                        } 
                      />{" "}
                      Enable
                    </label>
                  </li>
                  <li>
                    Language:{" "}
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Marathi</option>
                      <option>Telugu</option>
                      <option>Bengali</option>
                    </select>
                  </li>
                  <li>
                    Theme:{" "}
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </li>
                </ul>
              )}
            </div>

            {/* Security Settings */}
            <div className="settings-section">
              <h3 onClick={() => toggleSection("security")}>
                Security Settings {expandedSection === "security" ? "▲" : "▼"}
              </h3>
              {expandedSection === "security" && (
                <ul className="activities">
                  {loginHistory.map((entry, index) => (
                    <li key={index}>
                      {entry.time} - {entry.device}
                    </li>
                  ))}
                  <li>
                    Logout from all devices:{" "}
                    <button
                      className="vote-btn"
                      onClick={() => alert("Logged out from all devices")}
                    >
                      Logout All
                    </button>
                  </li>
                  <li>
                    Security Questions:{" "}
                    <button
                      className="vote-btn"
                      onClick={() => setSecurityUpdateOpen(!securityUpdateOpen)}
                    >
                      Update
                    </button>
                  </li>
                  {securityUpdateOpen && (
                    <li>
                      <input
                        type="text"
                        placeholder="Enter new security answer"
                        style={{ marginTop: "10px", padding: "6px", width: "90%" }}
                      />
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Privacy Settings */}
            <div className="settings-section">
              <h3 onClick={() => toggleSection("privacy")}>
                Privacy Settings {expandedSection === "privacy" ? "▲" : "▼"}
              </h3>
              {expandedSection === "privacy" && (
                <ul className="activities">
                  <li>
                    Data Sharing:{" "}
                    <label>
                      <input
                        type="radio"
                        checked={dataSharing === "allow"}
                        onChange={() => setDataSharing("allow")}
                      />{" "}
                      Allow
                    </label>{" "}
                    <label>
                      <input
                        type="radio"
                        checked={dataSharing === "dont"}
                        onChange={() => setDataSharing("dont")}
                      />{" "}
                      Don't Allow
                    </label>
                  </li>
                  <li>
                    Profile Visibility:{" "}
                    <label>
                      <input
                        type="radio"
                        checked={profileVisibility === "public"}
                        onChange={() => setProfileVisibility("public")}
                      />{" "}
                      Public
                    </label>{" "}
                    <label>
                      <input
                        type="radio"
                        checked={profileVisibility === "private"}
                        onChange={() => setProfileVisibility("private")}
                      />{" "}
                      Private
                    </label>
                  </li>
                </ul>
              )}
            </div>

            {/* Support & Help */}
            <div className="settings-section">
              <h3 onClick={() => toggleSection("support")}>
                Support & Help {expandedSection === "support" ? "▲" : "▼"}
              </h3>
              {expandedSection === "support" && (
                <ul className="activities">
                  <li>
                    Contact Support:{" "}
                    {!emailFieldOpen ? (
                      <button
                        className="vote-btn"
                        onClick={() => setEmailFieldOpen(true)}
                      >
                        Email
                      </button>
                    ) : (
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ padding: "6px", width: "90%", marginTop: "8px" }}
                      />
                    )}
                  </li>
                  <li>
                    FAQs / User Guide:{" "}
                    <button
                      className="vote-btn"
                      onClick={() => setShowGuide(!showGuide)}
                    >
                      Open Guide
                    </button>
                  </li>
                  {showGuide && (
                    <ul style={{ marginTop: "10px", color: "#1f2a44" }}>
                      <li>1. Login securely with registered account.</li>
                      <li>2. Vote only once per election.</li>
                      <li>3. Do not share credentials or devices.</li>
                      <li>4. Your vote is encrypted and anonymous.</li>
                    </ul>
                  )}
                </ul>
              )}
            </div>

            {/* About & Legal */}
            <div className="settings-section">
              <h3 onClick={() => toggleSection("about")}>
                About & Legal {expandedSection === "about" ? "▲" : "▼"}
              </h3>
              {expandedSection === "about" && (
                <ul className="activities">
                  <li>
                    <a href="/terms" className="vote-btn">
                      Terms of Service & Privacy Policy
                    </a>
                  </li>
                  <li>App Version: 1.0.0</li>
                </ul>
              )}
            </div>

            <button
              className="vote-btn"
              onClick={() => {
                setActiveMenu("dashboard");
                setSidebarOpen(true);
              }}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* ================= DASHBOARD CONTENT ================= */}
            <section className="grid full-width">
  <div className="card">
    <h2>Ongoing Elections</h2>
    <div className="election-item">
      <img
        src="https://img.freepik.com/free-vector/election-concept-illustration_114360-8276.jpg?w=300"
        alt="Election"
        className="election-image"
      />
      <div>
        <h3>General Election 2026</h3>
        <p>Vote for your preferred candidate</p>
        {/* 🔹 Updated: handle Vote Now locally */}
        {hasVoted && votedInfo ? (
  <div className="voted-info">
    <p>✅ <b>You have voted</b></p>
    <p>🗳️ Candidate: <b>{votedInfo.candidate}</b></p>
    <p>⏰ Time: <b>{votedInfo.time}</b></p>
  </div>
) : (
  <button
    className="vote-btn"
    onClick={() => setShowVote(true)}
  >
    Vote Now
  </button>
)}



      </div>
    </div>
  </div>

  {/* 🔹 Render CandidatesVote when showVote is true */}
  {showVote && (
    <div className="card full">
      <CandidatesVote onVote={(index, candidateName) => increaseVote(index, candidateName)} />


      <button
        className="vote-btn"
        style={{ marginTop: "15px" }}
        onClick={() => setShowVote(false)}
      >
        Back to Dashboard
      </button>
    </div>
  )}


              <div className="card calendar">
                <Calendar />
              </div>

              <div className="card voting-results">
                <h2>Live Results</h2>
                
  <div className="graph-body">
    <div className="y-axis">
      <span>100%</span>
      <span>75%</span>
      <span>50%</span>
      <span>25%</span>
      <span>0%</span>
    </div>

    <div className="graph-content">
      {liveVotes.map((value, index) => (
        <div key={index}>
          <div className="bar-container">
            <div
              className="bar-fill"
              style={{ height: `${value}%` }}
            />
            <span className="bar-value">{value}%</span>
          </div>

          <div className="x-label">Candidate {index + 1}</div>

        </div>
      ))}
    </div>
  </div>
</div>

              <div className="card voter-stats">
                <h2>Voting Process</h2>
                <div className="stat-row">
                  <div className="stat-circle">5</div>
                  <span>Total Number of Candidates</span>
                </div>
                <div className="stat-row">
                  <div className="stat-circle">500</div>
                  <span>Total Registered Voters</span>
                </div>
                <div className="stat-row">
                  <div className="stat-circle">200</div>
                  <span>Total Numbers Voted</span>
                </div>
              </div>

              <div className="card full activities-card">
                <h3>Election Activities</h3>
                <ul className="activities">
                  <li>
                    <span>President Student Council</span>
                    <span className="ongoing">Ongoing</span>
                  </li>
                  <li>
                    <span>Vice President Student Council</span>
                    <span className="pending">Pending</span>
                  </li>
                  <li>
                    <span>Secretary Student Council</span>
                    <span className="done">Completed</span>
                  </li>
                </ul>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;