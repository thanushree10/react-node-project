require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

/* ================= DATABASE ================= */
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "voting_db4",
  password: "2406",
  port: 5432
});
pool.connect()
  .then(() => {
    console.log("Connected to PostgreSQL");
  })
  .catch((err) => {
    console.error("PostgreSQL connection error:", err.message);
  });


/* ================= MAIL CONFIG ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

/* ================= OTP STORE ================= */
let otpStore = {};

/* ================= TEST ================= */
app.get("/", (req, res) => {
  res.send("Server running");
});

/* ================= SEND OTP ================= */
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 35 * 1000
  };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Online Voting OTP",
      text: `Your OTP is ${otp}. It is valid for 35 seconds.`
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Email failed" });
  }
});

/* ================= VERIFY OTP ================= */
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) return res.status(400).json({ message: "OTP not sent" });
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ message: "OTP expired" });
  }
  if (parseInt(otp) !== record.otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  res.json({ message: "OTP verified" });
});

/* ================= USER SIGNUP ================= */
app.post("/signup", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      voter_id,
      aadhar_number,
      age,
      dob,
       department,
  semester,
      password,
      otp
    } = req.body;

    const record = otpStore[email];
    if (!record || Date.now() > record.expiresAt || parseInt(otp) !== record.otp) {
      return res.status(400).json({ message: "OTP verification failed" });
    }

    delete otpStore[email];
    const hashedPassword = await bcrypt.hash(password, 10);

   const result = await pool.query(
  `INSERT INTO users
  (
    first_name,
    last_name,
    email,
    voter_id,
    aadhar_number,
    age,
    dob,
    department,
    semester,
    password
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
  RETURNING id, first_name, email`,
  [
    first_name,
    last_name,
    email,
    voter_id,
    aadhar_number,
    age,
    dob,
    department,
    semester,
    hashedPassword
  ]
);


    res.status(201).json({ message: "Registration successful", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LOGIN (USER ONLY) ================= */
app.post("/login", async (req, res) => {
  try {
    const { voter_id, password } = req.body;

    // 1️⃣ Try to find in USERS table only
    const result = await pool.query(
      "SELECT * FROM users WHERE voter_id=$1",
      [voter_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // 2️⃣ Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Incorrect password" });

    // 3️⃣ Return user details
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        voter_id: user.voter_id,
        department: user.department,
        semester: user.semester,
        role: "user"
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ========== FORGOT PASSWORD RESET ========== */
app.put("/forgot-password/reset", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // 1️⃣ Check OTP record
    const record = otpStore[email];

    if (!record) {
      return res.status(400).json({ message: "OTP not sent" });
    }

    if (Date.now() > record.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: "OTP expired" });
    }

    if (parseInt(otp) !== record.otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // 2️⃣ Check if user exists
    const user = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4️⃣ Update password
    await pool.query(
      "UPDATE users SET password=$1 WHERE email=$2",
      [hashedPassword, email]
    );

    // 5️⃣ Delete OTP after success
    delete otpStore[email];

    res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating password"
    });
  }
});
/* ================= ADMIN LOGIN ================= */
app.post("/admin/login", async (req, res) => {
  try {
    const { voter_id, password } = req.body;

    if (!voter_id || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await pool.query(
      "SELECT * FROM admins WHERE admin_number=$1",
      [voter_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = result.rows[0];

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    res.json({
      message: "Login successful",
      admin: {
        id: admin.id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        admin_number: admin.admin_number,
        role: "admin"
      }
    });

  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error while login admin" });
  }
});

/* ========== USER UPDATE NAME ========== */
app.put("/user/profile/name", async (req, res) => {
  const { id, first_name, last_name } = req.body;

  const result = await pool.query(
    `UPDATE users
     SET first_name=$1, last_name=$2
     WHERE id=$3
     RETURNING first_name, last_name`,
    [first_name, last_name, id]
  );

  res.json({ user: result.rows[0] });
});


/* ========== USER UPDATE EMAIL ========== */
app.put("/user/profile/email", async (req, res) => {
  const { id, email } = req.body;

  const result = await pool.query(
    `UPDATE users SET email=$1 WHERE id=$2 RETURNING email`,
    [email, id]
  );

  res.json({ user: result.rows[0] });
});

/* ========== USER UPDATE PASSWORD ========== */
app.put("/user/:id/password", async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const result = await pool.query(
      "SELECT password FROM users WHERE id=$1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const match = await bcrypt.compare(
      currentPassword,
      result.rows[0].password
    );

    if (!match) {
      return res.json({ success: false, message: "Wrong current password" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password=$1 WHERE id=$2",
      [hashed, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



/* ================= ADMIN SIGNUP (ADDED) ================= */
// Admin Signup
app.post("/admin/signup", async (req, res) => {
  const { first_name, last_name, email, admin_number, password, otp } = req.body;

  // Only allow specific admin numbers
  const allowedAdmins = ["ADM1001", "ADM1002", "ADM1003", "ADM1004"];
  if (!allowedAdmins.includes(admin_number)) {
    return res.status(400).json({ message: "Invalid Admin Number" });
  }

  // Optional: check if email/admin_number already exists
  try {
    const existing = await pool.query(
      "SELECT * FROM admins WHERE email=$1 OR admin_number=$2",
      [email, admin_number]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into database
    const result = await pool.query(
      `INSERT INTO admins (first_name, last_name, email, admin_number, password, otp)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [first_name, last_name, email, admin_number, hashedPassword, otp || null]
    );

    res.status(201).json({ admin: result.rows[0], message: "Admin registered successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

/* ================= PROFILE FETCH ROUTES ================= */

/* USER PROFILE */
app.get("/user/profile/:id", async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    "SELECT first_name, last_name, email FROM users WHERE id=$1",
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(result.rows[0]);
});

/* ADMIN PROFILE */
app.get("/admin/profile/:id", async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    "SELECT first_name, last_name, email FROM admins WHERE id=$1",
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Admin not found" });
  }

  res.json(result.rows[0]);
});

/* ================= CAST VOTE ================= */
app.post("/api/vote", async (req, res) => {
  const { userId, electionId, candidateId } = req.body;

  try {
    // 1️⃣ Check election
    const election = await pool.query(
      "SELECT status FROM elections WHERE id=$1",
      [electionId]
    );

    if (election.rows.length === 0) {
      return res.status(404).json({ message: "Election not found" });
    }

    if (election.rows[0].status !== "ongoing") {
      return res.status(400).json({ message: "Voting closed" });
    }

    // 2️⃣ Check if already voted
    const alreadyVoted = await pool.query(
      "SELECT 1 FROM votes WHERE user_id=$1 AND election_id=$2",
      [userId, electionId]
    );

    if (alreadyVoted.rows.length > 0) {
      return res.status(409).json({ message: "You already voted" });

    }

    // 3️⃣ Insert vote
    await pool.query(
      `INSERT INTO votes (user_id, election_id, candidate_id, voted_at)
       VALUES ($1,$2,$3,NOW())`,
      [userId, electionId, candidateId]
    );

    
  // 4️⃣ Update live count
await pool.query(
  "UPDATE candidates SET vote_count = vote_count + 1 WHERE id=$1",
  [candidateId]
);

// 5️⃣ Fetch voted candidate name + time
const info = await pool.query(
  `SELECT c.name, v.voted_at
   FROM votes v
   JOIN candidates c ON c.id = v.candidate_id
   WHERE v.user_id=$1 AND v.election_id=$2`,
  [userId, electionId]
);

res.json({
  message: "Vote cast successfully",
  candidateName: info.rows[0].name,
  votedAt: info.rows[0].voted_at
});

  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET CANDIDATES BY ELECTION ================= */
app.get("/api/candidates/:electionId", async (req, res) => {
  const { electionId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM candidates WHERE election_id = $1",
      [electionId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch candidates error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* ================= GET ONGOING ELECTION ================= */
app.get("/api/elections/ongoing", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM elections WHERE TRIM(status) = 'ongoing' ORDER BY id DESC LIMIT 1"
    );

    if (result.rows.length === 0) return res.json(null);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ===== CHECK USER VOTE STATUS ===== */
app.get("/api/vote/status/:userId/:electionId", async (req, res) => {
  const { userId, electionId } = req.params;

  const result = await pool.query(
    `SELECT c.name, v.voted_at
     FROM votes v
     JOIN candidates c ON c.id = v.candidate_id
     WHERE v.user_id=$1 AND v.election_id=$2`,
    [userId, electionId]
  );

  if (result.rows.length === 0) {
    return res.json({ voted: false });
  }

  res.json({
    voted: true,
    candidateName: result.rows[0].name,
    votedAt: result.rows[0].voted_at
  });
});
/* ================= GET ELECTION BY ID ================= */
app.get("/api/elections/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM elections WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Election not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Fetch election by ID error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ================= LIVE RESULTS ================= */
app.get("/api/elections/:id/live-results", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        c.id,
        c.name,
        COUNT(v.id) AS vote_count
      FROM candidates c
      LEFT JOIN votes v 
        ON c.id = v.candidate_id
        AND v.election_id = $1
      WHERE c.election_id = $1
      GROUP BY c.id, c.name
      ORDER BY vote_count DESC
      `,
      [id]
    );

    res.json(
      result.rows.map(r => ({
        id: r.id,
        name: r.name,
        vote_count: Number(r.vote_count)
      }))
    );

  } catch (err) {
    console.error("Live results error:", err);
    res.status(500).json({ message: "Failed to load live results" });
  }
});


/* ================= ADD CANDIDATE ================= */
app.post("/api/candidates", async (req, res) => {
  try {
    const { label, name, symbol, election_id } = req.body;

    if (!label || !name || !election_id) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await pool.query(
      `INSERT INTO candidates (label, name, symbol, election_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [label, name, symbol, election_id]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("Add candidate error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ================= DELETE CANDIDATE ================= */
app.delete("/api/candidates/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM candidates WHERE id = $1",
      [id]
    );

    res.json({ message: "Candidate deleted successfully" });

  } catch (err) {
    console.error("Delete candidate error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ================= UPDATE ELECTION STATUS ================= */
app.put("/api/elections/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.query(
      "UPDATE elections SET status=$1 WHERE id=$2",
      [status, id]
    );

    res.json({ message: "Election stopped successfully" });

  } catch (err) {
    console.error("Stop election error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= STOP ELECTION ================= */
app.put("/api/elections/:id/publish", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `UPDATE elections 
       SET status='published',
           published_at = NOW()
       WHERE id=$1`,
      [id]
    );

    res.json({
      message: "Results published successfully"
    });

  } catch (err) {
    console.error("Publish results error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* ================= GET ALL USERS (ADMIN) ================= */
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, voter_id, department, semester
       FROM users
       ORDER BY id`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= CREATE ELECTION ================= */
app.post("/api/elections", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // 🔥 Stop ALL previous elections (ongoing OR published)
    await pool.query(
      "UPDATE elections SET status='completed' WHERE status IN ('ongoing','published')"
    );

    // ✅ Create new ongoing election
    const result = await pool.query(
      `INSERT INTO elections (title, status, created_at)
       VALUES ($1, 'ongoing', NOW())
       RETURNING *`,
      [title]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("Create election error:", err);
    res.status(500).json({ message: "Failed to create election" });
  }
});

/* ================= GET LATEST PUBLISHED ELECTION ================= */
app.get("/api/elections/latest-published", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM elections WHERE status='published' ORDER BY published_at DESC LIMIT 1"
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Fetch latest published election error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ================= GET WINNER ================= */
app.get("/api/elections/:id/winner", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        c.id,
        c.name,
        COUNT(v.id) AS vote_count
      FROM candidates c
      LEFT JOIN votes v 
        ON c.id = v.candidate_id
        AND v.election_id = $1
      WHERE c.election_id = $1
      GROUP BY c.id, c.name
      ORDER BY vote_count DESC
      LIMIT 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json({
      winnerName: result.rows[0].name,
      votes: Number(result.rows[0].vote_count)
    });

  } catch (err) {
    console.error("Winner fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ================= GET ONGOING ELECTION WITH CANDIDATES ================= */
app.get("/api/elections/ongoing-with-candidates", async (req, res) => {
  try {
    // 1️⃣ Get latest ongoing election
    const electionResult = await pool.query(
      "SELECT * FROM elections WHERE status='ongoing' ORDER BY id DESC LIMIT 1"
    );

    if (electionResult.rows.length === 0) {
      return res.json(null);
    }

    const election = electionResult.rows[0];

    // 2️⃣ Get its candidates
    const candidatesResult = await pool.query(
      "SELECT * FROM candidates WHERE election_id=$1 ORDER BY id",
      [election.id]
    );

    res.json({
      ...election,
      candidates: candidatesResult.rows
    });

  } catch (err) {
    console.error("Ongoing election fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ================= SERVER ================= */
app.listen(process.env.PORT || 5000, () => {
  console.log("🔥 NEW SERVER CONNECTED TO voting_db4 🔥");

});