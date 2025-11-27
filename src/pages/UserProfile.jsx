import { useState, useEffect, useContext } from "react";
import { useSearchParams, useParams, useNavigate, Navigate } from "react-router-dom";
import { getCode } from "country-list";
import { AuthContext } from "../context/AuthContext.jsx";
import { formatDistanceToNow } from "date-fns";
import Statistics from './Statistics.jsx';
import History from './History.jsx';
import Favorites from './Favorites.jsx';
import supabase from '../helper/supabaseClient.js';
import '../styles/Profile.less';


export default function UserProfile() {

  const { user } = useContext(AuthContext);

  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "statistics";
  const [activeTab, setActiveTab] = useState(tabFromUrl); 
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [activeStatus, setActiveStatus] = useState({ text: "", online: false });

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  function changeTab(tab) {
    setActiveTab(tab);
    navigate(`/user/${username}?tab=${tab}`, { replace: true });
  }


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
    async function fetchProfile() {
      setLoading(true);

      const { data, error} = await supabase
        .from('user_profile')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    fetchProfile();
  }, [username]);


  useEffect(() => {
    if (!profile?.last_active) return;

    setActiveStatus(getActiveStatus(profile.last_active));

    const interval = setInterval(() => {
      setActiveStatus(getActiveStatus(profile.last_active));
    }, 30000);

    return () => clearInterval(interval);
  }, [profile?.last_active]);


  if (!loading && profile && user) {
    if (user.id === profile.id) {
      return <Navigate to="/profile" replace />;
    }
  }

  if (loading) return <div className="profile-container">Loading...</div>;
  if (!profile) return <div className="profile-container">User not found.</div>;

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
              const countryCode = getCode(profile.country_of_origin);
              return (
                countryCode && (
                  <img
                    src={`https://flagsapi.com/${countryCode}/shiny/64.png`}
                    alt={profile.country_of_origin}
                    title={profile.country_of_origin}
                    className="user-flag"
                  />
                )
              );
            })()}
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
        {activeTab === "statistics" && <Statistics username={username} />}
        {activeTab === "history" && <History username={username} />}
        {activeTab === "favorites" && <Favorites username={username} />}
      </div>
    </div>
  );
}