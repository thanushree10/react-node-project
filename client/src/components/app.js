import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import "../App.css";
import "../WelcomeMessage.css";
import Dashboard1 from "./components/Dashboard1";
import SplashScreen from "./components/SplashScreen";
import CandidatesVote from "./components/CandidatesVote";
import AdminDashboard from "./components/AdminDashbord";
const API_URL = "http://localhost:5000";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showSplash2Only, setShowSplash2Only] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);
  const [userName, setUserName] = useState("");
  const [userGender, setUserGender] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  // ERROR MESSAGE STATES
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [otpError, setOtpError] = useState("");
  
  // SUCCESS MESSAGE STATES
  const [loginSuccess, setLoginSuccess] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  // LOGIN STATES
  const [loginVoterId, setLoginVoterId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  
  // FORGOT PASSWORD STATES
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");

  // REGISTER STATES
  const [registerName, setRegisterName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerDepartment, setRegisterDepartment] = useState("");
  const [registerSemester, setRegisterSemester] = useState("");
  const [registerAge, setRegisterAge] = useState("");
  const [registerDob, setRegisterDob] = useState("");
  const [registerVoterId, setRegisterVoterId] = useState("");
  const [registerAadhar, setRegisterAadhar] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerOtp, setRegisterOtp] = useState("");
  const [registerRole, setRegisterRole] = useState("user"); // user | admin


  /* ===== SPLASH FLOW ===== */
  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowSplash2Only(false);
  };

  /* ===== OTP TIMER ===== */
  useEffect(() => {
    if (otpTimer > 0) {
      const t = setInterval(() => setOtpTimer(v => v - 1), 1000);
      return () => clearInterval(t);
    }
  }, [otpTimer]);

  useEffect(() => {
  if (registerRole === "admin") {
    setRegisterDepartment("");
    setRegisterSemester("");
    setRegisterAadhar("");
  }
}, [registerRole]);


  /* ===== SEND OTP ===== */
  const handleSendOtp = async (email) => {
  setOtpError("");

  if (!email) {
    setOtpError("Please enter email before sending OTP");
    return;
  }
  if (!registerName) {
    setOtpError("Please enter your first name");
    return;
  }
  if (!registerLastName) {
    setOtpError("Please enter your last name");
    return;
  }

  // ✅ USER-ONLY validation
  if (registerRole === "user") {
    if (!registerDepartment) {
      setOtpError("Please enter your department");
      return;
    }

    if (!registerSemester) {
      setOtpError("Please select your semester");
      return;
    }

    if (!registerAadhar) {
      setOtpError("Please enter your Aadhar number");
      return;
    }
  }

  // ✅ COMMON validation (ADMIN + USER)
  if (!registerAge || parseInt(registerAge) < 18) {
    setOtpError("Please enter a valid age (18+)");
    return;
  }

  if (!registerDob) {
    setOtpError("Please enter your date of birth");
    return;
  }

  if (!registerVoterId) {
    setOtpError("Please enter your Voter ID");
    return;
  }

  if (!registerPassword) {
    setOtpError("Please enter a password");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `${email}@gmail.com` })
    });

    const data = await res.json();
    if (res.ok) {
      setOtpError(data.message);
      setOtpTimer(35);
    } else {
      setOtpError(data.message);
    }
  } catch {
    setOtpError("Server error while sending OTP");
  }
};


  /* ===== LOGIN ===== */
