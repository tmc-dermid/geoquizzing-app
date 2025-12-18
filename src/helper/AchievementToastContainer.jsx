import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AchievementToast } from './AchievementToast';
import { AnimatePresence } from 'framer-motion';

let addToastFn;

export const addAchievementToast = (achievement) => {
  if (addToastFn) addToastFn(achievement);
};

export const AchievementToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (achievement) => {
      const id = Date.now();

      setToasts((prev) => [...prev, { ...achievement, _id: id }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t._id !== id));
      }, 4000);
    };

    return () => {
      addToastFn = null;
    };
  }, []);

  return createPortal(
    <div style={{
      position: 'fixed',
      top: '16px',
      right: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 99999,
      pointerEvents: 'none'
    }}>
      <AnimatePresence>
        {toasts.map((a) => (
          <AchievementToast key={a._id} achievement={a} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};