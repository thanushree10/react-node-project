import axios from "axios";
import { useEffect, useState } from "react";
import "./CandidatesVote.css";

const API = "http://localhost:5000";

const CandidatesVote = ({ onBack, onVoted, isAdmin = false }) => {
  const [candidates, setCandidates] = useState([]);
  const [election, setElection] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        if (!isAdmin && !userId) {
          setError("User not logged in");
          return;
        }

        const electionRes = await axios.get(
          isAdmin
            ? `${API}/api/elections/latest`
            : `${API}/api/elections/ongoing`
        );

        let electionData = electionRes.data;
        if (Array.isArray(electionData)) {
          electionData = electionData.length > 0 ? electionData[0] : null;
        }

        if (!electionData || !electionData.id) {
          setError("No election available");
          return;
        }

        setElection(electionData);

        if (!isAdmin) {
          const statusRes = await axios.get(
            `${API}/api/vote/status/${userId}/${electionData.id}`
          );

          if (statusRes.data?.voted) {
            setHasVoted(true);
            if (onVoted) {
              onVoted({
                candidate: statusRes.data.candidateName,
                time: new Date(statusRes.data.votedAt).toLocaleString()
              });
            }
          }
        }

        const candidatesRes = await axios.get(
          `${API}/api/candidates/${electionData.id}`
        );
        setCandidates(Array.isArray(candidatesRes.data) ? candidatesRes.data : []);
      } catch (err) {
        console.error("Load error:", err);
        setError(err.response?.data?.message || "Failed to load election data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, isAdmin, onVoted]);

  const handleVote = async (candidateId) => {
    if (!election) {
      alert("No active election found");
      return;
    }

    try {
      const res = await axios.post(`${API}/api/vote`, {
        userId,
        electionId: election.id,
        candidateId
      });

      setHasVoted(true);

      if (onVoted) {
        onVoted({
          candidate: res.data.candidateName,
          time: new Date(res.data.votedAt).toLocaleString()
        });
      }
    } catch (err) {
      if (err.response?.status === 409) {
        alert("You already voted");
      } else {
        alert("Vote failed. Please try again.");
      }
    }
  };

  if (loading) return <p className="loading">Loading election...</p>;

  if (error) {
    return (
      <div className="vote-page">
        <p className="error">{error}</p>
        <button className="back-btn" onClick={onBack}>Back</button>
      </div>
    );
  }

  return (
    <div className="vote-page">
      <h2>{hasVoted ? "🗳️ You have already voted" : "Cast Your Vote"}</h2>

      {(!hasVoted || isAdmin) && (
        <>
          <h3>{election?.title}</h3>

          {candidates.length === 0 ? (
            <p>No candidates available</p>
          ) : (
            <div className="candidates-grid">
              {candidates.map((c) => (
                <div key={c.id} className="candidate-card">
                  <div className="candidate-header">
                    <span className="candidate-label">{c.label}</span>
                  </div>
                  <div className="symbol">{c.symbol}</div>
                  <h3>{c.name}</h3>
                  {!isAdmin && (
                    <button
                      className="vote-btn"
                      onClick={() => handleVote(c.id)}
                    >
                      Vote
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button className="back-btn" onClick={onBack}>Back to Dashboard</button>
    </div>
  );
};

export default CandidatesVote;