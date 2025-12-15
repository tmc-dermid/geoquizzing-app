import React from 'react';
import { toast, Slide } from 'react-toastify';
import { achievementIconMap } from './achievementsConfig';
import '../styles/AchievementToast.less';

export const showAchievementToasts = (achievements) => {
  achievements.forEach(a => {
    toast(
      <div className='achievement-toast-card'>
        <div className='achievement-icon'>
          {React.createElement(achievementIconMap[a.icon], { className: 'icon' })}
        </div>
        <div className='achievement-content'>
          <strong className='achievement-header'>New Achievement</strong>
          <span className='achievement-title'>{a.title}</span>
        </div>
      </div>,
      {
        position: 'top-right',
        autoClose: 5000,
        closeButton: true,
        icon: false,
        className: '',
        bodyClassName: '',
        transition: Slide,
        style: { background: 'transparent', padding: 0 }
      }
    );
  });
};

