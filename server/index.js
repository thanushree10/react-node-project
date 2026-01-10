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
  database: "voting_db",
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
  otpStore[email] = otp;

  console.log("OTP:", otp);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Online Voting OTP",
      text: `Your OTP is ${otp}. It is valid for 35 seconds.`
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Email failed" });
  }
});

/* ================= VERIFY OTP ================= */
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email]) {
    return res.status(400).json({ message: "OTP not sent" });
  }

  if (parseInt(otp) !== otpStore[email]) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  res.json({ message: "OTP verified" });
});

/* ================= SIGNUP ================= */
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
      address,
      password,
      otp
    } = req.body;

    if (!otpStore[email]) {
      return res.status(400).json({ message: "OTP verification required" });
    }

    if (parseInt(otp) !== otpStore[email]) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    delete otpStore[email];

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
      (first_name, last_name, email, voter_id, aadhar_number, age, dob, address, password_hash)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING user_id, first_name, last_name, email, voter_id, age, dob, address`,
      [
        first_name,
        last_name,
        email,
        voter_id,
        aadhar_number,
        age,
        dob,
        address,
        hashedPassword
      ]
    );

    res.status(201).json({
      message: "Registration successful",
      user: result.rows[0]
    });

  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "User already exists" });
    }

    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= SERVER ================= */
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port 5000");
});