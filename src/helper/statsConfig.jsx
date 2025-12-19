import { FaStar, FaCheck, FaTimes, FaCheckCircle, FaTimesCircle, FaQuestion, FaLightbulb, FaRegLightbulb, FaHourglassHalf, FaRegClock } from "react-icons/fa";
import { MdLightbulbCircle, MdQuestionMark, MdAssignmentTurnedIn  } from "react-icons/md";
import { GiPlayerTime } from "react-icons/gi";
import { BsFillLightningFill, BsLightning } from "react-icons/bs";

export const generalStatsConfig = [
  {
    key: "points",
    label: "Total Points",
    icon: <FaStar />,
    description: "Total points earned so far"
  },
  {
    key: "total_quizzes_completed",
    label: "Total Quizzes Completed",
    icon: <MdAssignmentTurnedIn />,
    description: "Total number of quizzes completed"
  },
  {
    key: "total_questions_answered",
    label: "Total Questions Answered",
    icon: <FaQuestion />,
    description: "Total number of questions answered in all quizzes"
  },
  {
    key: "avg_questions_per_quiz",
    label: "Average Questions per Quiz",
    icon: <MdQuestionMark />,
    format: (v) => ((v ?? 0).toFixed(1)),
    description: "Average number of questions per quiz"
  },
  {
    key: "total_hints_used",
    label: "Total Hints Used",
    icon: <FaLightbulb />,
    description: "Total number of hints used in all quizzes"
  },
  {
    key: "avg_hints_per_quiz",
    label: "Average Hints per Quiz",
    icon: <FaRegLightbulb />,
    format: (v) => ((v ?? 0).toFixed(1)),
    description: "Average number of hints used per quiz"
  },
];

export const streakStatsConfig = [
  {
    key: "current_streak",
    label: "Current Streak",
    icon: <BsLightning />,
    description: "Current number of consecutive correct answers in general"
  },
  {
    key: "longest_streak",
    label: "Longest Streak",
    icon: <BsFillLightningFill />,
    description: "Highest number of consecutive correct answers in general"
  },
];

export const quizPerformanceConfig = [
  {
    key: "total_correct_answers", 
    label: "Total Correct Answers",
    icon: <FaCheck />,
    description: "Total number of questions answered <i>correctly</i> across all quizzes"
  },
  {
    key: "total_incorrect_answers",
    label: "Total Incorrect Answers",
    icon: <FaTimes />,
    description: "Total number of questions answered <i>incorrectly</i> across all quizzes"
  },
  {
    key: "correct_ratio",
    label: "Correct Answers Ratio",
    icon: <FaCheckCircle />,
    format: (v) => (((v ?? 0) * 100).toFixed(2) + "%"),
    description: "Percentage of <i>correct</i> answers"
  },
  {
    key: "incorrect_ratio",
    label: "Incorrect Answers Ratio",
    icon: <FaTimesCircle />,
    format: (v) => (((v ?? 0) * 100).toFixed(2) + "%"),
    description: "Percentage of <i>incorrect</i> answers"
  },
  {
    key: "avg_time_per_question",
    label: "Average Time per Question",
    icon: <FaHourglassHalf />,
    format: (v) => ((v ?? 0).toFixed(1)) + " s",
    description: "Average time taken to answer a question <i>(in seconds)</i>"
  },
  {
    key: "hints_usage_ratio",
    label: "Hints Usage Ratio",
    icon: <MdLightbulbCircle />,
    format: (v) => (((v ?? 0) * 100).toFixed(2) + "%"),
    description: "Percentage of questions where hints were used"
  },
];


export const activityStatsConfig = [
  {
    key: "total_time_active_seconds",
    label: "Total Time Active",
    icon: <FaRegClock />,
    format: (v) => {
      const total = v ?? 0;

      const days = Math.floor(total / 86400);
      const hours = Math.floor((total % 86400) / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const seconds = total % 60;

      const timeParts = [];

      if (days > 0) timeParts.push(`${days}d`);
      if (hours > 0) timeParts.push(`${hours}h`);
      if (minutes > 0) timeParts.push(`${minutes}min`);
      if (seconds > 0 || timeParts.length === 0) timeParts.push(`${seconds}s`);

      return timeParts.join(" ");
    },
    description: "Total time spent on the platform"
  },
  {
    key: "total_time_spent_seconds",
    label: "Total Quiz Playtime",
    icon: <GiPlayerTime />,
    format: (v) => {
      const total = v ?? 0;

      const days = Math.floor(total / 86400);
      const hours = Math.floor((total % 86400) / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const seconds = total % 60;

      const timeParts = [];

      if (days > 0) timeParts.push(`${days}d`);
      if (hours > 0) timeParts.push(`${hours}h`);
      if (minutes > 0) timeParts.push(`${minutes}min`);
      if (seconds > 0 || timeParts.length === 0) timeParts.push(`${seconds}s`);

      return timeParts.join(" ");
    },
    description: "Total time spent playing quizzes"
  },
];
