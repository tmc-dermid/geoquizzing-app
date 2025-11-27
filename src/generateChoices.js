import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateChoicesJSON() {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('question_id, correct_answer')
    .order('question_id', {ascending: true})
    .range(0, 1000);

  if (error) {
    console.error('Błąd przy pobieraniu pytań:', error);
    return;
  }

  const allChoices = [];

  for (const question of questions) {
    
    const q_id = question.question_id;
    const correctAnswers = question.correct_answer;

    const answers = [
      'OdpowiedźA',
      'OdpowiedźB',
      'OdpowiedźC',
      'OdpowiedźD',
      'OdpowiedźE',
      'OdpowiedźF',
    ];

    for (let i = 0; i < answers.length; i++) {
      const label = String.fromCharCode(65 + i);

      allChoices.push({
        question_id: q_id,
        label: label,
        choice_text: answers[i],
        is_correct: label === 'A',
      });
    }
  }

  fs.writeFileSync('question_choices_all.json', JSON.stringify(allChoices, null, 2));

  console.log('Plik question_choices_all.json został wygenerowany.');
}

generateChoicesJSON();
