import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { generalStatsConfig, quizPerformanceConfig } from "../helper/statsConfig.jsx";
import CountUp from "react-countup";
import { Tooltip as ReactTooltip } from 'react-tooltip';
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

export default function Statistics() {

  const { profile } = useContext(AuthContext);
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);

  if (!profile) return <div className="stats-container">Loading statistics...</div>;

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
            <StatCard key={stat.key} stat={stat} value={profile[stat.key]} tooltipsEnabled={tooltipsEnabled} />
          ))}
        </div>
      </section>

      <section className="stats-section">
        <h3 className="stats-heading">Quiz Performance</h3>
        <div className="stats-container">
          {quizPerformanceConfig.map(stat => (
            <StatCard key={stat.key} stat={stat} value={profile[stat.key]} tooltipsEnabled={tooltipsEnabled} />
          ))}
        </div>
      </section>
      {tooltipsEnabled && <ReactTooltip id="global-tooltip" place="top" delayShow={100} delayHide={100} className="custom-tooltip" />}
    </div>
  );
}