import { useState, useEffect } from "react";
import { Slide, ToastContainer, toast } from "react-toastify";
import { RiDeleteBin5Line, RiEdit2Line } from "react-icons/ri";
import supabase from "../../helper/supabaseClient";
import 'react-toastify/dist/ReactToastify.css';
import './NewsAdmin.less';


export default function NewsAdmin() {

  const [newsList, setNewsList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    category: "general",
    examples: "",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error loading news:", error);
      setLoading(false);
      return;
    }

    setNewsList(data || []);
    setLoading(false);
  };


  async function handleSubmit(e) {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from('news')
        .update(form)
        .eq('news_id', editingId);
      
      if (error) {
        alert("Error updating achievement: " + error.message);
        return;
      }
    
      toast.success(<span>Successfully updated news: <strong>{form.title}</strong></span>, {
        toastId: `news-edit-${editingId}`,
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
        .from('news')
        .insert([form]);
      
      if (error) {
        console.error("Error inserting news: " + error.message);
        return;
      }

      toast.success(<span>Added new news: <strong>{form.title}</strong></span>, {
        toastId: `news-add-${form.title}`,
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

    setForm({
      title: "",
      description: "",
      image_url: "",
      category: "general",
      examples: "",
    });

    load();
  }

  function handleEdit(n) {
    setEditingId(n.news_id);
    setForm({
      title: n.title,
      description: n.description,
      image_url: n.image_url,
      category: n.category,
      examples: n.examples,      
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(n) {
    const confirmDelete = window.confirm(`Are you sure you want to delete news "${n.title}"?`);
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('news_id', n.news_id);

    if (error) {
      alert("Error deleting news: " + error.message);
      return;
    }

    toast.info(<span>Successfully deleted news: <strong>{n.title}</strong></span>, {
      toastId: `news-delete-${n.news_id}`,
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
      <h2>Manage News</h2>

      <form className="news-form" onSubmit={handleSubmit}>
        <h3>{editingId ? "Edit News" : "Add News"}</h3>

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

        <label>Image URL:</label>
        <input
          placeholder="Image URL..."
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />

        <label>Category:</label>
        <input
          placeholder="Category..."
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />

        <label>Examples:</label>
        <input
          placeholder="Examples..."
          value={form.examples}
          onChange={(e) => setForm({ ...form, examples: e.target.value })}
        />
        <small style={{ color: '#555', fontStyle: 'italic' }}>Separate multiple examples with a semicolon ( ; )</small>

        <button type="submit">
          {editingId ? "Save changes" : "Submit"}
        </button>
      </form>

      <hr />

      <h3>Existing News</h3>
      <div className="news-list">
        {loading ? (
          <p>Loading...</p>
        ) : newsList.length === 0 ? (
          <p>No news yet.</p>
        ) : (
          newsList.map((n) => (
            <div className="news-card" key={n.news_id}>
              {n.image_url && (
                <div className="news-image">
                  <img src={n.image_url} alt={n.title} />
                </div>
              )}

              <div className="news-content">
                <div className="news-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(n)}
                    title="Edit"
                  >
                    <RiEdit2Line className="btn-icon" />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(n)}
                    title="Delete"
                  >
                    <RiDeleteBin5Line className="btn-icon" />
                  </button>                  
                </div>

                <h4 className="news-title">{n.title}</h4>
                <p className="news-category">Category: {n.category}</p>
                <p className="news-description">{n.description}</p>
                {n.examples && (
                <div className="news-examples">
                  <span>Examples:</span>
                  <ul>
                    {n.examples.split(';').map((example, index) => (
                      <li key={index}>{example}</li>
                    ))}
                  </ul>
                </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
