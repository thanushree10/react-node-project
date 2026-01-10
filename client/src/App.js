import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("splash");
  const [cardState, setCardState] = useState("login-state");
  const [otpTimer, setOtpTimer] = useState(0);

  const [login, setLogin] = useState({
    name: "",
    email: "",
    voterId: "",
    password: "",
    otp: ""
  });

  const [register, setRegister] = useState({
    fname: "",
    lname: "",
    email: "",
    voterId: "",
    aadhar: "",
    age: "",
    dob: "",
    address: "",
    password: "",
    confirm: "",
    otp: ""
  });

  /* ================= SPLASH TIMER ================= */
  useEffect(() => {
    if (page === "splash") {
      setTimeout(() => setPage("login"), 4000);
    }
  }, [page]);

  /* ================= OTP TIMER ================= */
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setInterval(() => {
        setOtpTimer((t) => t - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpTimer]);

  /* ================= SEND OTP ================= */
  const sendOtp = async (email) => {
    if (!email) {
      alert("Please enter email");
      return;
    }
    setOtpTimer(35);
    alert("OTP sent (demo)");
  };

  /* ================= LOGIN ================= */
  const handleLogin = () => {
    if (otpTimer === 0) {
      alert("OTP expired");
      return;
    }
    alert("Login successful ✅");
  };

  /* ================= REGISTER ================= */
  const handleRegister = () => {
    if (register.password !== register.confirm) {
      alert("Passwords do not match");
      return;
    }
    if (otpTimer === 0) {
      alert("OTP expired");
      return;
    }
    alert("Signup successful ✅");
    setPage("login");
  };

  /* ================= SPLASH ================= */
  if (page === "splash") {
    return (
      <div className="splashWrapper">
        <img src="/images/logo.png" className="rotateIn" alt="" />
        
        <h1 className="blinkTitle">Online E-Voting System</h1>
        <p className="collegeText">JSS Polytechnic For Women</p>

        <div className="loading-dots">
          <span>.</span><span>.</span><span>.</span>
        </div>

        <h3 className="teamHeading">Team Members</h3>
        <p className="teamNames">Thanushree, Pavana, Upanvitha, Sneha</p>
      </div>
    );
  }

  /* ================= LOGIN ================= */
  if (page === "login") {
    return (
      <div className="auth-container">
        <div className={`auth-card ${cardState}`}>
          <div className="auth-left">
            <h1>Welcome Back</h1>
            <p>Login to cast your vote securely</p>
            <img src="/images/logo.png" className="center-logo" alt="" />
            
          </div>

          <div className="auth-right">
            <h2>Login</h2>

            <input placeholder="Full Name" />
            <input placeholder="Email" />
            <input placeholder="Voter ID" />
            <input type="password" placeholder="Password" />

            <div className="otpRow">
              <input placeholder="Enter OTP" />
              <button
                className="otpBtn"
                disabled={otpTimer > 0}
                onClick={() => sendOtp(login.email)}
              >
                {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Send OTP"}
              </button>
            </div>

            <div className="button-group">
              <button className="primary-btn" onClick={handleLogin}>
                Sign In
              </button>
              <button
                className="outline-btn"
                onClick={() => {
                  setCardState("signup-state");
                  setTimeout(() => setPage("register"), 600);
                }}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================= REGISTER ================= */
  return (
    <div className="auth-container">
      <div className={`auth-card ${cardState}`}>
        <div className="auth-left">
          <h1>Voter Registration</h1>
          <p>Register to vote online</p>
          <img src="/images/logo.png" className="center-logo" alt="" />
          
        </div>

        <div className="auth-right">
          <h2>Create Account</h2>

          <input placeholder="First Name" />
          <input placeholder="Last Name" />
          <input placeholder="Email" />
          <input placeholder="Voter ID" />
          <input placeholder="Aadhaar Number" />
          <input placeholder="Age" />
          <input type="date" />
          <input placeholder="Address" />
          <input type="password" placeholder="Password" />
          <input type="password" placeholder="Confirm Password" />

          <div className="otpRow">
            <input placeholder="Enter OTP" />
            <button
              className="otpBtn"
              disabled={otpTimer > 0}
              onClick={() => sendOtp(register.email)}
            >
              {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Send OTP"}
            </button>
          </div>

          <div className="button-group">
            <button className="primary-btn" onClick={handleRegister}>
              Sign Up
            </button>
            <button
              className="outline-btn"
              onClick={() => {
                setCardState("login-state");
                setTimeout(() => setPage("login"), 600);
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
