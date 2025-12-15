import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const geojson = JSON.parse(fs.readFileSync('missing_territories.geojson', 'utf-8'));


for (const feature of geojson.features) {
  const rawName = feature.properties.NAME || feature.properties.name_en;

  const countryName = nameMap[rawName];
  
  if (!countryName) {
    continue;
  }

  const geom = feature.geometry;

  const { data: countries, error: countryError } = await supabase
    .from('countries')
    .select('country_id')
    .eq('country_name', countryName)
    .limit(1);

  if (!countries || countries.length === 0) {
    console.log(`Nie znaleziono kraju w tabeli: ${countryName}`);
    continue;
  }

  const countryId = countries[0].country_id;

  const { data, error } = await supabase
    .from('country_shapes')
    .insert([
      {
        country_id: countryId,
        geom: geom
      }
    ]);

  if (error) {
    console.error('Błąd wstawiania:', error);
  } else {
    console.log(`Dodano kraj: ${countryName}`);
  }
}

console.log('Gotowe!');
