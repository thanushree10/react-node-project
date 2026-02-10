// CandidatesVote.js
import React, { useState } from "react";
import "./CandidatesVote.css";

// 🔹 Candidate data (6 candidates)
const candidates = [
  {
    id: 1,
    label: "Candidate A",
    name: "Rahul Sharma",
    symbol: "🦁",
    confidence: 8.6,
    reasons: [
      { title: "Leadership", percent: 42 },
      { title: "Experience", percent: 31 }
    ]
  },
  {
    id: 2,
    label: "Candidate B",
    name: "Anita Verma",
    symbol: "🌸",
    confidence: 8.2,
    reasons: [
      { title: "Public Service", percent: 45 },
      { title: "Transparency", percent: 29 }
    ]
  },
  {
    id: 3,
    label: "Candidate C",
    name: "Suresh Kumar",
    symbol: "🌞",
    confidence: 7.9,
    reasons: [
      { title: "Innovation", percent: 38 },
      { title: "Youth Support", percent: 34 }
    ]
  },
  {
    id: 4,
    label: "Candidate D",
    name: "Neha Singh",
    symbol: "🌳",
    confidence: 8.4,
    reasons: [
      { title: "Environmental Focus", percent: 41 },
      { title: "Community Work", percent: 33 }
    ]
  },
  {
    id: 5,
    label: "Candidate E",
    name: "Amit Patel",
    symbol: "🚲",
    confidence: 7.7,
    reasons: [
      { title: "Infrastructure", percent: 39 },
      { title: "Economic Growth", percent: 28 }
    ]
  },
  {
    id: 6,
    label: "Candidate F",
    name: "Pooja Nair",
    symbol: "✋",
    confidence: 8.8,
    reasons: [
      { title: "Women Empowerment", percent: 46 },
      { title: "Education Reform", percent: 32 }
    ]
  }
];

// 🔥 receive onVote from Dashboard
const CandidatesVote = ({ onVote }) => {

  // 🔒 ONE PERSON – ONE VOTE
  const [hasVoted, setHasVoted] = useState(
    localStorage.getItem("hasVoted") === "true"
  );

  // ➕ ADDED: voted candidate & time
  const [votedCandidate, setVotedCandidate] = useState(
    localStorage.getItem("votedCandidate") || ""
  );
  const [votedTime, setVotedTime] = useState(
    localStorage.getItem("votedTime") || ""
  );

  const handleVote = (index, name) => {
    if (hasVoted) {
      alert("⚠️ You have already voted. You cannot vote again.");
      return;
    }

   if (onVote) {
  const voteDetails = {
    candidate: name,
    time: new Date().toLocaleString()
  };
  onVote(index, voteDetails); // send info to Dashboard
}


    const time = new Date().toLocaleString();

    setHasVoted(true);
    setVotedCandidate(name);
    setVotedTime(time);

    localStorage.setItem("hasVoted", "true");
    localStorage.setItem("votedCandidate", name);
    localStorage.setItem("votedTime", time);

    alert(`✅ Your vote has been submitted for ${name}`);
  };

  return (
    <div className="vote-page">
      <h1>🗳️ Cast Your Vote</h1>
      <p>Select one candidate carefully</p>

      {/* ➕ ADDED: show vote info AFTER vote */}
      {hasVoted && (
        <div className="vote-info">
          <p>✅ You voted for: <b>{votedCandidate}</b></p>
          <p>⏰ Time of vote: {votedTime}</p>
        </div>
      )}

      <div className="candidates-grid">
        {candidates.map((candidate, index) => (
          <div className="candidate-card" key={candidate.id}>

            <div className="candidate-header">
              <span className="symbol">{candidate.symbol}</span>
              <span className="candidate-label">{candidate.label}</span>
            </div>

            <h3>{candidate.name}</h3>

            <p className="confidence">
              ⭐ Avg Confidence: <b>{candidate.confidence} / 10</b>
            </p>

            <div className="reasons">
              <p>📌 Top Reasons:</p>
              <ul>
                {candidate.reasons.map((reason, i) => (
                  <li key={i}>
                    {reason.title} ({reason.percent}%)
                  </li>
                ))}
              </ul>
            </div>

            <button
              className="vote-btn"
              disabled={hasVoted}
              onClick={() => handleVote(index, candidate.name)}
            >
              {hasVoted ? "Voted" : "Vote"}
            </button>

          </div>
        ))}
      </div>
    </div>
  );
};

export default CandidatesVote;