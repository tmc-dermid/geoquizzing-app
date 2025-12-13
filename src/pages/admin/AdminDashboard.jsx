import { NavLink } from "react-router-dom";
import { motion } from 'framer-motion';
import { PiTrophyBold, PiNewspaperBold } from "react-icons/pi";
import './AdminDashboard.less';


export default function AdminDashboard() {
  return (
    <div className="admin-wrapper">
      <motion.div
        className="admin-card-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Admin Panel</h2>
        <p>Select a section to manage:</p>

        <div className="admin-menu">
          <NavLink to="/admin/achievements" className="admin-card">
            <PiTrophyBold className="admin-card-icon" />
            <span>Manage Achievements</span>
          </NavLink>

          <NavLink to="/admin/news" className="admin-card">
            <PiNewspaperBold className="admin-card-icon" />
            <span>Manage News</span>
          </NavLink>
        </div>
      </motion.div>
    </div>
  );
}
