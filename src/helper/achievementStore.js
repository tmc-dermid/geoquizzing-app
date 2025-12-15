import { create } from 'zustand';

export const useAchievementStore = create((set) => ({
  achievements: [],
  addAchievements: (newAchievements) => set((state) => ({
    achievements: [...state.achievements, ...newAchievements],
  })),
}));