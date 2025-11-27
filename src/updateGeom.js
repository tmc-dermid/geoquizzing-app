import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateGeomShape() {

  const geojson = JSON.parse(fs.readFileSync('nauru_shape.geojson', 'utf-8'));
  
  const { data, error } = await supabase
    .from('country_shapes')
    .update({ geom: geojson.features[0].geometry })
    .eq('country_id', 146);

  if (error) {
    console.error('Błąd aktualizacji:', error);
  } else {
    console.log('Zaktualizowano geometrię kraju w country_shapes.');
  }
}

updateGeomShape();