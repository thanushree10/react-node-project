import React, { useState, useEffect } from "react";
import "./Calendar.css";

function Calendar() {
  const today = new Date();

  const [date, setDate] = useState(today);
  const [activePeriod, setActivePeriod] = useState("Today");
  const [currentTime, setCurrentTime] = useState(new Date());

  // LIVE CURRENT TIME
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const dayNames = [
    "Sunday","Monday","Tuesday","Wednesday",
    "Thursday","Friday","Saturday"
  ];

  const timeSlots = ["10:00","11:00","12:00","13:00","14:00"];

  const changeDate = (direction) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + direction);
    setDate(newDate);
  };

  return (
    <div className="calendar-card">

      {/* Header */}
      <div className="calendar-header">
        <h2>Calendar</h2>
        <div className="calendar-nav">
          <button className="nav-btn" onClick={() => changeDate(-1)}>‹</button>
          <span className="current-month">
            {monthNames[date.getMonth()]} {date.getFullYear()}
          </span>
          <button className="nav-btn" onClick={() => changeDate(1)}>›</button>
        </div>
      </div>

      {/* LIVE TIME */}
      <div className="current-time">
        {currentTime.toLocaleTimeString()}
      </div>

      {/* Period Selector */}
      <div className="period-selector">
        {["Today", "Week", "Month"].map((item) => (
          <button
            key={item}
            className={`period-btn ${activePeriod === item ? "active" : ""}`}
            onClick={() => setActivePeriod(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Date Display */}
      <div className="date-display">
        <div className="day-name">{dayNames[date.getDay()]}</div>
        <div className="date-number">{date.getDate()}</div>
        <div className="month-name">{monthNames[date.getMonth()]}</div>
      </div>

      {/* Time Slots */}
      <div className="time-slots">
        {timeSlots.map((time) => (
          <button key={time} className="time-slot">
            {time}
          </button>
        ))}
      </div>

    </div>
  );
}

export default Calendar;
