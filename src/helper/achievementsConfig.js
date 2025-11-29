import { GiCompass, GiFootsteps, GiEarthAmerica, GiEarthAfricaEurope, GiPathDistance, GiWorld, GiLaurelCrown, GiDiamondTrophy,
  GiBrain, GiCrown, GiTrophyCup } from "react-icons/gi";
import { FaEarthAsia, FaEarthEurope, FaEarthOceania, FaPlay, FaGraduationCap, FaShapes } from "react-icons/fa6";
import { IoFootstepsSharp } from "react-icons/io5";
import { FiCheckCircle } from "react-icons/fi";

export const achievementIconMap = {
  GiFootsteps,          // used
  GiCompass,
  GiEarthAmerica,
  GiEarthAfricaEurope,  // used
  GiPathDistance,       // used
  GiWorld,              // used
  GiLaurelCrown,        // used
  GiDiamondTrophy,      // used
  GiBrain,              // used
  GiCrown,              // used
  GiTrophyCup,          // used
  FaEarthAsia,          // used
  FaEarthEurope,        // used
  FaEarthOceania,
  FaPlay,               // used
  FaShapes,             // used
  FaGraduationCap,      // used
  FiCheckCircle,        // used
  IoFootstepsSharp,     // used
};

export const achievementIconOptions = Object.keys(achievementIconMap);

export const categoryColors = {
  COMMON: "linear-gradient(135deg, #01d6e1, #01b74d, #0377eb)",
  RARE: "linear-gradient(135deg, #6a2c70, #9b5de5, #4a00e0)",
  LEGENDARY: "linear-gradient(135deg, #ff6f00, #ffb347, #dbab1aff)",
};

export const categoryOrder = {
  COMMON: 1,
  RARE: 2,
  LEGENDARY: 3,
};