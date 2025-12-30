import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, disconnectSocket } from "../services/socket";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsAuthenticated(!!token);
      
      // Connect socket and listen for logout events
      const socket = connectSocket();
      
      socket.on("auth:logout", (data: { message: string; logoutAll: boolean }) => {
        console.log("🚪 Logout event received:", data);
        
        // Force logout on this device
        handleForceLogout();
      });
      
      return () => {
        socket.off("auth:logout");
      };
    }
    setLoading(false);
  }, []);

  const handleForceLogout = () => {
    console.log("🔒 Force logout - clearing session");
    disconnectSocket();
    localStorage.clear();
    setIsAuthenticated(false);
    
    // Redirect to login page
    window.location.href = "/login";
  };

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    connectSocket();
    setIsAuthenticated(true);
    
    // Trigger theme reload after login
    window.dispatchEvent(new Event('auth-changed'));
  };

  const logout = () => {
    disconnectSocket();
    localStorage.clear();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
