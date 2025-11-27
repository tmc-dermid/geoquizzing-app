import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON, useMap, TileLayer, ScaleControl } from "react-leaflet";
import supabase from '../helper/supabaseClient.js';
import { motion } from 'framer-motion';
import '../styles/App.less';
import '../styles/Atlas.less';
import "leaflet/dist/leaflet.css";


function FitBounds({ geoJsonData }) {
  const map = useMap();

  useEffect(() => {
    if (!geoJsonData) return;

    const geoJsonLayer = L.geoJSON(geoJsonData);
    map.fitBounds(geoJsonLayer.getBounds(), {
      padding: [10, 10],
    });
  }, [geoJsonData, map]);

  return null;
}

function FitBoundsZoom({ geoJsonData }) {
  const map = useMap();

  useEffect(() => {
    if (!geoJsonData) return;

    const geoJsonLayer = L.geoJSON(geoJsonData);
    map.fitBounds(geoJsonLayer.getBounds(), {
      padding: [150, 150],
    });
  }, [geoJsonData, map]);

  return null;
}


export default function Atlas() {

  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [modalPage, setModalPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingShape, setLoadingShape] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");


  useEffect(() => {
    const fetchCountries = async () => {
      const { data, error } = await supabase
        .from("countries")
        .select(`
          country_id,
          country_name,
          country_code,
          population,
          area,
          flag_url,
          highest_point_name,
          highest_point,
          type,
          country_continent (
            continents (
              continent_name
            )
          ),
          country_capital (
            capitals (
              capital_name
            )
          ),
          country_currency (
            currencies (
              currency_name,
              currency_symbol,
              currency_code
            )
          )
        `)
        .order("country_name", { ascending: true });

      if (error) {
        console.error("Error fetching countries:", error);
      } else {
        console.log("Fetched countries:", data);
        console.log("Error:", error);
        setCountries(data);
      }

      setLoading(false);
    };

    fetchCountries();
  }, []);

  const closeModal = () => {
    setSelectedCountry(null);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [closeModal]);

  const fetchCountryShape = async (country_id) => {
    setLoadingShape(true);

    const { data, error } = await supabase
      .from("country_shapes")
      .select("geom")
      .eq("country_id", country_id)
      .single();
    
    if (error) {
      console.error("Błąd pobierania konturu:", error);
      setLoadingShape(false);
      return null;
    }

    setLoadingShape(false);
    return data;
  };

  const handleCardClick = async (country) => {
    setSelectedCountry(country);
    setModalPage(0);
  };

  const nextModalPage = async () => {
    if (modalPage === 0) {
      setModalPage(1);
      if (!selectedCountry.shape) {
        const shapeData = await fetchCountryShape(selectedCountry.country_id);
        if (shapeData) {
          setSelectedCountry((prev) => ({ ...prev, shape: shapeData }))
        }
      }
    } else if (modalPage === 1) {
      setModalPage(2);
    }
  };

  const prevModalPage = () => {
    if (modalPage > 0) {
      setModalPage((prev) => prev - 1)
    }
  };

  const filteredCountries = countries.filter((country) => {

    const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s|-/g, "");

    const continent = country.country_continent?.map((rel) => normalize(rel.continents?.continent_name || "")) || [];

    const matchesContinent = selectedContinent === "all" || continent.includes(normalize(selectedContinent));

    const matchesType =
      selectedType === "all" ||
      (selectedType === "only-countries" && country.type === "country") ||
      (selectedType === "only-territories" && country.type === "territory");

    const  normalizedQuery = normalize(searchQuery);

    const matchesSearch =
      normalizedQuery === "" ||
      normalize(country.country_name).includes(normalizedQuery) ||
      country.country_capital?.some((rel) => normalize(rel.capitals?.capital_name || "").includes(normalizedQuery)) ||
      country.country_currency?.some((rel) => normalize(rel.currencies.currency_name || "").includes(normalizedQuery)) ||
      normalize(country.highest_point_name || "").includes(normalizedQuery);

    return matchesContinent && matchesType && matchesSearch;
  });

  const sortedCountries = [...filteredCountries].sort((a, b) => {
    switch(sortOption) {
      case "name-asc":
        return a.country_name.localeCompare(b.country_name);

      case "name-desc":
        return b.country_name.localeCompare(a.country_name);

      case "population-asc":
        return (a.population || 0) - (b.population || 0);

      case "population-desc":
        return (b.population || 0) - (a.population || 0);

      case "area-asc":
        return (a.area || 0) - (b.area || 0);

      case "area-desc":
        return (b.area || 0) - (a.area || 0);

      default:
        return 0;
    }
  });

  return (
    <div className="country-search-container">
      <div className="atlas-header">
        <h1>Atlas of the World</h1>
      </div>
      <div className="search-info">
        <p>
          Search for any country or territory by its&nbsp;
          <strong><i>name</i></strong>, <strong><i>capital city</i></strong>, <strong><i>currency</i></strong>, or <strong><i>highest point</i></strong>.
          <br />
          You can also use the filters below to narrow down your results by <i>continent</i> and <i>type</i> (<b>country</b> / <b>territory</b>),
          <br />
          and sort the results by <strong>name</strong>, <strong>population</strong>, or <strong>area</strong>.
        </p>
      </div>
      <div className="search-bar">
        <div className="filters">
          <select
            className="filter-select"
            value={selectedContinent}
            onChange={(e) => setSelectedContinent(e.target.value)}
          >
            <option value="all">All Continents</option>
            <option value="africa">Africa</option>
            <option value="asia">Asia</option>
            <option value="europe">Europe</option>
            <option value="north-america">North America</option>
            <option value="south-america">South America</option>
            <option value="oceania">Oceania</option>
          </select>
          <select
            className="filter-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All</option>
            <option value="only-countries">Only Countries</option>
            <option value="only-territories">Only Territories</option>
          </select>
          <select
            className="filter-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="name-asc">A ➝ Z</option>
            <option value="name-desc">Z ➝ A</option>
            <option value="population-asc">Population ↑</option>
            <option value="population-desc">Population ↓</option>
            <option value="area-asc">Area ↑</option>
            <option value="area-desc">Area ↓</option>
          </select>
        </div>
        <div className="search-input">
          <input
            type="search"
            placeholder="Search for a country or territory..."
            value={searchInput}
            onChange={(e) => {
              const value = e.target.value;
              setSearchInput(value);

              if (value.trim() === "") {
                setSearchQuery("");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchQuery(searchInput.trim());
              }
            }}
          />
        </div>
        <button
          className="search-button"
          onClick={() => setSearchQuery(searchInput.trim())}
        >Search</button>
      </div>

      {!loading && (
        <p className="results-count">
          Found <strong>{filteredCountries.length}</strong> item{filteredCountries.length !== 1 ? 's' : ''} in total.
        </p>
      )}

      <div className="result-container">
        {sortedCountries.length === 0 ? (
          <h3 className="no-results">No countries found.</h3>
        ) : (
          sortedCountries.map((country) => (
            <div
              key={country.country_id}
              className="country-card"
              onClick={() => handleCardClick(country)}
            >
              <img
                src={country.flag_url}
                alt={`${country.country_name} flag`}
                className="country-flag"
              />
              <h3>{country.country_name}</h3>
              <p>
                <strong>Capital City:</strong>
                {" "}{country.country_capital?.map((rel) => rel.capitals?.capital_name).join(", ") || "N/A"}
              </p>
              <p>
                <strong>Population:</strong>
                {" "}{country.population?.toLocaleString()}
              </p>
              <p>
                <strong>Area:</strong>
                {" "}{country.area?.toLocaleString()} km<sup>2</sup>
              </p>
              <p>
                <strong>Continent:</strong>
                {" "}{country.country_continent?.map((rel) => rel.continents?.continent_name).join(", ") || "N/A"}
              </p>
            </div>
          ))
        )}
      </div>

      {selectedCountry && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>×</button>

            <div className="page-number">
              Page {modalPage + 1} / 3
            </div>

            <button
              className={`nav-arrow left ${modalPage === 0 ? "disabled" : ""}`}
              onClick={prevModalPage}
              disabled={modalPage === 0}
            >◀</button>
            <button
              className={`nav-arrow right ${modalPage === 2 ? "disabled" : ""}`}
              onClick={nextModalPage}
              disabled={modalPage === 2}
            >▶</button>

            <div className="modal-content">
              {modalPage === 0 && (
                <>
                  <img
                    src={selectedCountry.flag_url}
                    alt={`${selectedCountry.country_name} flag`}
                    className="modal-flag"
                  />
                  <h2>{selectedCountry.country_name}</h2>
                  <hr />
                  <p>
                    <strong>Capital City:</strong>
                    {" "}{selectedCountry.country_capital?.map((rel) => rel.capitals?.capital_name).join(", ") || "N/A"}
                  </p>
                  <p>
                    <strong>Population:</strong>
                    {" "}{selectedCountry.population?.toLocaleString()}
                  </p>
                  <p>
                    <strong>Area:</strong>
                    {" "}{selectedCountry.area?.toLocaleString()} km<sup>2</sup>
                  </p>
                  <p>
                    <strong>Country Code:</strong> {selectedCountry.country_code}
                  </p>
                  <p>
                    <strong>Currency:</strong>
                    {" "}{selectedCountry.country_currency?.map((rel) => rel.currencies?.currency_name).join(", ") || "N/A"}                     
                  </p>
                  <p>
                    <strong>Currency Code:</strong>
                    {" "}{selectedCountry.country_currency?.map((rel) => rel.currencies.currency_code).join(", ") || "N/A"}
                  </p>
                  <p>
                    <strong>Currency Symbol:</strong>
                    {" "}{selectedCountry.country_currency?.map((rel) => rel.currencies.currency_symbol).join(", ") || "N/A"}      
                  </p>
                  <p>
                    <strong>Highest Point:</strong>
                    {" "}{selectedCountry.highest_point_name ? (
                      <>
                        {selectedCountry.highest_point_name} (
                        {selectedCountry.highest_point} m){" "}
                        <em>
                          [{(selectedCountry.highest_point * 3.2808399).toFixed(2)} ft]
                        </em>
                      </>
                    ) : (
                      "Unknown"
                    )}
                  </p>
                  <p>
                    {selectedCountry.country_continent?.map((rel) => rel.continents?.continent_name).join(", ") || "N/A"}    
                  </p>
                </>
              )}

              {modalPage === 1 && (
                <div className="map-container">
                  <h2>Country Shape</h2>
                  <h3>{selectedCountry.country_name}</h3>
                  <div
                    style={{
                      height: "60vh",
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: "10px",
                      backgroundColor: "#f0f0f0",
                      overflow: "hidden",
                    }}
                  >
                    {loadingShape ? (
                      <p className="loading-info">Loading shape...</p>
                    ) : selectedCountry.shape?.geom ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{ width: "100%", height: "100%" }}
                      >
                        <MapContainer
                          style={{
                            height: "100%",
                            width: "100%",
                            borderRadius: "10px",
                            backgroundColor: "#ededed",
                          }}
                          center={[0, 0]}
                          zoom={3}
                          scrollWheelZoom={true}
                          zoomControl={true}
                          attributionControl={true}
                        >
                          <GeoJSON
                            data={selectedCountry.shape.geom}
                            style={{
                              color: "black",
                              weight: 1,
                              fillColor: "#4d5599",
                              fillOpacity: 1,
                            }}
                          />
                          <FitBounds geoJsonData={selectedCountry.shape.geom} />
                          <ScaleControl
                            position="bottomleft"
                            metric={true}
                            imperial={false}
                            maxWidth={125}
                          />
                        </MapContainer>
                      </motion.div>
                    ) : (
                      <p className="loading-info">No shape data available</p>
                    )}
                  </div>
                  <p className="map-hint">
                    <b>Hint: </b>You can <strong>zoom in/out</strong> and <strong>drag</strong> the map to take a closer look at the country's or territory's shape.
                  </p>
                </div>
              )}

              {modalPage === 2 && (
                <div className="map-container">
                  <h2>Location on a Map</h2>
                  <h3>{selectedCountry.country_name}</h3>
                  <div
                    style={{
                      height: "60vh",
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: "10px",
                      backgroundColor: "#f0f0f0",
                      overflow: "hidden",
                    }}
                  >
                    {selectedCountry.shape?.geom ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{ width: "100%", height: "100%" }}
                      >
                      <MapContainer
                        style={{ height: "100%", width: "100%" }}
                        center={[20, 0]}
                        zoom={2}
                        scrollWheelZoom={true}
                        zoomControl={true}
                        attributionControl={true}
                      >
                        {/* <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                        /> */}
                        <TileLayer
                          url={`https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=rcS5xwvjB4Tdl7NYEcZV`}
                          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <GeoJSON
                          data={selectedCountry.shape.geom}
                          style={{
                            color: "#ff0000",
                            weight: 2,
                            fillColor: "#ffcccc",
                            fillOpacity: 0.6,
                          }}
                        />
                        <FitBoundsZoom geoJsonData={selectedCountry.shape.geom}/>
                        <ScaleControl
                          position="bottomleft"
                          metric={true}
                          imperial={false}
                          maxWidth={125}
                        />
                      </MapContainer>
                      </motion.div>
                    ) : (
                      <p className="loading-info">No shape data available</p>
                    )}
                  </div>
                  <p className="map-hint">
                    <b>Hint: </b>You can <strong>zoom in/out</strong> and <strong>drag</strong> the map to see where this country or territory is located in the world.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}     
    </div>
  );
}



