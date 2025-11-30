import { useParams } from "react-router-dom";
import { useState } from "react";
import Select, { components } from "react-select";
import "../styles/Quiz.less";

export default function Quiz() {

  const { token, slug } = useParams(); 

  const [difficulty, setDifficulty] = useState("easy");
  const [includeDependencies, setIncludeDependencies] = useState(false);
  const [numQuestions, setNumQuestions] = useState(null);

  const difficultyOptions = [
    { value: "easy", label: "Easy (ABCD)" },
    { value: "medium", label: "Medium (ABCDEF)" },
    { value: "hard", label: "Hard (Input answer)" },
  ];

  const numQuestionsOptions = [
    { value: 5, label: "5" },
    { value: 10, label: "10" },
    { value: 25, label: "25" },
  ];

  return (
    <div className="quiz-container">
      <h3>Quiz: {slug} (token: {token})</h3>
    </div>
  );
}