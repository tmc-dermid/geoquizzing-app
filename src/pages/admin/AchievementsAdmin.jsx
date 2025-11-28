import React from "react";
import { useEffect, useState } from "react";
import { achievementIconMap, achievementIconOptions } from "../../helper/achievementIcons.js";
import supabase from "../../helper/supabaseClient.js";
import "./AchievementsAdmin.less";

export default function AchievementsAdmin() {

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    icon: "GiFootsteps",
    condition_type: "quizzes_played",
    condition_value: 1,
    points: 0,
    category: "COMMON",
  });

  const categoryColors = {
    COMMON: "linear-gradient(135deg, #01d6e1, #01b74d, #0377eb)",
    RARE: "linear-gradient(135deg, #6a2c70, #9b5de5, #4a00e0)",
    LEGENDARY: "linear-gradient(135deg, #ff6f00, #ffb347, #dbab1aff)",
  };

  const categoryOrder = {
    COMMON: 1,
    RARE: 2,
    LEGENDARY: 3,
  };

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
      });

    if (error) {
      alert("Error: " + error.message);
      return;
    }

    load();
    setForm({
      title: "",
      description: "",
      icon: "GiFootsteps",
      condition_type: "quizzes_played",
      condition_value: 1,
      points: 0, 
    });
  }

  return (
    <div className="admin-wrapper">
      <h2>Achievements Admin Panel</h2>

      <form className="achievement-form" onSubmit={handleSubmit}>
        <h3>Add Achievement</h3>

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
        <select
          value={form.icon}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
        >
          {achievementIconOptions.map((icon) => (
            <option key={icon} value={icon}>
              {icon}
            </option>
          ))}
        </select>

        <label>Condition Type:</label>
        <select
          value={form.condition_type}
          onChange={(e) => setForm({ ...form, condition_type: e.target.value })}
        >
          <option value="quizzes_played">quizzes_played</option>
          <option value="correct_answers">correct_answers</option>
        </select>

        <label>Condition Value:</label>
        <input
          type="number"
          value={form.condition_value}
          onChange={(e) => setForm({ ...form, condition_value: e.target.value })}
        />

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

        <button type="submit">Submit</button>
      </form>

      <hr />
      <h3>Existing Achievements</h3>
      <div className="achievement-list">
        {loading ? (
          <p>Loading...</p>
        ) : (
          [...achievements]
          .sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category])
          .map(a => (
            <div className="achievement-card" key={a.achievement_id}>
              <div
                className="achievement-category"
                style={{ background: categoryColors[a.category] }}
              >
                {a.category}
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
    </div>
  );
}