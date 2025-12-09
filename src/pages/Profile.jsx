import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getCode } from "country-list";
import { MdOutlineEdit } from "react-icons/md";
import { FiLink } from "react-icons/fi";
import { useSearchParams, useNavigate } from "react-router-dom";
import Statistics from './Statistics.jsx';
import QuizHistory from './QuizHistory.jsx';
import Favorites from './Favorites.jsx';
import Achievements from './Achievements.jsx';
import LiveUserStatus from "./LiveUserStatus.jsx";
import { countryCodeMap } from '../helper/countryMapping.js';
import '../styles/Profile.less';


export default function Profile() {

  const { user, profile } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "statistics";
  const [activeTab, setActiveTab] = useState(tabFromUrl); 
  const navigate = useNavigate();
  

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);


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

  function copyProfileLink() {
    const profileLink = `${window.location.origin}/user/${profile.username}`;

    navigator.clipboard.writeText(profileLink);
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

            <button className="edit-profile-btn" onClick={() => navigate("/profile/edit")}>
              <MdOutlineEdit className="edit-icon" />
              Edit Profile
            </button>

            <button className="copy-link-btn" onClick={copyProfileLink} title="Copy profile link">
              <FiLink className="copy-icon" />
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
              <LiveUserStatus userId={profile.id} />
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
          className={`tab ${activeTab === "achievements" ? "active" : ""}`}
          onClick={() => changeTab("achievements")}
        >
          Achievements
        </div>

        <div
          className={`tab ${activeTab === "favorites" ? "active" : ""}`}
          onClick={() => changeTab("favorites")}
        >
          Favorites
        </div>

        <div
          className={`tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => changeTab("history")}
        >
          History
        </div>
      </div>
      <div className="profile-tab-content">
        {activeTab === "statistics" && <Statistics username={profile?.username} />}
        {activeTab === "achievements" && <Achievements username={profile?.username} />}
        {activeTab === "favorites" && <Favorites username={profile?.username} />}
        {activeTab === "history" && <QuizHistory username={profile?.username} />}
      </div>
    </div>
  );
}