import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { achievementIconMap, categoryColors } from '../helper/achievementsConfig';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../helper/supabaseClient';
import '../styles/Achievements.less';

export default function Achievements({ username }) {

  const [achievements, setAchievements] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    async function fetchOwnerId() {
      if (!username) return;

      if (user?.id && username === user.user_metadata?.username) {
        setOwnerId(user.id);
        return;
      }

      const { data: profile, error } = await supabase
        .from('user_profile')
        .select('id')
        .eq('username', username)
        .single();

      if (!error && profile) {
        setOwnerId(profile.id);
      } else {
        console.error("Error fetching profile:", error);
      }
    }

    fetchOwnerId();
  }, [username, user]);

  useEffect(() => {
    async function fetchAchievements() {
      if (!ownerId) return;

      setLoading(true);

      try {
        const { data: achievementsData, error: achievementsErr } = await supabase
          .from('user_achievement')
          .select(`
            earned_at,
            achievements (
              achievement_id,
              title,
              description,
              icon,
              points,
              category
            )  
          `)
          .eq('user_id', ownerId)
          .order('earned_at', { ascending: true });

        if (achievementsErr) {
          console.error("Error fetching achievements:", achievementsErr);
          setAchievements([]);
        } else {
          const formatted = achievementsData.map((ua) => ({
            ...ua.achievements,
            earned_at: ua.earned_at,
          }));
          setAchievements(formatted);
        }
      } catch (err) {
        console.error("Unexpected error fetching achievements:", err);
        setAchievements([]);
      }

      setLoading(false);
    }

    fetchAchievements();
  }, [ownerId]);

  const formatDate = (date) => new Date(date).toLocaleDateString("en-GB", {
    day: "numeric", 
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const isOwner = user?.id && ownerId && user.id === ownerId;

  if (loading) return <p className='loading-info'>Loading achievements...</p>;
  if (!achievements.length) return (
    <div className="achievements-container">
      <p className="no-achievements">{isOwner ? "You have no achievements yet" : <span><strong>{username}</strong> has no achievements yet</span>}</p>
    </div>
  );

  return (
    <div className='achievements-container'>
      <h2 className='achievements-heading'>
        {isOwner ? "Your Achievements" : <span><strong>{username}'s</strong> Achievements</span>}
      </h2>

      {!loading && (
        <p className='results-count'>
          {isOwner
            ? <>You&apos;ve earned a total of <strong>{achievements.length}</strong> achievement{achievements.length !== 1 ? "s" : ""}.</>
            : <><strong className='user-name'>{username}</strong> has earned <strong>{achievements.length}</strong> achievement{achievements.length !== 1 ? "s" : ""}.</>
          }
        </p>
      )}

      <div className='achievement-grid'>
        <AnimatePresence>
          {achievements.map((ach) => (
            <motion.div
              key={ach.achievement_id}
              className='achievement-card'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20}}
              transition={{ duration: 0.5, delay: 0.1 * achievements.indexOf(ach) }}
            >
              <div
                className='achievement-category'
                style={{ background: categoryColors[ach.category] }}
              >
                {ach.category}
              </div>
              <div className='achievement-icon'>
                {achievementIconMap[ach.icon] && React.createElement(achievementIconMap[ach.icon])}
              </div>
              <div className='achievement-info'>
                <div className='achievement-title'>{ach.title}</div>
                <div className='achievement-description'>{ach.description}</div>
                <div className='achievement-points'>Points: {ach.points}</div>
              </div>

              <div className='achievement-earned-at'><strong>Earned at: </strong>{formatDate(ach.earned_at)}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
