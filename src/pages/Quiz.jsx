import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Select, { components } from "react-select";
import supabase from "../helper/supabaseClient.js";
import "../styles/Quiz.less";

export default function Quiz() {

  const { token, slug } = useParams(); 

  const [difficulty, setDifficulty] = useState("easy");
  const [includeDependencies, setIncludeDependencies] = useState(false);
  const [numQuestions, setNumQuestions] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchSubcategory = async () => {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('token', token)
        .eq('slug', slug)
        .single();

      if (error) {
        console.error("Error loading quiz info:", error);
      } else {
        setSubcategory(data);
      }

      setLoading(false);
    };
    
    fetchSubcategory();
  }, [token, slug]);

  if (loading) return <div className="quiz-loading">Loading quiz...</div>;
  if (!subcategory) return <div className="quiz-error">Quiz not found.</div>;

  return (
    <div className="quiz-container">
      <div className="quiz-card">
        <div className="quiz-header">
          {subcategory.subcategory_img && (
            <img
              src={subcategory.subcategory_img}
              alt={subcategory.subcategory_name}
              className="quiz-thumbnail"
            />
          )}

          <h2 className="quiz-title">{subcategory.subcategory_name}</h2>
        </div>
        <div className="quiz-settings">
          <div className="setting-item">
            <label className="setting-label">Difficulty:</label>
            <Select
              options={difficultyOptions}
              defaultValue={difficultyOptions[0]}
              onChange={(opt) => setDifficulty(opt.value)}
            />
          </div>

          {subcategory.region !== "Dependent Territories" && (
            <div className="setting-item checkbox-item">
              <label>
                <input
                  type="checkbox"
                  checked={includeDependencies}
                  onChange={() => setIncludeDependencies(!includeDependencies)}
                />
                <span className="checkmark"></span>
                Include Dependent Territories
              </label>
            </div>
          )}

          <div className="setting-item">
            <label className="setting-label">Number of Questions:</label>
            <Select
              options={numQuestionsOptions}
              onChange={(opt) => setNumQuestions(opt.value)}
            />
          </div>

          <button className="start-quiz-btn">
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  );
}