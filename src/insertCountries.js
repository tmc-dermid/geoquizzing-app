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
    'Antarctica', 'Bouvet Island', 'Caribbean Netherlands', 'Heard Island and McDonald Islands', 'Hong Kong', 'Isle of Man', 'Macau', 'United States Minor Outlying Islands'
];

async function insertCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const allCountries = await response.json();

        const filteredCountries = allCountries
            .filter(country => {
                const name = country.name.common;
                return (
                    name[0] >= 'U' &&
                    name[0] <= 'Z' &&
                    !excludedCountries.includes(name)
                );
            })
            .sort((a, b) => a.name.common.localeCompare(b.name.common));

        const { data: existingCountries, error: fetchError } = await supabase
            .from('countries')
            .select('country_name');

        if (fetchError) throw fetchError;

        const existingNames = existingCountries.map(c => c.country_name);

        const countryData = filteredCountries
            .filter(country => {
                const originalName = country.name.common;
                const mappedName = Object.entries(nameMapping).find(
                    ([targetName, apiName]) => apiName === originalName
                )?.[0] || originalName;

                return !existingNames.includes(mappedName);
            })
            .map(country => {
                const originalName = country.name.common;

                const mappedName = Object.entries(nameMapping).find(
                    ([targetName, apiName]) => apiName === originalName
                )?.[0] || originalName;

                return {
                    country_name: mappedName,
                    country_code: country.cca2,
                    population: country.population,
                    area: country.area,
                    flag_url: country.flags?.png || null
                };
            });

        const { error } = await supabase
            .from('countries')
            .insert(countryData);

        if (error) {
            console.error('❌ Błąd podczas dodawania krajów:', error);
        } else {
            console.log('✅ Kraje zostały dodane pomyślnie');
        }
    } catch (error) {
        console.error('❌ Błąd podczas pobierania danych:', error);
    }
}

insertCountries();


