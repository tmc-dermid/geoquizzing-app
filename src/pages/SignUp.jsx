import React, { useState } from 'react';
import supabase from '../helper/supabaseClient';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/SignUpIn.less';


export default function SignUp() {

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
  });

  const validate = () => {
    let isValid = true;
    const newErrors = {username: "", email: "", password: ""};

    const usernameRegex= /^[A-Za-z][A-Za-z0-9_]*$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:',.<>?\/]).{8,}$/;

    if (!username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      isValid = false;
    } else if (username.length > 30) {
      newErrors.username = "Username is too long!";
      isValid = false;
    } else if (!usernameRegex.test(username)) {
      newErrors.username = "Username must start with a letter and can contain letters, numbers, and underscores";
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Invalid email address";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    } else if (!passwordRegex.test(password)) {
      newErrors.password = (
        <span>
          Password must contain: uppercase letters, lowercase letters, at least one number, and at least one special character.
        </span>
      );
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validate()) return;

    setLoading(true);

    try {
      const { data: existingUser, error: checkError } = await supabase
        .from("user_profile")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingUser) {
        setMessage("This username is already taken");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });

      if (error) throw error;

      setMessage("Your account has been created successfully!");
      setUsername("");
      setEmail("");
      setPassword("");
      setErrors({ username: "", email: "", password: "" });

      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (err) {
      console.error("Sign Up error:", err.message || err);
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
    

  return (
    <div className="signup-container">
      <motion.div
        className="signup-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2>Create Account</h2>
        <form onSubmit={handleSignUp}>
          <label>
            Username:
            <div className="input-wrapper">
              <FaUser className="input-icon"/>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            {errors.username && <p className="error">{errors.username}</p>}
          </label>

          <label>
            Email:
            <div className="input-wrapper">
              <FaEnvelope className="input-icon"/>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <p className="error">{errors.email}</p>}
          </label>

          <label>
            Password:
            <div className="input-wrapper">
              <FaLock className="input-icon"/>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password && (
                showPassword ? (
                  <FaEyeSlash
                    className='toggle-password'
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <FaEye
                    className='toggle-password'
                    onClick={() => setShowPassword(true)}
                  />
                )
              )}
            </div>
            {errors.password && <p className="error">{errors.password}</p>}
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        {message && (
          <p className={`signup-message ${message.includes("successfully") ? "success" : "error"}`}>
            {message}
          </p>
        )}

        <p className="signup-footer">
          Already have an account? <Link to="/SignIn">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}