import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getCode } from "country-list";
import { MdOutlineEdit } from "react-icons/md";
import { useSearchParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import Statistics from './Statistics.jsx';
import History from './History.jsx';
import Favorites from './Favorites.jsx';
import { countryCodeMap } from '../helper/countryMapping.js';
import '../styles/Profile.less';


export default function Profile() {

  const { user, profile } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "statistics";
  const [activeTab, setActiveTab] = useState(tabFromUrl); 
  const navigate = useNavigate();
  
  const [activeStatus, setActiveStatus] = useState({ text: "", online: false });

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);


  function getActiveStatus(dateString) {
    if (!dateString) return { text: "-", online: false };
    const date = new Date(dateString);
    const now = new Date();

    const diffInMinutes = (now - date) / 1000 / 60;

    if (diffInMinutes <= 2) {
      return { text: "Active now", online: true };
    }

    return {text: `Active ${formatDistanceToNow(date, { addSuffix: true })}`, online: false };
  }


  useEffect(() => {
    if (!profile?.last_active) return;

    setActiveStatus(getActiveStatus(profile.last_active));

    const interval = setInterval(() => {
      setActiveStatus(getActiveStatus(profile.last_active));
    }, 30000);

    return () => clearInterval(interval);
  }, [profile?.last_active]);


  function changeTab(tab) {
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`, { replace: true });
  }

  function getFlagsApiCode(restCountryName) {
    if (countryCodeMap[restCountryName]) {
      return countryCodeMap[restCountryName];
    }

    return getCode(restCountryName) || null;
  }

  if (!user || !profile) return <div className="profile-container">Loading...</div>;

  const countryCode = profile.country_of_origin ? getFlagsApiCode(profile.country_of_origin) : null;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="avatar-section">
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="profile-avatar"
          />
        </div>
        <div className="info-section">
          <div className="top-row">
            <h2 className="user-name">{profile.username}</h2>

            {profile.country_of_origin && (() => {
              const countryCode = getFlagsApiCode(profile.country_of_origin);
              return countryCode && (
                <img
                  src={`https://flagsapi.com/${countryCode}/shiny/64.png`}
                  alt={profile.country_of_origin}
                  title={profile.country_of_origin}
                  className="user-flag"
                />
              );
            })()}

            <button
              className="edit-profile-btn"
              onClick={() => navigate("/profile/edit")}
            >
              <MdOutlineEdit className="edit-icon"/>
              Edit Profile
            </button>
          </div>
          <p className="user-since">
            User since: {
              profile.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-GB", {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : "-"
            }
          </p>
          {profile.last_active && (
            <p className="user-active">
              <span className={`status-dot ${activeStatus.online ? "online" : "offline"}`}></span>
              {activeStatus.text}
            </p>
          )}
        </div>
      </div>
      <div className="profile-tabs">
        <div
          className={`tab ${activeTab === "statistics" ? "active" : ""}`}
          onClick={() => changeTab("statistics")}
        >
          Statistics
        </div>

        <div
          className={`tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => changeTab("history")}
        >
          History
        </div>

        <div
          className={`tab ${activeTab === "favorites" ? "active" : ""}`}
          onClick={() => changeTab("favorites")}
        >
          Favorites
        </div>
      </div>
      <div className="profile-tab-content">
        {activeTab === "statistics" && <Statistics />}
        {activeTab === "history" && <History />}
        {activeTab === "favorites" && <Favorites />}
      </div>
    </div>
  );
}