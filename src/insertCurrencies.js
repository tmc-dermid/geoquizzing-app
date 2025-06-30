import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertCurrencies() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const countries = await response.json();

        const currencyMap = new Map();

        countries.forEach(country => {
            const currencies = country.currencies;
            if (!currencies) return;

            Object.entries(currencies).forEach(([code, currency]) => {
                if (!currencyMap.has(code)) {
                    currencyMap.set(code, {
                        currency_name: currency.name || null,
                        currency_symbol: currency.symbol || null,
                        currency_code: code
                    });
                }
            });
        });

        const currencyList = Array.from(currencyMap.values()).sort((a, b) => {
            const nameA = a.currency_name?.toLowerCase() || '';
            const nameB = b.currency_name?.toLowerCase() || '';
            return nameA.localeCompare(nameB);
        });

        const { error } = await supabase
            .from('currencies')
            .insert(currencyList);

        if (error) {
            console.error('❌ Błąd podczas wstawiania danych do Supabase:', error);
        } else {
            console.log('✅ Waluty zostały pomyślnie dodane!');
        }
    } catch (error) {
        console.error('❌ Błąd podczas pobierania danych:', error);
    }
}

insertCurrencies();