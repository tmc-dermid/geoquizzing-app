import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const excludedCountries = [
    'Antarctica', 'Bouvet Island', 'Gibraltar', 'Heard Island and McDonald Islands',
    'Hong Kong', 'Isle of Man', 'Macau', 'United States Minor Outlying Islands'
];

async function insertCapitals() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const countries = await response.json();

        const capitalSet = new Set();

        countries.forEach(country => {
            const countryName = country.name?.common;
            if (!countryName || excludedCountries.includes(countryName)) return;

            const capitals = country.capital;
            if (!capitals || !Array.isArray(capitals)) return;

            capitals.forEach(capital => {
                if (capital && typeof capital === 'string') {
                    capitalSet.add(capital.trim());
                }
            });
        });

        const capitalList = Array.from(capitalSet)
            .sort((a, b) => a.localeCompare(b))
            .map(capital => ({
                capital_name: capital
            }));

        const { error } = await supabase
        .from('capitals')
        .insert(capitalList);

        if (error) {
            console.error('❌ Błąd podczas wstawiania danych do Supabase:', error);
        } else {
            console.log('✅ Stolice zostały pomyślnie dodane!');
        }
    } catch (error) {
        console.error('❌ Błąd podczas pobierania danych:', error);
    }
}

insertCapitals();