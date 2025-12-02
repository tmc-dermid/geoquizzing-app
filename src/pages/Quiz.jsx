import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { motion } from "framer-motion";
import Select from "react-select";
import supabase from "../helper/supabaseClient.js";
import { AuthContext } from "../context/AuthContext.jsx";
import "../styles/Quiz.less";

const questionSteps = [5, 10, 25, 50, 100, 150, 200];

function generateQuestionOptions(subcategory, includeDeps) {
  if (!subcategory) return [];

  const countriesCount = subcategory.countries_count || 0;
  const territoriesCount = subcategory.territories_count || 0;
  const total = includeDeps ? countriesCount + territoriesCount : countriesCount;

  if (total <= 0) return [];

  const opts = questionSteps.filter(n => n <= total).map(n => ({ value: n, label: String(n) }));

  if (opts.length === 0 || opts[opts.length - 1].value !== total) {
    opts.push({ value: total, label: `${total} (All)` });
  }
  return opts;
}


export default function Quiz() {

  const { token, slug } = useParams(); 
  const navigate = useNavigate();

  const { profile } = useContext(AuthContext);

  const [difficulty, setDifficulty] = useState("easy");
  const [includeDependencies, setIncludeDependencies] = useState(false);
  const [numQuestions, setNumQuestions] = useState(null);
  const [availableQuestionOptions, setAvailableQuestionOptions] = useState([]);
  const [subcategory, setSubcategory] = useState(null);
  const [loading, setLoading] = useState(true);

  const difficultyOptions = [
    { value: "easy", label: "Easy (ABCD)" },
    { value: "medium", label: "Medium (ABCDEF)" },
    { value: "hard", label: "Hard (Input answer)" },
  ];


  useEffect(() => {
    const fetchSubcategory = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_subcategory_full", {
        slug_input: slug
      });

      if (error) {
        console.error("Error loading quiz:", error);
        setSubcategory(null);
      } else {
        setSubcategory(data && data[0] ? data[0] : null);
      }

      setLoading(false);
    };
    
    fetchSubcategory();
  }, [slug]);

  useEffect(() => {
    if (!subcategory) {
      setAvailableQuestionOptions([]);
      setNumQuestions(null);
      return;
    }

    const opts = generateQuestionOptions(subcategory, includeDependencies);
    setAvailableQuestionOptions(opts);

    if (opts.length > 0) {
      const exists = opts.some(o => o.value === numQuestions);

      if (!exists) setNumQuestions(opts[0].value);
    } else {
      setNumQuestions(null);
    }
  }, [subcategory, includeDependencies]);

  if (loading) return <div className="quiz-loading">Loading quiz...</div>;
  if (!subcategory) return <div className="quiz-error">Quiz not found.</div>;

  const startQuiz = async () => {
    if (!numQuestions || numQuestions <= 0) {
      alert("Please choose number of questions.");
      return;
    }

    const { data, error } = await supabase.rpc("create_quiz_session", {
      p_user_id: profile.id,
      p_subcategory_id: subcategory.subcategory_id,
      p_difficulty: difficulty,
      p_num_questions: numQuestions,
      p_with_dependencies: includeDependencies
    });


    if (error) {
      console.error("Error:", error);
      return;
    }

    navigate(`/quiz/${data}/1`);
  };

  return (
    <motion.div
      className="quiz-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="quiz-card">
        <div className="quiz-header">
          {subcategory?.subcategory_img && (
            <img
              src={subcategory?.subcategory_img}
              alt={subcategory?.subcategory_name}
              className="quiz-thumbnail"
            />
          )}

          <h2 className="quiz-title">{subcategory?.subcategory_name}</h2>
          <div className="quiz-info">
            <p><strong>Countries: </strong><span>{subcategory?.countries_count}</span></p>
            <p><strong>Territories: </strong>{subcategory?.territories_count}</p>
          </div>
        </div>

        <div className="quiz-settings">
          <div className="setting-item">
            <label className="setting-label">Difficulty:</label>
            <Select
              options={difficultyOptions}
              defaultValue={difficultyOptions.find(o => o.value === difficulty)}
              onChange={(opt) => setDifficulty(opt.value)}
            />
          </div>

          {subcategory?.region !== "Dependent Territories" && (
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
              options={availableQuestionOptions}
              value={availableQuestionOptions.find(o => o.value === numQuestions) || null}
              onChange={(opt) => setNumQuestions(opt.value)}
              isDisabled={availableQuestionOptions.length === 0}
              placeholder={availableQuestionOptions.length === 0 ? "No questions available" : "Select..."}
              styles={{
                menu: (provided) => ({
                  ...provided,
                }),
                menuList: (provided) => ({
                  ...provided,
                  maxHeight: 150,
                  overflowY: "auto",
                }),
                control: (provided) => ({
                  ...provided,
                  minHeight: 40,
                }),
              }}
            />
          </div>

          <button className="start-quiz-btn" onClick={startQuiz}>
            Start Quiz
          </button>
        </div>
      </div>
    </motion.div>
  );
}