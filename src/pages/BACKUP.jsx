  
  const handleChoiceClick = async (choice) => {
    if (answered) return;

    const isCorrect = choice.is_correct;
    const userAnswerArray = [choice.choice_text];

    setSelected([choice.label]);
    setIsAnsCorrect(isCorrect);
    setAnswered(true);

    await supabase
      .from('quiz_questions')
      .update({
        user_answer: userAnswerArray,
        is_correct: isCorrect,
        answer_time_seconds: Math.floor((Date.now() - shownAt) / 1000)
      })
      .eq('quiz_question_id', questionData.quiz_question_id);

    const isLast = parseInt(question_order) >= sessionData.num_questions;

    await supabase.rpc("increment_quiz_session_totals", {
      p_session_id: session_id,
      p_inc_correct: isCorrect ? 1 : 0,
      p_inc_incorrect: isCorrect ? 0 : 1,
      p_mark_completed: isLast
    });

    goToNextQuestion();
  };


    const handleInputSubmit = async () => {
    if (answered) return;

    const userAnswers = inputAnswer
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter((a) => a.length > 0);

    const correctAnswers = questionData.question.correct_answer.map((a) => a.toLowerCase());

    const correct = userAnswers.every(ans => correctAnswers.includes(ans));
    setIsAnsCorrect(correct);
    setAnswered(true);

    await supabase
      .from('quiz_questions')
      .update({
        user_answer: userAnswers,
        is_correct: correct,
        answer_time_seconds: Math.floor((Date.now() - shownAt) / 1000)
      })
      .eq('quiz_question_id', questionData.quiz_question_id);

    const isLast = parseInt(question_order) >= sessionData.num_questions;

    await supabase.rpc("increment_quiz_session_totals", {
      p_session_id: session_id,
      p_inc_correct: correct ? 1 : 0,
      p_inc_incorrect: correct ? 0 : 1,
      p_mark_completed: isLast
    });

    goToNextQuestion();
  };


              <motion.div
              key={`choices-${question_order}`}
              className={`choices-grid ${difficulty === "easy" ? "grid-2x2" : "grid-2x3"}`}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
            >
              {choices.map((choice) => (
                <button
                  key={choice.label}
                  className={`choice-btn ${
                    answered ? choice.is_correct ? "correct" : selected.includes(choice.label) ? "wrong" : "" : ""
                  }`}
                  onClick={() => handleChoiceClick(choice)}
                  disabled={answered}
                >
                  <span className='choice-label'>{choice.label}</span> {choice.choice_text}
                </button>
              ))}
            </motion.div>