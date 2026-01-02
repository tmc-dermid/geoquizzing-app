import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Generate tokens and slugs for subcategories

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function generateSlug(name) {

  let slugName = name.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');

  return slugName;
}

async function updateSubcategories() {
  const { data: quizzes, error} = await supabase
    .from("subcategories")
    .select('subcategory_id, subcategory_name');

  if (error) {
    console.error("Error fetching Subcategories:", error);
    return;
  }

  for (const quiz of quizzes) {

    if (quiz.slug) continue;

    const slug = generateSlug(quiz.subcategory_name);

    const { error: updateErr } = await supabase
      .from("subcategories")
      .update({ slug })
      .eq('subcategory_id', quiz.subcategory_id);

    if (updateErr) {
      console.error(`Error updating subcategory ${quiz.subcategory_id}:`, updateErr);
    } else {
      console.log(`Updated subcategory ${quiz.subcategory_id}: slug=${slug}`);
    }
  }
}

updateSubcategories();