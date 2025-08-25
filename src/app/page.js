"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // Initially logged out
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const profilePic = "/profile.jpg"; // Replace with actual user profile picture

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setDropdownOpen(false);
    console.log("User logged out");
  };

  // For demonstration only: simulate login action
  const handleSimulateLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <h4 className="sidebar-title">Menu</h4>
<ul className="sidebar-menu">
          <li >
            <Link href="/dashboard" aria-label="Go to Dashboard">
              <span className="menu-icon" style={{ margin: "5px" }}><img src="/dashboard-2-48.png" width="20" height="20"/></span>    Dashboard
            </Link>
          </li>
          <li>
            <Link href="/settings" aria-label="Go to Settings">
              <span className="menu-icon" style={{ margin: "5px" }}><img src="/gear-48.png" width="20" height="20"/></span> Settings
            </Link>
          </li>
          <li>
            <Link href="/ai-doctor" aria-label="Go to AI Doctor">
              <span className="menu-icon" style={{ margin: "5px" }}><img src="/appointment-reminders-48.png" width="20" height="20"/></span> Appointments
            </Link>
          </li>
          <li>
            <Link href="/myhealth-tracker" aria-label="Go to MyHealth Tracker">
              <span className="menu-icon" style={{ margin: "5px" }}><img src="/report-2-48.png" width="20" height="20"/></span> MyHealth Tracker
            </Link>
          </li>
          <li>
            <Link href="/special-care" aria-label="Go to Special Care Hub">
              <span className="menu-icon" style={{ margin: "5px" }}><img src="/baby-48.png" width="20" height="20"/></span> Special Care Hub
            </Link>
          </li>
          <li>
            <Link href="/Sidebarpages/xray">
              <span className="menu-icon" style={{ margin: "5px" }}><img src="/xray-48.png" width="20" height="20"/></span> AI X-Ray Analyzer
            </Link>
          </li>
          <li>
            <Link href="/Sidebarpages/article" aria-label="Go to Disease Prevention">
              <span className="menu-icon" style={{ margin: "5px" }}><img src="/virus.png" width="20" height="20"/></span> Disease Prevention
            </Link>
          </li>
          <li>
            <Link href="/profile" aria-label="Go to Profile">
             <span className="menu-icon" style={{ margin: "5px" }}><img src="/user-48.png" width="20" height="20"/></span> Profile
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Layout */}
      <div className={`main-content ${isSidebarOpen ? "shifted" : ""}`}>
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-light px-3 fixed-top d-flex align-items-center">
          <button
            className="btn bg-black text-white"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
          >
            ☰
          </button>

          {/* Logo & Title */}
          <div className="d-flex align-items-center">
            <img src="/nlogo.png" className="Logo" alt="LiveChatAI Logo" />
            <h2 className="Top">AlphaWell</h2>
          </div>

          {/* Profile or Sign In/Sign Up */}
          <div className="ms-auto">
            {isLoggedIn ? (
              <div className="dropdown" style={{ position: "relative" }}>
                <div onClick={toggleDropdown} style={{ cursor: "pointer" }}>
                  <Image
                    src={profilePic}
                    alt="User Profile"
                    width={40}
                    height={40}
                    className="rounded-circle"
                  />
                </div>
                {dropdownOpen && (
                  <ul
                    className="dropdown-menu dropdown-menu-end show"
                    style={{ position: "absolute" }}
                  >
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        Logout
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ) : (
              <>
                <Link href="/Authpages/SignIn">
                  <button className="btn btn-dark me-2">Sign Up</button>
                </Link>
                <Link href="/Authpages/LogIn">
                  <button className="btn btn-dark">Login</button>
                </Link>
                {/* For demo purposes: simulate a login */}
                <button
                  className="btn btn-secondary ms-2"
                  onClick={handleSimulateLogin}
                >
                  Simulate Login
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container text-center py-5">
          <div className="row align-items-center">
            {/* Left Side - Text */}
            <div className="col-md-6 text-md-start text-center">
              <h1 className="fw-bold display-3 text-dark">
                Stay Calm, Stay Safe. We’ve Got You Covered.
              </h1>
              <p className="text-muted fs-4">
                First Aid in a Flash. Experience the future of care—where AI
                understands, responds, and supports you with the warmth and
                intelligence of human touch.
              </p>
              <Link href="/Sidebarpages/profilemanger" className="get-started-btn">
                Get Started
                <span className="text-lg">→</span>
              </Link>
            </div>

            {/* Right Side - New Section */}
            <div className="col-md-6">
              <div>
                <div>
                  {/* Left Side - Text */}
                  <div>
                   {/* <iframe src='https://my.spline.design/genkubgreetingrobot-oMr34GupQkydFQdseY1G6KGd/' width='100%' height='100%'></iframe> */}
                   <div>
                  <iframe
                  src="https://my.spline.design/genkubgreetingrobot-oMr34GupQkydFQdseY1G6KGd/"
                  width="800"
                  height="620"
                  style={{ borderRadius: "1000px" }}
                   ></iframe>
                  </div>
                  </div>

                  {/* Right Side - Image */}
                  <div>
                 <img 
                src="/x.png" 
                alt="bot" 
                width="80"
                height="60"
                style={{ float: "right", marginTop: "-80px", marginRight: "-55px" }}/>
                  </div>
                </div>
              </div>
            </div>
            {/* End of Right Side */}
          </div>
        </div>
      </div>
    </div>
  );
}
