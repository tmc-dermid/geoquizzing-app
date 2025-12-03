import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AiFillHeart } from "react-icons/ai";
import { FaHeartBroken } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext.jsx";
import { Slide, ToastContainer, toast } from 'react-toastify';
import { motion, AnimatePresence } from "framer-motion";
import supabase from '../helper/supabaseClient.js';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Favorites.less';


export default function Favorites({ username }) {

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [favoriteQuizzes, setFavoriteQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState({});
  const [hovered, setHovered] = useState(null);
  const [ownerId, setOwnerId] = useState(null);


  useEffect(() => {
    async function fetchFavorites () {
      setLoading(true);

      let userId;

      if (user && user.id && username === user.username) {
        userId = user.id;
      } else {
        const { data: profile, error } = await supabase
          .from('user_profile')
          .select('id')
          .eq('username', username)
          .single();

        if (error || !profile) {
          console.error("Error fetching user profile:", error);
          setFavoriteQuizzes([]);
          setLoading(false);
          return;
        }

        userId = profile.id;
      }

      setOwnerId(userId);

      const { data: favRows, error: favError } = await supabase
        .from('user_favorites')
        .select('subcategory_id, created_at')
        .eq('user_id', userId);

      if (favError) {
        console.error("Error fetching favorites:", favError);
        setFavoriteQuizzes([]);
        setLoading(false);
        return;
      }

      const ids = favRows.map((f) => f.subcategory_id);

      if (ids.length === 0) {
        setFavoriteQuizzes([]);
        setLoading(false);
        return;
      }

      const { data: quizRows, error: quizError } = await supabase
        .from("subcategories")
        .select("*")
        .in("subcategory_id", ids);

      if (quizError) {
        console.error("Error loading quizzes:", quizError);
        setLoading(false);
        return;
      }

      const merged = quizRows.map(q => {
        const match = favRows.find(f => f.subcategory_id === q.subcategory_id);
        return { ...q, created_at: match?.created_at };
      });

      setFavoriteQuizzes(merged);
      setLoading(false);
    };

    fetchFavorites();
  }, [username, user]);

  const isOwner = user?.id && ownerId && user.id === ownerId;

  const removeFavorite = async (id) => {
    if (!isOwner) return;

    setPending((p) => ({ ...p, [id]: true }));

    const quiz = favoriteQuizzes.find(q => q.subcategory_id === id);
    const quizName = quiz?.subcategory_name ?? "quiz";

    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("subcategory_id", id);

    if (error) {
      console.error("Error removing favorite:", error);
      setPending((p) => ({ ...p, [id]: false }));
      return;
    }

    toast.info(<span>Removed quiz <strong>{quizName}</strong> from favorites!</span>, {
      toastId: `fav-${id}-remove`,
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      transition: Slide,
    });

    setFavoriteQuizzes((prev) => prev.filter((q) => q.subcategory_id !== id));
    setPending((p) => ({ ...p, [id]: false }));
  };

  if (loading) return <div className="favorites-wrapper"><h3>Loading...</h3></div>;

  if (favoriteQuizzes.length === 0) {
    return (
      <div className="favorites-wrapper">
        <h3 className="no-favorites">{isOwner ? "You have no favorites yet" : <span><strong>{username}</strong> has no favorites</span>}</h3>
      </div>
    );
  }

  const formatDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="favorites-wrapper">
      <h2 className="favorites-heading">Favorite Quizzes</h2>
      <div className="favorites-list">
        <AnimatePresence>
          {favoriteQuizzes.map((quiz) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="favorite-row"
              key={quiz.subcategory_id}
              onClick={() => navigate(`/quiz/${quiz.slug}`)}
            >
              <img
                src={quiz.subcategory_img}
                alt={quiz.subcategory_name}
                loading="lazy"
                className="favorite-thumb"
              />

              <div className="favorite-info">
                <h4>{quiz.subcategory_name}</h4>
                <p className="quiz-region">{quiz.region}</p>
                <p className="quiz-date">Added: {formatDate(quiz.created_at)}</p>
              </div>

              {isOwner && (
                <button
                  className={`favorite-remove ${pending[quiz.subcategory_id] ? "pending" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(quiz.subcategory_id);
                  }}
                  onMouseEnter={() => setHovered(quiz.subcategory_id)}
                  onMouseLeave={() => setHovered(null)}
                  title="Remove from favorites"
                >
                  <AnimatePresence mode="wait">
                    {hovered === quiz.subcategory_id ? (
                      <motion.div
                        key="broken"
                        initial={{ scale: 0.75, rotate: 5, opacity: 0.75 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0.75, rotate: -5, opacity: 0.75 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: "inline-block" }}
                      >
                        <FaHeartBroken className="heart-icon" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="filled"
                        initial={{ scale: 0.75, rotate: -5, opacity: 0.75 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0.75, rotate: 5, opacity: 0.75 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: "inline-block" }}                    
                      >
                        <AiFillHeart className="heart-icon" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <ToastContainer />
    </div>
  );
}