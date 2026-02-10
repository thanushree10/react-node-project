import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete, showSplash2Only = false }) => {
  const [showSplash1, setShowSplash1] = useState(!showSplash2Only);
  const [showSplash2, setShowSplash2] = useState(showSplash2Only);
  const [showLogo, setShowLogo] = useState(false);
  const [showRemainingLetters, setShowRemainingLetters] = useState(false);

  // Add useEffect to transition from splash1 to splash2
  useEffect(() => {
    // Show V after fingerprint animation
    const logoTimer = setTimeout(() => {
      setShowLogo(true);
    }, 2000);

    // Show remaining letters after V appears
    const remainingLettersTimer = setTimeout(() => {
      setShowRemainingLetters(true);
    }, 2500);

    // Transition to splash2 after full animation
    const splash2Timer = setTimeout(() => {
      setShowSplash1(false);
      setShowSplash2(true);
    }, 5000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(remainingLettersTimer);
      clearTimeout(splash2Timer);
    };
  }, []);

  // Original splash screen 1
  if (showSplash1) {
    return (
      <div className="splash-wrapper">
        <div className="splash-card">
          <div className="fingerprint-container">
            {!showLogo ? (
              <svg className="fingerprint" viewBox="0 0 100 100">
                <path d="M50 10 C30 10 15 25 15 45 C15 65 30 80 50 80 C70 80 85 65 85 45" />
                <path d="M50 20 C35 20 25 30 25 45 C25 60 35 70 50 70 C65 70 75 60 75 45" />
                <path d="M50 30 C40 30 35 35 35 45 C35 55 40 60 50 60 C60 60 65 55 65 45" />
                <path d="M50 40 C45 40 45 45 45 45 C45 50 50 50 50 50 C55 50 55 45 55 45 C55 40 50 40 50 40" />
              </svg>
            ) : (
              <div className="logo-container">
                {showRemainingLetters && (
                  <>
                    <span className="logo-letter e">E</span>
                    <span className="logo-letter dash">-</span>
                  </>
                )}
                <span className="logo-letter v">V</span>
                {showRemainingLetters && (
                  <span className="logo-letter vote">OTE</span>
                )}
              </div>
            )}
          </div>

          <div className="loading-container">
            <div className="loading-dots">
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
            </div>
            <p className="loading-text">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Original splash screen 2
  if (showSplash2) {
    return (
      <div className="splash2-wrapper">
        <div className="splash2-card">
          <img
            src="/images/vote-icon.jpeg"
            alt="E-Voting"
            className="splash2-logo rotate"
          />

          <p>Vote anytime, anywhere</p>
          <p className="college-text">JSS Polytechnic For Women</p>

          <button
            className="continue-btn move-btn"
            onClick={() => {
              setShowSplash2(false);
              if (onComplete) {
                onComplete();
              }
            }}
          >
            Let's Continue
          </button>

          <div className="dots dots-bottom">
            <span></span><span></span><span></span><span></span>
          </div>

          <p className="team-title">Team Members</p>
          <p className="team-names">
            Thanushree, Pavana, Upanvitha, Sneha
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default SplashScreen;