const handleLogin = async () => {
  setLoginError("");
  if (!loginVoterId) {
    setLoginError("Please enter Voter ID");
    return;
  }
  if (!loginPassword) {
    setLoginError("Please enter Password");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voter_id: loginVoterId,
        password: loginPassword
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setLoginError(data.message || "Login failed");
      return;
    }

    // Handle both user and admin responses
    let userData = data.user || data.admin || data.data || data;
    let role = data.user ? "user" : data.admin ? "admin" : "user";

    // Store info in localStorage
    localStorage.setItem("userId", userData.id || userData.user_id || userData.voter_id);
    localStorage.setItem(
      "userName",
      userData.first_name
        ? `${userData.first_name} ${userData.last_name || ""}`
        : "User"
    );
    localStorage.setItem("role", role);

    // Update state
    const firstName = userData.first_name || userData.name || "User";
    const lastName = userData.last_name || "";
    setUserName(lastName ? `${firstName} ${lastName}` : firstName);

    setLoginSuccess("Login successful!");
    setTimeout(() => {
      setShowDashboard(true);
      setLoginSuccess("");
    }, 1500);

  } catch (err) {
    console.error("Login error:", err);
    setLoginError("Server error during login");
  }
};


  /* ===== REGISTER ===== */
  const handleRegister = async () => {
    setRegisterError("");
    if (!registerName) {
      setRegisterError("Please fill username");
      return;
    }
    if (!registerEmail) {
      setRegisterError("Please enter email");
      return;
    }
    if (!registerOtp) {
      setRegisterError("Please enter OTP");
      return;
    }

    try {
     const res = await fetch(
  registerRole === "admin"
    ? `${API_URL}/admin/signup`
    : `${API_URL}/signup`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      registerRole === "admin"
        ? {
            first_name: registerName,
            last_name: registerLastName,
            email: `${registerEmail}@gmail.com`,
            voter_id: registerVoterId,
            age: registerAge,
            dob: registerDob,
            password: registerPassword,
            otp: registerOtp
          }
        : {
            first_name: registerName,
            last_name: registerLastName,
            email: `${registerEmail}@gmail.com`,
            voter_id: registerVoterId,
            aadhar_number: registerAadhar,
            age: registerAge,
            dob: registerDob,
            department: registerDepartment,
            semester: registerSemester,
            password: registerPassword,
            otp: registerOtp
          }
    )
  }
);


      const data = await res.json();
      if (res.ok) {
        setUserName(registerName);
        setRegisterSuccess("Registration successful!");
        setTimeout(() => {
          setShowDashboard(true);
          setRegisterSuccess("");
        }, 1500);
      } else {
        setRegisterError(data.message);
      }
    } catch {
      setRegisterError("Signup failed");
    }
  };

  /* ===== SPLASH SCREEN ===== */
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} showSplash2Only={showSplash2Only} />;
  }

  /* ===== DASHBOARD ===== */
