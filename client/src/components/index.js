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
  database: "voting_db2",
  password: "2406",
  port: 5432
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

/* ================= LOGIN (USER + ADMIN) ================= */
app.post("/login", async (req, res) => {
  try {
    const { voter_id, password } = req.body;

    // 1️⃣ Try to find in USERS table
    let result = await pool.query(
      "SELECT *, 'user' AS role FROM users WHERE voter_id = $1",
      [voter_id]
    );

    let account = null;

    if (result.rows.length > 0) {
      account = result.rows[0];
    } else {
      // 2️⃣ If not in users, try ADMINS table
      result = await pool.query(
        "SELECT *, 'admin' AS role FROM admins WHERE voter_id = $1",
        [voter_id]
      );

      if (result.rows.length > 0) {
        account = result.rows[0];
      }
    }

    // 3️⃣ If still not found
    if (!account) {
      return res.status(401).json({ message: "User not found" });
    }

    // 4️⃣ Compare password
    const match = await bcrypt.compare(password, account.password);
    if (!match) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // 5️⃣ Return details depending on role
    if (account.role === "user") {
      res.json({
        message: "Login successful",
        user: {
          id: account.id,
          first_name: account.first_name,
          last_name: account.last_name,
          email: account.email,
          voter_id: account.voter_id,
          department: account.department,
          semester: account.semester,
          role: "user"
        }
      });
    } else if (account.role === "admin") {
      res.json({
        message: "Login successful",
        admin: {
          id: account.id,
          first_name: account.first_name,
          last_name: account.last_name,
          email: account.email,
          voter_id: account.voter_id,
          dob: account.dob,
          age: account.age,
          role: "admin"
        }
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
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


/* ========== ADMIN UPDATE NAME ========== */
app.put("/admin/profile/name", async (req, res) => {
  const { id, first_name, last_name } = req.body;

  const result = await pool.query(
    `UPDATE admins
     SET first_name=$1, last_name=$2
     WHERE id=$3
     RETURNING first_name, last_name`,
    [first_name, last_name, id]
  );

  res.json({ admin: result.rows[0] });
});


/* ========== ADMIN UPDATE EMAIL ========== */
app.put("/admin/profile/email", async (req, res) => {
  const { id, email } = req.body;

  const result = await pool.query(
    `UPDATE admins SET email=$1 WHERE id=$2 RETURNING email`,
    [email, id]
  );

  res.json({ admin: result.rows[0] });
});


/* ========== ADMIN UPDATE PASSWORD ========== */
app.put("/admin/:id/password", async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const result = await pool.query(
      "SELECT password FROM admins WHERE id=$1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Admin not found" });
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
      "UPDATE admins SET password=$1 WHERE id=$2",
      [hashed, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


/* ================= ADMIN SIGNUP (ADDED) ================= */
app.post("/admin/signup", async (req, res) => {
  try {
    const { first_name, last_name, email, voter_id, dob, age, password, otp } = req.body;

    const record = otpStore[email];
    if (!record || Date.now() > record.expiresAt || parseInt(otp) !== record.otp) {
      return res.status(400).json({ message: "OTP verification failed" });
    }

    delete otpStore[email];
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO admins
      (first_name, last_name, email, voter_id, dob, age, password)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, email`,
      [first_name, last_name, email, voter_id, dob, age, hashedPassword]
    );

    res.status(201).json({ message: "Admin registered", admin: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
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

/* ================= SERVER ================= */
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port 5000");
});