import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { Slide, ToastContainer, toast } from 'react-toastify';
import supabase from '../helper/supabaseClient.js';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Quizzes.less';


export default function Quizzes() {
    const [quizzes, setQuizzes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedRegion, setSelectedRegion] = useState("all");
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState({});
    const [pendingFavs, setPendingFavs] = useState({});
    const [lastChangedFav, setLastChangedFav] = useState(null);

    const { user } = useContext(AuthContext);
    const { categoryId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
      const fetchQuizzes = async () => {
        const { data, error } = await supabase
          .from('subcategories')
          .select('*')
          .order('subcategory_name', { ascending: true });

        if (error) console.error("Error fetching quizzes:", error);
        else setQuizzes(data || []);

        setLoading(false);
      };

      fetchQuizzes();
    }, []);

    useEffect(() => {
      const fetchCategories = async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('category_id, category_name')
          .order('category_name', { ascending: true });

        if (error) console.error("Error fetching categories:", error);
        else setCategories(data || []);
      };

      fetchCategories();
    }, []);

    useEffect(() => {
      if(!user) {
        setFavorites({});
        return;
      }

      const fetchFavorites = async () => {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('subcategory_id')
          .eq('user_id', user.id);

        if (error) {
          console.error("Error fetching favorites:", error);
          return;
        }

        const favMap = {};
        (data || []).forEach((row) => {
          favMap[row.subcategory_id] = true
        });

        setFavorites(favMap);
      };
      
      fetchFavorites();
    }, [user]);


    useEffect(() => {
      if (!lastChangedFav) return;

      const { quizId, quizName, added} = lastChangedFav;

      if (added) {
        toast.success(<span>Added quiz <strong>{quizName}</strong> to favorites!</span>, {
          toastId: `fav-${quizId}`,
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          transition: Slide,
        });
      } else {
        toast.info(<span>Removed quiz <strong>{quizName}</strong> from favorites!</span>, {
          toastId: `fav-${quizId}-remove`,
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          transition: Slide,
        });
      }
    }, [lastChangedFav]);

    const normalize = (str) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredQuizzes = quizzes.filter((quiz) => {

      const matchesCategory = categoryId
        ? quiz.category_id === parseInt(categoryId)
        : selectedType === "all" || quiz.category_id === parseInt(selectedType);

      const matchesRegion =
        selectedRegion === "all" ||
        (selectedRegion === "dependent territories" && normalize(quiz.region) === "dependent territories") ||
        (selectedRegion !== "all" && selectedRegion !== "dependent territories" && normalize(quiz.region) === normalize(selectedRegion));

      const matchesSearch = normalize(quiz.subcategory_name).includes(normalize(searchQuery));

      return matchesCategory && matchesRegion && matchesSearch;
    });

    const toggleFavorite = async (quizId, quizName) => {
      if (!user) {
        toast.info("Sign In to add a quiz to favorites!");
        return;
      }

      if (pendingFavs[quizId]) return;

      const isFavorite = !!favorites[quizId];

      setFavorites(prev => ({ ...prev, [quizId]: !isFavorite }));
      setLastChangedFav({ quizId, quizName, added: !isFavorite });

      setPendingFavs(prev=> ({ ...prev, [quizId]: true }));

      try {
        if (isFavorite) {
          const { error } = await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('subcategory_id', quizId)

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('user_favorites')
            .insert({
              user_id: user.id,
              subcategory_id: quizId,
            });

          if (error) throw error;
        }
      } catch (err) {
        console.error("Favorite toggle failed:", err);

        setFavorites(prev => ({ ...prev, [quizId]: isFavorite }));
        toast.error("Failed to update favorites. Please try again.");

        setLastChangedFav(null);
      } finally {
        setPendingFavs(prev => {
          const copy = { ...prev };
          delete copy[quizId];
          return copy;
        });
      }
    };

  return (
    <div className="quizzes-search-container">
      <h1>All Quizzes</h1>
      <div className="search-info">
        <p>
          Search for any quiz by its <strong><i>name</i></strong>.
          <br />
          You can also use the filters below to narrow down your results by <i>category</i> or <i>region</i>.
        </p>
      </div>

      <div className="search-bar">
        <div className="filters">
          <select
            className="filter-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All</option>
            {categories.map((cat) =>(
              <option key={cat.category_id} value={cat.category_id}>
                {cat.category_name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="all">All Regions</option>
            <option value="africa">Africa</option>
            <option value="asia">Asia</option>
            <option value="europe">Europe</option>
            <option value="north america">North America</option>
            <option value="south america">South America</option>
            <option value="oceania">Oceania</option>
            <option value="dependent territories">Dependent Territories</option>
            <option value="world">World</option>
          </select>
        </div>
        <div className="search-input">
          <input
            type="search"
            placeholder="Search for a quiz..."
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
          Found <strong>{filteredQuizzes.length}</strong> quiz{filteredQuizzes.length !== 1 ? 'zes' : ''} in total.
        </p>
      )}

      {loading ? (
        <p>Loading quizzes...</p>
      ) : (
        <div className="result-container">
          {filteredQuizzes.length > 0 ? (
            filteredQuizzes.map((quiz) => (
              <div
                className="result-card"
                key={quiz.subcategory_id}
                onClick={() => navigate(`/quiz-menu/${quiz.slug}`)}
              >
                <img
                  src={quiz.subcategory_img}
                  alt={quiz.subcategory_name}
                  loading="lazy"
                  className="result-img"
                />
                {user && (
                  <div
                    className={`result-favorite
                      ${favorites[quiz.subcategory_id] ? "active" : ""}
                      ${pendingFavs[quiz.subcategory_id] ? "pending" : ""}`
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(quiz.subcategory_id, quiz.subcategory_name);
                    }}
                    title="Add to favorites!"
                  >
                    <AiOutlineHeart className="heart-icon outline" />
                    <AiFillHeart 
                      className="heart-icon fill"
                      style={{ opacity: favorites[quiz.subcategory_id] ? 1 : 0 }}
                    />
                  </div>
                )}
                
                <div className="result-name">
                  <p>{quiz.subcategory_name}</p>
                </div>
              </div>
            ))
          ) : (
            <h3 className="no-results">No quizzes found...</h3>
          )}
        </div>
      )}

      <ToastContainer />
    </div>
  );
}