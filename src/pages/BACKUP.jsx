import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { generalStatsConfig, quizPerformanceConfig } from "../helper/statsConfig.jsx";
import CountUp from "react-countup";
import { Tooltip as ReactTooltip } from 'react-tooltip';
import "../styles/Statistics.less";

const StatCard = ({ stat, value }) => {
  const displayValue = stat.format ? stat.format(value) : <CountUp end={value} duration={1.5} />;

  return (
    <>
      <div className="stats-card" data-tooltip-id="global-tooltip" data-tooltip-content={stat.description || ""}>
        {stat.icon && <div className="stats-icon">{stat.icon}</div>}
        <p className="stats-label">{stat.label}</p>
        <p className="stats-value">{displayValue}</p>
      </div>
      <ReactTooltip id="global-tooltip" place="top" delayShow={100} delayHide={100} className="custom-tooltip"/>
    </>
  );
};

export default function Statistics() {
  const { profile } = useContext(AuthContext);

  if (!profile) return <div className="stats-container">Loading statistics...</div>;

  return (
    <div className="stats-wrapper">
      <section className="stats-section">
        <h3 className="stats-heading">General Stats</h3>
        <div className="stats-container">
          {generalStatsConfig.map(stat => (
            <StatCard key={stat.key} stat={stat} value={profile[stat.key]} />
          ))}
        </div>
      </section>

      <section className="stats-section">
        <h3 className="stats-heading">Quiz Performance</h3>
        <div className="stats-container">
          {quizPerformanceConfig.map(stat => (
            <StatCard key={stat.key} stat={stat} value={profile[stat.key]} />
          ))}
        </div>
      </section>
    </div>
  );
}