import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function AdminRoutes({ children }) {
  const { profile } = useContext(AuthContext);

  if (!profile) return <p>Loading...</p>;

  if (!profile.is_admin) {
    return <Navigate to='/' replace />;
  }

  return children;
}
