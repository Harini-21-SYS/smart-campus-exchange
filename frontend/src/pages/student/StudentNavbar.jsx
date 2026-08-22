import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaExchangeAlt } from "react-icons/fa";
// Reuses the dashboard's navbar styling (.dash-navbar, .dash-nav-links, etc.)
// so it looks identical whether it's rendered inside the dashboard or here.
import "./StudentDashboard.css";

// NOTE: this matches the route used elsewhere in the app (see Profile.jsx's
// "Back to Products" link). Update this in one place if that route changes.
export const STUDENT_DASHBOARD_PATH = "/StudentDashboard";

// "Raise Complaint" now lives in the sidebar's Complaints group only
// (alongside My Complaints / Complaints Raised on Me), so it's been
// removed from here.
export const STUDENT_NAV_TABS = [
  { id: "home", label: "Home" },
  { id: "products", label: "Products" },
  { id: "incomingRequests", label: "Incoming Requests" },
  { id: "notifications", label: "Notifications" },
  { id: "profile", label: "Profile" },
];

/**
 * Shared top navbar for logged-in students.
 *
 * - Inside the dashboard: pass onTabClick (the dashboard's own handler)
 *   so tab clicks just switch the internal section, and pass
 *   onSidebarToggle / sidebarOpen to control the personal sidebar.
 * - On the Landing page (student logged in, viewing "Home"): omit those
 *   props — tab clicks fall back to real navigation instead (Home/Profile
 *   go to their own routes, every other tab sends the student into the
 *   dashboard on that section).
 */
function StudentNavbar({
  activeId = null,
  onTabClick,
  onSidebarToggle,
  sidebarOpen = false,
  unreadNotifCount = 0,
  incomingPendingCount = 0,
}) {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  const handleClick = (tab) => {
    setNavOpen(false);

    if (onTabClick) {
      onTabClick(tab);
      return;
    }

    if (tab.id === "home") {
      navigate("/");
      return;
    }
    if (tab.id === "profile") {
      navigate("/profile");
      return;
    }
    navigate(STUDENT_DASHBOARD_PATH, { state: { section: tab.id } });
  };

  return (
    <nav className="dash-navbar">
      {onSidebarToggle && (
        <button
          className="dash-sidebar-toggle"
          onClick={onSidebarToggle}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      )}

      <div className="dash-logo">
        <span className="dash-logo-icon">
          <FaExchangeAlt />
        </span>
        Campus <span>Xchange</span>
      </div>

      <button className="dash-nav-toggle" onClick={() => setNavOpen((o) => !o)}>
        {navOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* NOTE: this was previously missing its backticks
          (`dash-nav-links ${...}` without the surrounding backtick
          characters), which is invalid JS — `dash`, `nav`, `links`
          would be parsed as bare identifiers and throw a
          ReferenceError as soon as this rendered. Fixed below. */}
      <div className={`dash-nav-links ${navOpen ? "dash-nav-open" : ""}`}>
        {STUDENT_NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            className={activeId === tab.id ? "active" : ""}
            onClick={() => handleClick(tab)}
          >
            {tab.label}
            {tab.id === "notifications" && unreadNotifCount > 0 && (
              <span className="nav-badge">{unreadNotifCount}</span>
            )}
            {tab.id === "incomingRequests" && incomingPendingCount > 0 && (
              <span className="nav-badge">{incomingPendingCount}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default StudentNavbar;