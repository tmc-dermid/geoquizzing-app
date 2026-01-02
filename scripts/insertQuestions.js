import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const questions = JSON.parse(fs.readFileSync('questions-shapes.json', 'utf8'));

async function importQuestions() {

    const { data, error } = await supabase
        .from('questions')
        .insert(questions);

    if (error) {
        console.error('❌ Błąd podczas importu:', error);
    } else {
        console.log(`✅ Zaimportowano ${questions.length} pytań`);
    }
}

importQuestions();