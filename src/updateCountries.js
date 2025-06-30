import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const nameMapping = {
    'Bonaire': 'Caribbean Netherlands',
    'Saint Helena Island': 'Saint Helena, Ascension and Tristan da Cunha',
    'South Georgia and the South Sandwich Islands': 'South Georgia',
    'Svalbard and Jan Mayen Islands': 'Svalbard and Jan Mayen'
};

const excludedCountries = [
    'Antarctica', 'Bouvet Island', 'Caribbean Netherlands', 'Heard Island and McDonald Islands',
    'Hong Kong','Isle of Man', 'Macau', 'United States Minor Outlying Islands'
];

async function updateCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const allCountries = await response.json();
  
        const countryData = {};

        allCountries.forEach(country => {
            countryData[country.name.common] = {
                country_code: country.cca2,
                population: country.population,
                area: country.area,
                flag_url: country.flags.png
            };
        });

        let { data: myCountries, error } = await supabase
            .from('countries')
            .select('countryid, country_name, country_code');

        if (error) {
            console.error('❌ Błąd pobierania krajów:', error);
            throw error;
        }

        for (const entry of myCountries) {
            const apiName = nameMapping[entry.country_name] || entry.country_name;

            if (excludedCountries.includes(apiName)) {
                console.log(`Pominięto: ${apiName}`);
                continue;
            }

            const countryInfo = countryData[apiName];

            if (!countryInfo) {
                console.warn(`⚠️ Brak danych z API dla: ${apiName}`);
                continue;
            }

            console.log(`Aktualizuję kraj: ${entry.country_name}`);
            console.log('Dane z API do aktualizacji:', countryInfo);

            const { data: existingData, error: fetchError } = await supabase
                .from('countries')
                .select('population, area, flag_url, country_code')
                .eq('countryid', entry.countryid)
                .single();

            if (fetchError) {
                console.error(`❌ Błąd pobierania danych dla kraju ${entry.country_name}:`, fetchError);
                continue;
            }

            console.log(`Istniejące dane w bazie dla ${entry.country_name}:`, existingData);

            // Porównywanie danych z API z danymi w bazie
            let updateNeeded = false;
            const updates = {};

            if (existingData.population !== countryInfo.population) {
                updates.population = countryInfo.population;
                updateNeeded = true;
            }

            if (existingData.area !== countryInfo.area) {
                updates.area = countryInfo.area;
                updateNeeded = true;
            }

            if (existingData.flag_url !== countryInfo.flag_url) {
                updates.flag_url = countryInfo.flag_url;
                updateNeeded = true;
            }

            if (existingData.country_code !== countryInfo.country_code) {
                updates.country_code = countryInfo.country_code;
                updateNeeded = true;
            }

            if (updateNeeded) {
                console.log(`Aktualizuję dane dla: ${entry.country_name}`);

                const { error: updateError } = await supabase
                    .from('countries')
                    .update(updates)
                    .eq('countryid', entry.countryid);

                if (updateError) {
                    console.error(`❌ Błąd aktualizacji ${entry.country_name}:`, updateError);
                } else {
                    console.log(`✅ Zaktualizowano: ${entry.country_name}`);
                }
            } else {
                console.log(`⚠️ Brak zmian dla: ${entry.country_name}\n`);
            }
        }
        
    } catch (error) {
        console.error('❌ Błąd podczas aktualizacji:', error);
    }
}

updateCountries();
