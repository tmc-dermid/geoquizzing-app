import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const nameMapping = {
    'Bonaire': 'Caribbean Netherlands',
    'Saint Helena Island': 'Saint Helena, Ascension and Tristan da Cunha',
    'South Georgia and the South Sandwich Islands': 'South Georgia',
    'Svalbard and Jan Mayen Islands': 'Svalbard and Jan Mayen',
    'Democratic Republic of the Congo': 'DR Congo'
};

const excludedCountries = [
    'Antarctica', 'Bouvet Island', 'Caribbean Netherlands', 'Heard Island and McDonald Islands',
    'Hong Kong','Isle of Man', 'Macau', 'United States Minor Outlying Islands'
];

async function updateCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,population');
        const allCountries = await response.json();
  
        const countryData = {};

        allCountries.forEach(country => {
            if (!country.population) return;
            countryData[country.name.common] = {
                population: country.population
            };
        });

        const { data: myCountries, error } = await supabase
            .from('countries')
            .select('country_id, country_name, population');

        if (error) {
            console.error('❌ Błąd pobierania krajów:', error);
            throw error;
        }

    for (const entry of myCountries) {
      const apiName = nameMapping[entry.country_name] || entry.country_name;
      if (excludedCountries.includes(apiName)) {
        console.log(`⏩ Pominięto: ${apiName}`);
        continue;
      }

      const apiData = countryData[apiName];
      if (!apiData) {
        console.warn(`⚠️ Brak danych w API dla: ${apiName}`);
        continue;
      }

      if (entry.population !== apiData.population) {
        console.log(`Aktualizuję populację dla: ${entry.country_name}`);
        const { error: updateError } = await supabase
          .from('countries')
          .update({ population: apiData.population })
          .eq('country_id', entry.country_id);

        if (updateError) {
          console.error(`❌ Błąd aktualizacji ${entry.country_name}:`, updateError);
        } else {
          console.log(`✅ Zaktualizowano ${entry.country_name}`);
        }
      } else {
        console.log(`⚠️ Brak zmian dla: ${entry.country_name}`);
      }
    }

  } catch (error) {
    console.error('❌ Błąd podczas aktualizacji:', error);
  }
}

updateCountries();
