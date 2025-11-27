import React, { useState } from 'react';
import supabase from '../helper/supabaseClient';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/SignUpIn.less';


export default function SignIn() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user;

      if (user) {
        const { error: updateError } = await supabase
          .from("user_profile")
          .update({ last_active: new Date().toISOString() })
          .eq("id", user.id);

        if (updateError) console.error("Error updating last_active:", updateError.message);
      }

      setMessage("Signed in successfully!");

      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (err) {
      console.error("Sign In error:", err.message || err);
      setMessage("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="signin-container">
      <motion.div
        className="signin-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2>Sign In</h2>
        <form onSubmit={handleSignIn}>
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
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {message && (
          <p className={`signin-message ${message.includes("successfully") ? "success" : "error"}`}>
            {message}
          </p>
        )}

        <p className="signin-footer">
          Don't have an account? <Link to="/SignUp">Sign Up</Link>
        </p>
      </motion.div>
    </div>
  );
}