import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  console.log("isAuthenticatd", isAuthenticated);
  // if (loading) {
  //   return <div>Loading.....</div>;
  // }
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