if (showDashboard) {
  const role = localStorage.getItem("role");

  return role === "admin" ? (
    <AdminDashboard
      userName={userName}
      onLogout={() => {
        localStorage.clear();
        setShowSplash(true);
        setShowSplash2Only(true);
        setShowDashboard(false);
        setUserName("");
        setUserGender("");
      }}
    />
  ) : (
    <Dashboard
      userName={userName}
      userGender={userGender}
      onLogout={() => {
        localStorage.clear();
        setShowSplash(true);
        setShowSplash2Only(true);
        setShowDashboard(false);
        setUserName("");
        setUserGender("");
      }}
    />
  );
}



  /* ===== AUTH SCREENS ===== */
  return (
    <div className="auth-wrapper">
      <div className={`auth-box ${isSignup ? "signup-active" : ""}`}>

        <div className="form-panel">

  {/* HEADER (ONLY ONCE) */}
  <div className="form-header">
    {!isSignup ? <h2>Login</h2> : <h2>Register</h2>}
  </div>

  {/* ROLE SELECTOR – directly below Register */}
  {isSignup && (
    <div className="role-selector">
      <label>
        <input
          type="radio"
          name="role"
          value="user"
          checked={registerRole === "user"}
          onChange={() => setRegisterRole("user")}
        />
        User
      </label>

      <label>
        <input
          type="radio"
          name="role"
          value="admin"
          checked={registerRole === "admin"}
          onChange={() => setRegisterRole("admin")}
        />
        Admin
      </label>
    </div>
  )}

          {!isSignup ? (
            <>
              <input placeholder="Voter ID" value={loginVoterId} onChange={e => setLoginVoterId(e.target.value)} />
              <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />

              <div className="forgot-password-link">
                <span onClick={() => setShowForgotPassword(true)}>Forgot Password?</span>
              </div>

              {loginError && <div className="error-message">{loginError}</div>}
              {loginSuccess && <div className="success-message">{loginSuccess}</div>}

              <button className="main-btn" onClick={handleLogin}>Log in</button>
            </>
          ) : (
            <>
              <div className="row">
                <input placeholder="Firstname" value={registerName} onChange={e => setRegisterName(e.target.value)} />
                <input placeholder="Lastname" value={registerLastName} onChange={e => setRegisterLastName(e.target.value)} />
              </div>

              <div className="email-input-wrapper">
                <input 
                  placeholder="Email" 
                  value={registerEmail} 
                  onChange={e => setRegisterEmail(e.target.value)} 
                  className="email-input"
                />
                <span className="email-suffix">@gmail.com</span>
              </div>
              {registerRole === "user" && (
  <div className="row">
    <input
      placeholder="Department"
      value={registerDepartment}
      onChange={e => setRegisterDepartment(e.target.value)}
    />

    <select
      value={registerSemester}
      onChange={e => setRegisterSemester(e.target.value)}
    >
      <option value="">Select Semester</option>
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
    </select>
  </div>
)}


              <div className="row">
                <input 
                  type="number" 
                  placeholder="Age" 
                  value={registerAge} 
                  onChange={e => {
                    const age = parseInt(e.target.value);
                    if (!isNaN(age) && age >= 18) {
                      setRegisterAge(age.toString());
                      // Auto-calculate DOB based on age
                      const currentYear = new Date().getFullYear();
                      const birthYear = currentYear - age;
                      setRegisterDob(`${birthYear}-01-01`);
                    } else if (e.target.value === '') {
                      setRegisterAge('');
                      setRegisterDob('');
                    }
                  }}
                  min="18"
                  max="120"
                />
                <input 
                  type="date" 
                  placeholder="Date of Birth" 
                  value={registerDob} 
                  onChange={e => {
                    const selectedDate = new Date(e.target.value);
                    const today = new Date();
                    let age = today.getFullYear() - selectedDate.getFullYear();
                    const m = today.getMonth() - selectedDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
                      age--;
                    }
                    if (age >= 18) {
                      setRegisterDob(e.target.value);
                      setRegisterAge(age.toString());
                    } else if (e.target.value === '') {
                      setRegisterDob('');
                      setRegisterAge('');
                    } else {
                      setRegisterError("You must be at least 18 years old to register");
                    }
                  }}
                  max={new Date().toISOString().split("T")[0]}
                  min={new Date(new Date().getFullYear() - 120, 0, 1).toISOString().split("T")[0]}
                />
              </div>
      

<div className="row">
  <input
    placeholder="Voter ID"
    value={registerVoterId}
    onChange={e => setRegisterVoterId(e.target.value)}
  />

  {registerRole === "user" && (
    <input
      placeholder="Aadhar ID"
      value={registerAadhar}
      onChange={e => setRegisterAadhar(e.target.value)}
    />
  )}
</div>


              <div className="row">
                <input type="password" placeholder="Password" value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} />
                <input type="password" placeholder="Confirm Password" />
              </div>

              <div className="otp-row">
                <input placeholder="Email OTP" value={registerOtp} onChange={e => setRegisterOtp(e.target.value)} />
                <button className="otp-btn" disabled={otpTimer > 0} onClick={() => handleSendOtp(registerEmail)}>
                  {otpTimer > 0 ? `${otpTimer}s` : "Send"}
                </button>
              </div>

              {otpError && <div className="error-message otp-error">{otpError}</div>}
              {registerError && <div className="error-message">{registerError}</div>}
              {registerSuccess && <div className="success-message">{registerSuccess}</div>}

              <button className="main-btn" onClick={handleRegister}>Register</button>
            </>
          )}
        </div>

        <div className="side-panel">
          <img
            src="https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcT-zY-3duw8AeoOvT_hzYLKa_MO9HdtHiwvMlxn9IkjrXROpQrb"
            alt="Side Panel Image"
            className="side-panel-image"
          />
          {!isSignup ? (
            <>
              <h2>Welcome Back!</h2>
              <p>Access your account to vote and participate in elections. Your voice matters in shaping the future.</p>
              <button className="side-btn" onClick={() => setIsSignup(true)}>Create Account</button>
            </>
          ) : (
            <>
              <h2>Join Us Today!</h2>
              <p>Register now to become a part of our voting community. Make your vote count and help build a better tomorrow.</p>
              <button className="side-btn" onClick={() => setIsSignup(false)}>Sign In</button>
            </>
          )}
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay">
          <div className="forgot-password-modal">
            <button className="close-modal" onClick={() => {
              setShowForgotPassword(false);
              setForgotPasswordStep(1);
              setForgotEmail("");
              setForgotOtp("");
              setNewPassword("");
              setConfirmPassword("");
              setForgotPasswordError("");
              setForgotPasswordSuccess("");
            }}>&times;</button>
            
            <h2>Reset Password</h2>
            
            {forgotPasswordStep === 1 && (
              <>
                <p>Enter your email address to receive a verification code</p>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                />
                {forgotPasswordError && <div className="error-message">{forgotPasswordError}</div>}
                <button className="main-btn" onClick={async () => {
                  if (!forgotEmail) {
                    setForgotPasswordError("Please enter your email address");
                    return;
                  }
                  try {
                    const res = await fetch(`${API_URL}/send-otp`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotEmail })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setForgotPasswordStep(2);
                      setForgotPasswordError("");
                      setForgotPasswordSuccess("OTP sent successfully to your email");
                    } else {
                      setForgotPasswordError(data.message || "Failed to send OTP");
                    }
                  } catch {
                    setForgotPasswordError("Server error while sending OTP");
                  }
                }}>Send OTP</button>
              </>
            )}

            {forgotPasswordStep === 2 && (
              <>
                <p>Enter the verification code sent to your email</p>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={forgotOtp}
                  onChange={e => setForgotOtp(e.target.value)}
                />
                {forgotPasswordError && <div className="error-message">{forgotPasswordError}</div>}
                <button className="main-btn" onClick={async () => {
                  if (!forgotOtp) {
                    setForgotPasswordError("Please enter the OTP");
                    return;
                  }
                  try {
                    const res = await fetch(`${API_URL}/verify-otp`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                      email: forgotEmail,
                      otp: forgotOtp 
                      })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setForgotPasswordStep(3);
                      setForgotPasswordError("");
                      setForgotPasswordSuccess("OTP verified successfully");
                    } else {
                      setForgotPasswordError(data.message || "Invalid OTP");
                    }
                  } catch {
                    setForgotPasswordError("Server error while verifying OTP");
                  }
                }}>Verify OTP</button>
              </>
            )}

            {forgotPasswordStep === 3 && (
              <>
                <p>Enter your new password</p>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                {forgotPasswordError && <div className="error-message">{forgotPasswordError}</div>}
                {forgotPasswordSuccess && <div className="success-message">{forgotPasswordSuccess}</div>}
                <button className="main-btn" onClick={async () => {
                  if (!newPassword || !confirmPassword) {
                    setForgotPasswordError("Please fill in all fields");
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setForgotPasswordError("Passwords do not match");
                    return;
                  }
                  if (newPassword.length < 6) {
                    setForgotPasswordError("Password must be at least 6 characters long");
                    return;
                  }
                  try {
                    const res = await fetch(`${API_URL}/reset-password`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                      email: forgotEmail,
                      password: newPassword 
                      })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setForgotPasswordSuccess("Password updated successfully!");
                      setTimeout(() => {
                        setShowForgotPassword(false);
                        setForgotPasswordStep(1);
                        setForgotEmail("");
                        setForgotOtp("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setForgotPasswordSuccess("");
                      }, 2000);
                    } else {
                      setForgotPasswordError(data.message || "Failed to update password");
                    }
                  } catch {
                    setForgotPasswordError("Server error while updating password");
                  }
                }}>Update Password</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}