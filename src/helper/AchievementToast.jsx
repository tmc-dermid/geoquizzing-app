import React from 'react';
import { achievementIconMap } from './achievementsConfig';
import { motion } from 'framer-motion';
import '../styles/AchievementToast.less';

export const AchievementToast = ({ achievement }) => {
  return (
    <motion.div
      className='achievement-toast-card'
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className='achievement-icon'>
        {React.createElement(achievementIconMap[achievement.icon], { className: 'icon' })}
      </div>
      <div className='achievement-content'>
        <strong className='achievement-header'>New Achievement</strong>
        <span className='achievement-title'>{achievement.title}</span>
      </div>
    </motion.div>
  )
}
