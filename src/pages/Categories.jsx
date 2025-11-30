import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from '../helper/supabaseClient.js';
import '../styles/Categories.less';


export default function Categories() {

  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('category_id, category_name, category_img')
        .order('category_name', { ascending: true });

      if (error) console.error("Error fetching categories:", error);
      else setCategories(data);

      setLoading(false);
    };

    fetchCategories();
  }, []);

  const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredCategories = categories.filter((cat) => 
    normalize(cat.category_name).includes(normalize(searchQuery))
  );

  return (
    <div className="category-search-container">
      <h1>Categories</h1>
      <div className="search-info">
        <p>
          Search for any category by its <strong><i>name</i></strong>.
        </p>
      </div>

      <div className="search-bar">
        <div className="search-input">
          <input
            type="search"
            placeholder="Search for a category..."
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

      {loading ? (
        <p>Loading categories...</p>
      ) : (
        <div className="result-container">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <div
                className="result-card"
                key={cat.category_id}
                onClick={() => navigate(`/categories/${cat.category_id}`)}
              >
                <img
                  src={cat.category_img}
                  alt={cat.category_name}
                  loading="lazy"
                  className="result-img"
                />
                <div className="result-name">
                  <p>{cat.category_name}</p>
                </div>
              </div>
            ))
          ) : (
            <h3 className="no-results">No categories found...</h3>
          )}
        </div>
      )}
    </div>
  );
}
