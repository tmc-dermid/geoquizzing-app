import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const qChoices = JSON.parse(fs.readFileSync('question_choices_all.json', 'utf-8'));

async function insertQuestionChoices() {

    console.log(`Rozpoczynanie importu ${qChoices.length} rekordów...`);

    const batchSize = 1000;
    let totalInserted = 0;

    for (let i = 0; i < qChoices.length; i += batchSize) {
        const batch = qChoices.slice(i, i + batchSize);

        const { data, error } = await supabase
            .from('question_choices')
            .insert(batch);

        if (error) {
            console.error(`❌ Błąd przy batchu ${i / batchSize + 1}:`, error.message);
            return;
        }

        totalInserted =+ batch.length;
        
        console.log(`✅ Wstawiono ${totalInserted}/${qChoices.length} rekordów...`);
    }

    console.log('✅ Import zakończony pomyślnie!')
}

insertQuestionChoices();