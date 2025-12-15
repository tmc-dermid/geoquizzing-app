import React, { useMemo } from "react";
import Select, { components } from "react-select";
import { useEffect, useState } from "react";
import { achievementIconMap, achievementIconOptions, categoryColors, categoryOrder } from "../../helper/achievementsConfig.js";
import { RiEdit2Line, RiDeleteBin5Line } from "react-icons/ri";
import { Slide, ToastContainer, toast } from 'react-toastify';
import supabase from "../../helper/supabaseClient.js";
import 'react-toastify/dist/ReactToastify.css';
import "./AchievementsAdmin.less";


const IconOption = (props) => {
  const IconComponent = achievementIconMap[props.data.value];
  return (
    <components.Option {...props}>
      {IconComponent && <IconComponent style={{ width: 20, height: 20, marginRight: 8}} />}
      {props.data.label}
    </components.Option>
  );
};

export default function AchievementsAdmin() {

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [sortOption, setSortOption] = useState("title-asc");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    icon: "GiFootsteps",
    condition_type: "quizzes_played",
    condition_value: 1,
    points: 0,
    category: "COMMON",
    target_difficulty: null,
    target_region: null,
    enableDifficulty: false,
    enableRegion: false,
  });

  useEffect(() => {
    load();
  }, [])

  async function load() {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("achievement_id");

    if (error) {
      console,error("Error loading achievements:", error);
      setLoading(false);
      return;
    }

    setAchievements(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from("achievements")
        .update({
          title: form.title,
          description: form.description,
          icon: form.icon,
          condition_type: form.condition_type,
          condition_value: form.condition_value,
          points: form.points,
          category: form.category,   
          target_difficulty: form.target_difficulty,
          target_region: form.target_region,    
        })
        .eq("achievement_id", editingId);

      if (error) {
        alert("Error updating achievement: " + error.message);
        return;
      }

      toast.success(<span>Successfully updated achievement: <strong>{form.title}</strong></span>, {
        toastId: `achievement-edit-${editingId}`,
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        transition: Slide,
        style: {
          background: '#e6ffed',
          color: '#1b5e20',
        },
      });

      setEditingId(null);
    } else {
      const { error } = await supabase
        .from("achievements")
        .insert({
          title: form.title,
          description: form.description,
          icon: form.icon,
          condition_type: form.condition_type,
          condition_value: form.condition_value,
          points: form.points,
          category: form.category,
          target_difficulty: form.target_difficulty,
          target_region: form.target_region,
        });

      if (error) {
        alert("Error: " + error.message);
        return;
      }
      toast.success(<span>Added new achievement: <strong>{form.title}</strong></span>, {
        toastId: `achievement-add-${form.title}`,
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        transition: Slide,
        style: {
          background: '#e6ffed',
          color: '#1b5e20',
        },
      });
    }

    load();
    setForm({
      title: "",
      description: "",
      icon: "GiFootsteps",
      condition_type: "quizzes_played",
      condition_value: 1,
      points: 0, 
      category: "COMMON",
      target_difficulty: null,
      target_region: null,
    });
  }


  function handleEdit(a) {
    setEditingId(a.achievement_id);

    setForm({
      title: a.title,
      description: a.description,
      icon: a.icon,
      condition_type: a.condition_type,
      condition_value: a.condition_value,
      points: a.points,
      category: a.category,
      target_difficulty: a.target_difficulty,
      target_region: a.target_region,
      enableDifficulty: a.target_difficulty !== null,
      enableRegion: a.target_region !== null,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  async function handleDelete(a) {
    const confirmDelete = window.confirm(`Are you sure you want to delete achievement "${a.title}"?`);

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("achievements")
      .delete()
      .eq("achievement_id", a.achievement_id);

    if (error) {
      alert("Error deleting achievement: " + error.message);
      return;
    }

    toast.info(<span>Successfully deleted achievement: <strong>{a.title}</strong></span>, {
      toastId: `achievement-delete-${a.achievement_id}`,
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      transition: Slide,
      style: {
        background: '#e3f2fd',
        color: '#0d47a1',
      },
    });

    load();
  }

  const filteredAndSorted = useMemo(() => {
    let result = [...achievements];

    if (filterCategory !== 'ALL') {
      result = result.filter((a) => a.category === filterCategory);
    }

    if (searchQuery.trim() !== "") {
      const lowerSearch = searchQuery.toLowerCase();
      result = result.filter((a) => 
        a.title.toLowerCase().includes(lowerSearch) ||
        a.description.toLowerCase().includes(lowerSearch)
      );
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case "title-asc":
          return a.title.localeCompare(b.title);

        case "title-desc":
          return b.title.localeCompare(a.title);

        case "points-asc":
          return a.points - b.points;

        case "points-desc":
          return b.points - a.points;

        default: 
          return 0;
      }
    });

    return result;
  }, [achievements, filterCategory, sortOption, searchQuery]);

  return (
    <div className="admin-wrapper">
      <h2>Manage Achievements</h2>

      <form className="achievement-form" onSubmit={handleSubmit}>
        <h3>{editingId ? "Edit Achievement" : "Add Achievement"}</h3>

        <label>Title:</label>
        <input
          placeholder="Title..."
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <label>Description:</label>
        <textarea
          placeholder="Description..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <label>Icon:</label>
        <Select
          isSearchable={false}
          value={{ value: form.icon, label: form.icon }}
          onChange={(selected) => setForm({ ...form, icon: selected.value })}
          options={achievementIconOptions
            .map(icon => ({ value: icon, label: icon }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          components={{
            Option: IconOption,
            IndicatorSeparator: () => null,
          }}
          menuPlacement="auto"
          styles={{
            menu: (provided) => ({
              ...provided,
            }),
            menuList: (provided) => ({
              ...provided,
              maxHeight: 250,
              overflowY: "auto",
            }),
            control: (provided) => ({
              ...provided,
              minHeight: 40,
            }),
          }}
        />

        <label>Condition Type:</label>
        <select
          value={form.condition_type}
          onChange={(e) => setForm({ ...form, condition_type: e.target.value })}
        >
          <option value="quizzes_played">quizzes_played</option>
          <option value="correct_answers">correct_answers</option>
          <option value="quiz_modes">quiz_modes</option>
          <option value="hints_used">hints_used</option>
          <option value="time_spent_seconds">time_spent_seconds</option>
          <option value="streak">streak</option>
          <option value="perfect_score">perfect_score</option>
        </select>

        <label>Condition Value:</label>
        <input
          type="number"
          value={form.condition_value}
          onChange={(e) => setForm({ ...form, condition_value: e.target.value })}
        />

        <label>
          Target Difficulty
          <input
            type="checkbox"
            checked={form.enableDifficulty}
            onChange={(e) =>
              setForm({
                ...form,
                enableDifficulty: e.target.checked,
                target_difficulty: e.target.checked ? form.target_difficulty || "easy" : null,
              })
            }
            style={{ marginLeft: 8 }}
          />
        </label>
        <select
          value={form.target_difficulty}
          onChange={(e) => setForm({ ...form, target_difficulty: e.target.value })}
          disabled={!form.enableDifficulty}
        >
          <option value="null">null</option>
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>

        <label>
          Target Region
          <input
            type="checkbox"
            checked={form.enableRegion}
            onChange={(e) =>
              setForm({
                ...form,
                enableRegion: e.target.checked,
                target_region: e.target.checked ? form.target_region || "easy" : null,
              })
            }
            style={{ marginLeft: 8 }}
          />
        </label>
        <select
          value={form.target_region}
          onChange={(e) => setForm({ ...form, target_region: e.target.value })}
          disabled={!form.enableRegion}
        >
          <option value="null">null</option>
          <option value="World">World</option>
          <option value="Asia">Asia</option>
          <option value="Africa">Africa</option>
          <option value="Europe">Europe</option>
          <option value="Oceania">Oceania</option>
          <option value="North America">North America</option>
          <option value="South America">South America</option>
          <option value="Dependent Territories">Dependent Territories</option>
        </select>

        <label>Points:</label>
        <input
          type="number"
          value={form.points}
          onChange={(e) => setForm({ ...form, points: e.target.value })}
        />

        <label>Category:</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="COMMON">COMMON</option>
          <option value="RARE">RARE</option>
          <option value="LEGENDARY">LEGENDARY</option>
        </select>

        <button type="submit">
          {editingId ? "Save changes" : "Submit"}
        </button>
      </form>

      <hr />
      <h3>Existing Achievements</h3>

      <div className="search-bar">
        <div className="filters-panel">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="COMMON">COMMON</option>
            <option value="RARE">RARE</option>
            <option value="LEGENDARY">LEGENDARY</option>
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="title-asc">A ➝ Z</option>
            <option value="title-desc">Z ➝ A</option>
            <option value="points-asc">Points ↑</option>
            <option value="points-desc">Points ↓</option>
          </select>
        </div>

        <div className="search-input">
          <input
            type="search"
            placeholder="Search for an achievement..."
            value={searchInput}
            onChange={(e) => {
              const value = e.target.value;
              setSearchInput(value)
              
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
          className="search-btn"
          onClick={() => setSearchQuery(searchInput.trim())}
        >
          Search
        </button>
      </div>

      {!loading && (
        <p className="results-count">
          Found <strong>{filteredAndSorted.length}</strong> achievement{filteredAndSorted.length !== 1 ? "s" : ""} in total
        </p>
      )}

      <div className="achievement-list">
        {loading ? (
          <p>Loading...</p>
        ) : (
          filteredAndSorted.map((a) => (
            <div className="achievement-card" key={a.achievement_id}>
              <div
                className="achievement-category"
                style={{ background: categoryColors[a.category] }}
              >
                {a.category}
              </div>
              <div className="achievement-actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEdit(a)}
                  title="Edit"
                >
                  <RiEdit2Line className="btn-icon" />
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(a)}
                  title="Delete"
                >
                  <RiDeleteBin5Line className="btn-icon" />
                </button>
              </div>
              <div className="achievement-icon">
                {achievementIconMap[a.icon] && React.createElement(achievementIconMap[a.icon])}
              </div>
              <div className="achievement-info">
                <div className="achievement-title">{a.title}</div>
                <div className="achievement-description">{a.description}</div>
                <div className="achievement-points"> Points: {a.points} </div>
              </div>
            </div>
          ))
        )}
      </div>
      <ToastContainer />
    </div>
  );
}