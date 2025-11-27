import fs from "fs";
import fetch from "node-fetch";

const excludedCountries = [
    "Antarctica", "Bouvet Island", "Caribbean Netherlands", "Heard Island and McDonald Islands",
    "Hong Kong", "Isle of Man", "Macau", "United States Minor Outlying Islands", "Gibraltar", "Åland Islands"
];

const nameMapping = {
    "Bonaire": "Caribbean Netherlands",
    "Saint Helena Island": "Saint Helena, Ascension and Tristan da Cunha",
    "South Georgia and the South Sandwich Islands": "South Georgia",
    "Svalbard and Jan Mayen Islands": "Svalbard and Jan Mayen"
};

async function generatePeakQuestions() {
    const res = await fetch("https://restcountries.com/v3.1/all?fields=name");
    const countries = await res.json();

    const processedCountries = countries
        .map(country => {
            const originalName = country.name.common;
            const mappedName = nameMapping[originalName] || originalName;
            return {
                name: mappedName
            };
        })
        .filter(c => !excludedCountries.includes(c.name))
        .sort((a, b) => a.name.localeCompare(b.name));

    const peakQuestions = processedCountries.map((c, index) => ({
        country_id: index + 1,
        question_text: "What country or territory does this shape represent?",
        correct_answer: [`${c.name}`]
    }));

    fs.writeFileSync("questions-shapes.json", JSON.stringify(peakQuestions, null, 4), "utf8");

    console.log(`✅ Wygenerowano ${peakQuestions.length} pytań`);
}

generatePeakQuestions();
