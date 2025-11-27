import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import supabase from "../helper/supabaseClient.js";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import '../styles/EditProfile.less';

export default function EditProfile() {

  const { profile, setProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!profile) return <div className="edit-profile-container">Loading...</div>;

  const [username, setUsername] = useState(profile.username);
  const [country, setCountry] = useState(profile.country_of_origin);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({ username: "" });
  const [message, setMessage] = useState({ text: "", type: "" });

  const [allCountries, setAllCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2")
      .then(res => res.json())
      .then(data => {
        const countries = data.map(c => ({
          name: c.name.common,
          code: c.cca2
        })).sort((a, b) => a.name.localeCompare(b.name));

        setAllCountries(countries);
        setFilteredCountries(countries);
      })
      .catch(err => console.error("Error fetching countries:", err));
  }, []);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (file) {
      if (!allowedTypes.includes(file.type)) {
        setMessage({
          text: "Invalid avatar format. Allowed formats: PNG, JPEG, WEBP.",
          type: "error"
        });
        setAvatarFile(null);
        setAvatarPreview(profile.avatar_url);
        return;
      }
      
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setMessage({ text: "", type: "" });
    }
  }

  function validateUsername(name) {
    let isValid = true;

    const usernameRegex= /^[A-Za-z][A-Za-z0-9_]*$/;
    const newErrors = { username: "" };

    if (!name.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    } else if (name.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      isValid = false;
    } else if (name.length > 30) {
      newErrors.username = "Username is too long!";
      isValid = false;
    } else if (!usernameRegex.test(name)) {
      newErrors.username = "Username must start with a letter and can contain letters, numbers, and underscores";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }

  async function isUsernameTaken(name) {
    const { data, error } = await supabase
      .from('user_profile')
      .select('username')
      .eq('username', name);

    if (error) {
      console.error(error);
      return false;
    }

    return data.length > 0;
  }

  async function uploadAvatar(file, userId) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}-${uuidv4()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("user_avatars")
      .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("user_avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }


  async function updateProfile(updates) {
    const { error } = await supabase
      .from('user_profile')
      .update(updates)
      .eq('id', profile.id);
    
    if (error) throw error;
  }


  async function handleSave() {
    setSaving(true);
    setMessage({ text: "", type: "" });

    if (!validateUsername(username)) {
      setSaving(false);
      return;
    }

    if (username !== profile.username) {
      if (await isUsernameTaken(username)) {
        setErrors({ username: "This username is already taken!" });
        setSaving(false);
        return;
      }
    }

    let newAvatarUrl = profile.avatar_url;
    const oldAvatarUrl = profile.avatar_url;

    if (avatarFile) {
      try {
        newAvatarUrl = await uploadAvatar(avatarFile, profile.id);

        if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
          try {
            await supabase.storage
              .from("user_avatars")
              .remove([getStoragePath(oldAvatarUrl)]);
          } catch (err) {
            console.warn("Failed to delete old avatar:", err);
          }
        }
      } catch (err) {
        setMessage({ text: "Error uploading avatar", type: "error" });
        setSaving(false);
        return;        
      }
    }

    try {
      await updateProfile({
        username,
        country_of_origin: country,
        avatar_url: newAvatarUrl,
        updated_at: new Date(),
      });

      setProfile(prev => ({
        ...prev,
        username,
        country_of_origin: country,
        avatar_url: newAvatarUrl
      }));

      setMessage({ text: "Your profile has been successfully updated! Redirecting...", type: "success" });

      setTimeout(() => {
        navigate("/profile");        
      }, 2000);

    } catch (err) {
      console.error(err);
      setMessage({ text: "Something went wrong updating profile", type: "error" });
    }

    setSaving(false);
  }

  function getStoragePath(url) {
    return url.split("/").pop();
  }

  function normalizeString(str) {
    const normalizedStr = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    return normalizedStr;
  }

  function handleCountryInputChange(e) {
    const input = e.target.value;
    setCountry(input);

    const normalizedInput = normalizeString(input);

    const filtered = allCountries.filter(c =>
      normalizeString(c.name).includes(normalizedInput)
    );

    setFilteredCountries(filtered);
    setShowCountryDropdown(true);
  }


  function handleSelectCountry(selected) {
    setCountry(selected.name);
    setShowCountryDropdown(false);
  }

  
  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest(".autocomplete")) {
        setShowCountryDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="edit-profile-container">
      <h1 className="page-title">Edit Profile</h1>
      <div className="edit-card">
        <div className="avatar-edit-section">
          <img
            src={avatarPreview}
            alt="Avatar"
            className="avatar-preview"
          />

          <label className="avatar-upload-btn">
            Change Avatar
            <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarChange} />
          </label>
        </div>
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Change your username:</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {errors.username && <p className="error">{errors.username}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Choose your country:</label>
            <div className="autocomplete">
              <input
                type="text"
                className="form-input country-input"
                value={country}
                onChange={handleCountryInputChange}
                onFocus={() => setShowCountryDropdown(true)}
              />

              {showCountryDropdown && (
                <ul className="drop-down">
                  <li key="no-country" className="country-item no-country-item" onClick={() => handleSelectCountry({ name: "", code: "" })}>
                    <span className="country-name">-- No country --</span>
                  </li>
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map(c => (
                      <li key={c.code} className="country-item" onClick={() => handleSelectCountry(c)}>
                        <img
                          src={`https://flagsapi.com/${c.code}/shiny/64.png`}
                          alt={`${c.name} flag`}
                          className="country-flag"
                        />
                        <span className="country-name">{c.name}</span>
                      </li>
                    ))
                  ) : (
                    <li className="no-results">No matching countries...</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
        {message && (
          <p className={`message ${message.type}`}>
            {message.text}
          </p>
        )}
        <div className="form-buttons">
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            className="cancel-btn"
            onClick={() => navigate("/profile")}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}