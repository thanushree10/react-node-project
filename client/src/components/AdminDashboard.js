import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashbord.css";

const API = "http://localhost:5000";

const AdminDashboard = ({ adminName = "Admin", onLogout }) => {
  const [activeTab, setActiveTab] = useState("election");
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [newElectionTitle, setNewElectionTitle] = useState("");
  const [candidateForm, setCandidateForm] = useState({ label: "", name: "", symbol: "" });

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    fetchOngoingElection();
    fetchUsers();
  }, []);

  /* ================= FETCH ONGOING ELECTION ================= */
  const fetchOngoingElection = async () => {
    try {
      const res = await axios.get(`${API}/api/elections/ongoing`);
      setElection(res.data);

      if (res.data?.id) {
        fetchCandidates(res.data.id);
        fetchResults(res.data.id);
      } else {
        setCandidates([]);
        setResults([]);
      }
    } catch (err) {
      console.error("Fetch election error:", err);
    }
  };

  const fetchCandidates = async (electionId) => {
    try {
      const res = await axios.get(`${API}/api/candidates/${electionId}`);
      setCandidates(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/api/users`);
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResults = async (electionId) => {
    try {
      const res = await axios.get(`${API}/api/elections/${electionId}/results`);
      setResults(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= CREATE NEW ELECTION ================= */
  const createElection = async () => {
    if (!newElectionTitle) return alert("Enter election title");

    try {
      await axios.post(`${API}/api/elections`, {
        title: newElectionTitle,
        start_date: new Date(),
        end_date: new Date()
      });

      alert("New election created");
      setNewElectionTitle("");
      fetchOngoingElection();
    } catch (err) {
      console.error(err);
      alert("Failed to create election");
    }
  };

  /* ================= STOP ELECTION ================= */
  const stopElection = async () => {
    if (!election?.id) return;
    try {
      await axios.put(`${API}/api/elections/${election.id}/stop`);
      alert("Election stopped");
      fetchOngoingElection();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= PUBLISH RESULTS ================= */
  const publishResults = async () => {
    if (!election?.id) return;
    try {
      await axios.put(`${API}/api/elections/${election.id}/publish`);
      alert("Results published & candidates cleared");
      fetchOngoingElection();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= ADD CANDIDATE ================= */
  const addCandidate = async () => {
    if (!candidateForm.label || !candidateForm.name || !candidateForm.symbol) {
      return alert("Fill all fields");
    }

    try {
      await axios.post(`${API}/api/candidates`, {
        ...candidateForm,
        election_id: election.id
      });

      setCandidateForm({ label: "", name: "", symbol: "" });
      fetchCandidates(election.id);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCandidate = async (id) => {
    try {
      await axios.delete(`${API}/api/candidates/${id}`);
      fetchCandidates(election.id);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Admin Panel</h2>
        <button onClick={() => setActiveTab("election")}>🗳 Election</button>
        <button onClick={() => setActiveTab("candidates")}>👥 Candidates</button>
        <button onClick={() => setActiveTab("users")}>👤 Users</button>
        <button onClick={() => setActiveTab("results")}>📊 Results</button>
        <button className="logout" onClick={onLogout}>Logout</button>
      </aside>

      <main className="admin-content">
        <h1>Welcome {adminName}</h1>

        {/* ================= ELECTION ================= */}
        {activeTab === "election" && (
          <>
            <h3>Election Status</h3>
            {election ? (
              <>
                <p><b>Title:</b> {election.title}</p>
                <p><b>Status:</b> {election.status}</p>

                {(election.status === "ongoing" || election.status === "stopped") && (
                  <button onClick={stopElection}>Stop Election</button>
                )}

                {election.status === "completed" && (
                  <>
                    <h4>Create Next Election</h4>
                    <input
                      placeholder="New Election Title"
                      value={newElectionTitle}
                      onChange={(e) => setNewElectionTitle(e.target.value)}
                    />
                    <button onClick={createElection}>Create Election</button>
                  </>
                )}
              </>
            ) : (
              <>
                <p>No election found</p>
                <input
                  placeholder="Election Title"
                  value={newElectionTitle}
                  onChange={(e) => setNewElectionTitle(e.target.value)}
                />
                <button onClick={createElection}>Create Election</button>
              </>
            )}
          </>
        )}

        {/* ================= CANDIDATES ================= */}
        {activeTab === "candidates" && election && (
          <>
            <h3>Candidates for: {election.title}</h3>
            {(election.status === "ongoing" || election.status === "stopped") && (
              <>
                <input
                  placeholder="Label"
                  value={candidateForm.label}
                  onChange={(e) => setCandidateForm({ ...candidateForm, label: e.target.value })}
                />
                <input
                  placeholder="Name"
                  value={candidateForm.name}
                  onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                />
                <input
                  placeholder="Symbol"
                  value={candidateForm.symbol}
                  onChange={(e) => setCandidateForm({ ...candidateForm, symbol: e.target.value })}
                />
                <button onClick={addCandidate}>Add Candidate</button>
              </>
            )}

            {candidates.length > 0 ? (
              <ul>
                {candidates.map((c) => (
                  <li key={c.id}>
                    {c.label} - {c.name} ({c.symbol})
                    {(election.status === "ongoing" || election.status === "stopped") && (
                      <button
                        style={{ marginLeft: "10px" }}
                        onClick={() => deleteCandidate(c.id)}
                      >
                        Delete
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No candidates yet</p>
            )}
          </>
        )}

        {/* ================= USERS ================= */}
        {activeTab === "users" && (
          <>
            <h3>Registered Users</h3>
            <ul>
              {users.map((u) => (
                <li key={u.id}>
                  {u.first_name} {u.last_name} ({u.voter_id})
                </li>
              ))}
            </ul>
          </>
        )}

        {/* ================= RESULTS ================= */}
        {activeTab === "results" && election && (
          <>
            <h3>Results for: {election.title}</h3>
            {results.length > 0 ? (
              <ul>
                {results.map((r) => (
                  <li key={r.id}>{r.name} → {r.vote_count} votes</li>
                ))}
              </ul>
            ) : (
              <p>No results yet</p>
            )}

            {election.status === "stopped" && results.length > 0 && (
              <button onClick={publishResults}>Publish Results</button>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;