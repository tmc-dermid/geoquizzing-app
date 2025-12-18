import { useState, useEffect } from "react";
import { generalStatsConfig, quizPerformanceConfig, activityStatsConfig } from "../helper/statsConfig.jsx";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";
import { Tooltip as ReactTooltip } from 'react-tooltip';
import CountUp from "react-countup";
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
  const [dailyQuizActivity, setDailyQuizActivity] = useState([]);

  useEffect(() => {
    async function fetchProfileStats() {
      setLoading(true);

      const { data: profile, error: profileErr } = await supabase
        .from('user_profile')
        .select('*')
        .eq('username', username)
        .single();

      if (profileErr || !profile) {
        console.error("Error fetching profile statistics:", profileErr);
        setProfileData(null);
        setLoading(false);
        return;
      }

      const { data: stats, error: statsErr } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (statsErr) {
        console.warn("User has no stats yet, using defaults.");
      }

      const merged = {
        ...profile,
        ...stats,
      };

      setProfileData(merged);
      setLoading(false);
    }

    fetchProfileStats();
  }, [username]);

  useEffect(() => {
    if (!profileData?.id) return;

    const fetchDailyQuizActivity = async () => {
      const { data: activityData, error: activityErr } = await supabase
        .from('user_stats_daily')
        .select('date, time_spent_seconds')
        .eq('user_id', profileData.id)
        .order('date', { ascending: true });

      if (activityErr) {
        console.error("Error fetching daily activity:", activityErr);
        setDailyQuizActivity([]);
        return;
      }

      if (activityData.length > 0) {
        const startDate = new Date(activityData[0].date);
        const endDate = new Date(activityData[activityData.length - 1].date);

        const dateMap = {};

        activityData.forEach((d) => {
          dateMap[d.date] = d.time_spent_seconds;
        });

        const fullData = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const isoDate = d.toISOString().slice(0, 10);
          fullData.push({
            date: isoDate,
            totalPlaytime: dateMap[isoDate] ?? 0,
          })
        }

        setDailyQuizActivity(fullData);
      }
    };

    fetchDailyQuizActivity();
  }, [profileData]);

  const secondsToTime = (seconds) => {
    const mins = (seconds ?? 0) / 60;

    if (mins < 60) {
      return `${mins.toFixed(0)} min`;
    } else {
      const hours = mins / 60;
      return `${hours.toFixed(1)} h`;
    }
  };

  if (loading) return <p className="loading-info">Loading statistics...</p>;
  if (!profileData) return <p className="loading-info">Profile not found</p>;

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

        <motion.div
          className="stats-container"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {generalStatsConfig.map(stat => (   
            <StatCard
              key={stat.key}
              stat={stat}
              value={profileData[stat.key]}
              tooltipsEnabled={tooltipsEnabled}
            />
          ))}
        </motion.div>
      </section>

      <section className="stats-section">
        <h3 className="stats-heading">Quiz Performance</h3>

        <motion.div
          className="stats-container"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}          
        >
          {quizPerformanceConfig.map(stat => (
            <StatCard
              key={stat.key}
              stat={stat}
              value={profileData[stat.key]}
              tooltipsEnabled={tooltipsEnabled}
            />
          ))}
        </motion.div>
      </section>

      <section className="stats-section">
        <h3 className="stats-heading">User Activity</h3>

        <motion.div
          className="stats-container"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}             
        >
          {activityStatsConfig.map(stat => (
            <StatCard
              key={stat.key}
              stat={stat}
              value={profileData[stat.key]}
              tooltipsEnabled={tooltipsEnabled}
            />
          ))}
        </motion.div>
      </section>

      <section className="stats-section">
        <h3 className="stats-heading">Daily Quiz Playtime</h3>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          style={{ width: "100%", height: 250 }}
        >
          <ResponsiveContainer width="100%" height="100%" >
            <LineChart data={dailyQuizActivity} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" interval="preserveStartEnd" />
              <YAxis tickFormatter={(value) => value + " s"}/>
              <Tooltip formatter={(value) => secondsToTime(value)} />
              <Line type="monotone" dataKey="totalPlaytime" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }}/>
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </section>

      {tooltipsEnabled && <ReactTooltip id="global-tooltip" place="top" delayShow={100} delayHide={100} className="custom-tooltip" />}
    </div>
  );
}