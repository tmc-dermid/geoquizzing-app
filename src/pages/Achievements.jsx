import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { achievementIconMap, categoryColors, categoryOrder } from '../helper/achievementsConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye } from 'react-icons/fi';
import supabase from '../helper/supabaseClient';
import '../styles/Achievements.less';

export default function Achievements({ username }) {

  const [achievements, setAchievements] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

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
          }))
          .sort((a, b) => {
            const catDiff = categoryOrder[a.category] - categoryOrder[b.category];

            if (catDiff !== 0) return catDiff;

            return new Date(b.earned_at) - new Date(a.earned_at);
          });

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

  const filteredAchievements = React.useMemo(() => {
    if (!selectedCategory) return achievements;

    return achievements.filter((ach) => ach.category === selectedCategory);
  }, [achievements, selectedCategory]);

  

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

      <div className='achievement-tabs'>
        {["COMMON", "RARE", "LEGENDARY"].map((cat) => (
          <button
            key={cat}
            className={`tab-button ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
        <button
          className={`tab-button reset ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
      </div>

      <motion.div className='achievement-icon-grid' layout>
        <AnimatePresence>
          {filteredAchievements.length === 0 ? (
            <motion.div
              key='empty'
              className='empty-category-info'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {selectedCategory ? (
                <>
                  No achievements in <strong>{selectedCategory}</strong> category yet
                </>
              ) : (
                <>
                  No achievements to display.
                </>
              )}
            </motion.div>
          ) : (
          filteredAchievements.map((ach) => (
            <motion.div
              layout
              key={ach.achievement_id}
              className='achievement-icon-tile'
              initial={{ opacity: 0,}}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedAchievement(ach)}
            >
              <div
                className='icon-wrapper'
                style={{ background: categoryColors[ach.category] }}
              >
                {achievementIconMap[ach.icon] && React.createElement(achievementIconMap[ach.icon])}
              </div>
              <div className='tile-title'>{ach.title}</div>
              <div className='tile-date'>{formatDate(ach.earned_at)}</div>

              <motion.div
                className='tile-overlay'
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className='tile-overlay-label'><FiEye style={{ marginRight: 8 }}/> View Card</div>
              </motion.div>
            </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            className='achievement-modal-backdrop'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              className='achievement-modal-content'
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className='achievement-card'>
                <div
                  className='achievement-category'
                  style={{ background: categoryColors[selectedAchievement.category] }}
                >
                  {selectedAchievement.category}
                </div>

                <div className='achievement-icon'>
                  {achievementIconMap[selectedAchievement.icon]
                    && React.createElement(achievementIconMap[selectedAchievement.icon])}
                </div>

                <div className="achievement-info">
                  <div className="achievement-title">{selectedAchievement.title}</div>
                  <div className="achievement-description">{selectedAchievement.description}</div>
                  <div className="achievement-points">Points: {selectedAchievement.points}</div>
                </div>

                <div className='achievement-earned-at'>
                  <strong>Earned at:</strong>
                  {" "}{formatDate(selectedAchievement.earned_at)}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
