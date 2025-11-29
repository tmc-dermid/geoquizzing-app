import React from "react";
import Select, { components } from "react-select";
import { useEffect, useState } from "react";
import { achievementIconMap, achievementIconOptions } from "../../helper/achievementIcons.js";
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

        <button type="submit">
          {editingId ? "Save changes" : "Submit"}
        </button>
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