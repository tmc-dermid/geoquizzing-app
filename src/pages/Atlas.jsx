import React, { useState, useEffect } from "react";

const CountryInfo = () => {
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllCountries = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all");
        if (!response.ok) throw new Error("Failed to fetch countries");
        const result = await response.json();
        const countryData = result.map(country => ({
          name: country.name.common,
          population: country.population,
          flag: country.flags.svg,
          isoCode2: country.cca2,
          area: country.area,
          capital: country.capital ? country.capital.join(", ") : "No capital",
          currency: country.currencies ? Object.values(country.currencies).map(currency => currency.name).join(", ") : "No currency",
        })).sort((a, b) => a.name.localeCompare(b.name));
        setCountries(countryData);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchAllCountries();
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Atlas</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
        {countries.map((country, index) => (
          <div key={index} style={{ border: "1px solid #ccc", padding: "10px", minWidth: "calc(20% - 10px)", boxSizing: "border-box" }}>
            <h2>{country.name} ({country.isoCode2})</h2>
            <img src={country.flag} alt={`Flag of ${country.name}`} style={{ width: "100px", height: "auto", marginTop: "10px" }} />
            <p>Capital: {country.capital}</p>
            <p>Population: {country.population.toLocaleString()}</p>
            <p>Currency: {country.currency}</p>
            <p>Area: {country.area}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountryInfo;
