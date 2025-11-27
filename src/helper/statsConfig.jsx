import { FaStar, FaCheck, FaTimes, FaCheckCircle, FaTimesCircle, FaQuestion, FaLightbulb, FaRegLightbulb, FaHourglassHalf } from "react-icons/fa";
import { MdLightbulbCircle, MdQuestionMark, MdAssignmentTurnedIn  } from "react-icons/md";
import { AiFillThunderbolt } from "react-icons/ai";

export const generalStatsConfig = [
  {
    key: "points",
    label: "Total Points",
    icon: <FaStar />,
    description: "Total points earned so far"
  },
  {
    key: "total_quizzes_taken",
    label: "Total Quizzes Taken",
    icon: <MdAssignmentTurnedIn />,
    description: "Total number of quizzes you have attempted"
  },
  {
    key: "total_questions_answered",
    label: "Total Questions Answered",
    icon: <FaQuestion />,
    description: "Total number of questions you have answered in all quizzes"
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
  {
    key: "longest_streak",
    label: "Longest Correct Streak",
    icon: <AiFillThunderbolt />,
    description: "The longest sequence of consecutive correct answers"
  },
];
