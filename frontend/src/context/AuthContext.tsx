import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { connectSocket, disconnectSocket } from "../services/socket";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loading?: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem("accessToken");
  });

  // const [loading, setLoading] = useState(true);

  const handleForceLogout = useCallback(() => {
    console.log("🔒 Force logout - clearing session");
    disconnectSocket();
    localStorage.clear();
    setIsAuthenticated(false);

    // Redirect to login page
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      // setLoading(false);
      return;
    }

    const socket = connectSocket();

    socket.on(
      "auth:logout",
      (data: { message: string; logoutAll: boolean }) => {
        console.log("🚪 Logout event received:", data);
        handleForceLogout();
      }
    );

    // setLoading(false);

    return () => {
      socket.off("auth:logout");
    };
  }, [isAuthenticated, handleForceLogout]);

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    setIsAuthenticated(true);

    // Trigger auth change event for components that need to react to login
    window.dispatchEvent(new Event("auth-changed"));
  };

  const logout = () => {
    disconnectSocket();
    localStorage.clear();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
