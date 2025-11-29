import { useState, useEffect } from "react";
import { generalStatsConfig, quizPerformanceConfig } from "../helper/statsConfig.jsx";
import CountUp from "react-countup";
import { Tooltip as ReactTooltip } from 'react-tooltip';
import supabase from "../helper/supabaseClient.js";
import "../styles/Statistics.less";

const StatCard = ({ stat, value, tooltipsEnabled }) => {
  const displayValue = stat.format ? stat.format(value) : <CountUp end={value} duration={1.5} />;

  return (
    <div
      className="stats-card"
      data-tooltip-id={tooltipsEnabled ? "global-tooltip" : undefined}
      data-tooltip-html={tooltipsEnabled ? (stat.description || "") : undefined}
    >
      {stat.icon && <div className="stats-icon">{stat.icon}</div>}
      <p className="stats-label">{stat.label}</p>
      <p className="stats-value">{displayValue}</p>
    </div>
  );
};

export default function Statistics({ username }) {

  const [profileData, setProfileData] = useState(null);
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfileStats() {
      setLoading(true);

      const { data: profile, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !profile) {
        console.error("Error fetching profile statistics:", error);
        setProfileData(null);
        setLoading(false);
        return;
      }

      setProfileData(profile);
      setLoading(false);
    }

    fetchProfileStats();
  }, [username]);

  if (loading) return <div className="stats-wrapper">Loading statistics...</div>;
  if (!profileData) return <div className="stats-wrapper">Profile not found</div>;

  return (
    <div className="stats-wrapper">
      <section className="stats-section">
        <div className="stats-header">
          <h3 className="stats-heading">General Stats</h3>
          <label className="tooltip-toggle">
            <input type="checkbox" checked={tooltipsEnabled} onChange={() => setTooltipsEnabled(!tooltipsEnabled)} />
            Show Tooltips
          </label>
        </div>

        <div className="stats-container">
          {generalStatsConfig.map(stat => (
            <StatCard key={stat.key} stat={stat} value={profileData[stat.key]} tooltipsEnabled={tooltipsEnabled} />
          ))}
        </div>
      </section>

      <section className="stats-section">
        <h3 className="stats-heading">Quiz Performance</h3>
        <div className="stats-container">
          {quizPerformanceConfig.map(stat => (
            <StatCard key={stat.key} stat={stat} value={profileData[stat.key]} tooltipsEnabled={tooltipsEnabled} />
          ))}
        </div>
      </section>
      {tooltipsEnabled && <ReactTooltip id="global-tooltip" place="top" delayShow={100} delayHide={100} className="custom-tooltip" />}
    </div>
  );
}