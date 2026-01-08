import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { connectSocket, disconnectSocket } from "../services/socket";
import api from "../services/api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Session {
  sessionToken: string;
  deviceInfo: {
    fingerprint: string;
    userAgent: string;
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    device: string;
    platform: string;
  };
  location: {
    ip: string;
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  };
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
  loginMethod: string;
  isSuspicious?: boolean;
  riskScore?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  sessionToken: string | null;
  login: (
    email: string,
    password: string,
    deviceFingerprint?: string
  ) => Promise<{ success: boolean; requiresOTP?: boolean; message?: string }>;
  verifyOTP: (
    otp: string,
    purpose: "login" | "logout" | "logout_all" | "session_logout",
    additionalData?: any
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  logoutSession: (
    sessionToken: string
  ) => Promise<{ success: boolean; requiresOTP?: boolean; message?: string }>;
  logoutAllSessions: (
    exceptCurrent?: boolean
  ) => Promise<{ success: boolean; requiresOTP?: boolean; message?: string }>;
  getUserSessions: () => Promise<Session[]>;
  loading: boolean;
  deviceFingerprint: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem("accessToken");
  });

  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem("sessionToken");
  });
  const [loading, setLoading] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(
    () => {
      return localStorage.getItem("deviceFingerprint");
    }
  );

  // Generate device fingerprint
  const generateDeviceFingerprint = useCallback(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx?.fillText("fingerprint", 10, 10);

    // Add some entropy to make fingerprints more unique between browsers
    const entropy = Math.random().toString(36).substring(2, 15);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      !!window.indexedDB,
      canvas.toDataURL(),
      entropy, // Add random entropy
      navigator.appName,
      navigator.platform,
      navigator.cookieEnabled,
      navigator.onLine,
      window.devicePixelRatio || 1,
    ].join("|");

    // More robust hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    const finalFingerprint =
      Math.abs(hash).toString(36) + "-" + entropy.substring(0, 4);
    return finalFingerprint;
  }, []);

  // Initialize device fingerprint
  useEffect(() => {
    if (!deviceFingerprint) {
      const fingerprint = generateDeviceFingerprint();
      setDeviceFingerprint(fingerprint);
      localStorage.setItem("deviceFingerprint", fingerprint);
    }
  }, [deviceFingerprint, generateDeviceFingerprint]);

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

  const login = async (
    email: string,
    password: string,
    providedFingerprint?: string
  ): Promise<{ success: boolean; requiresOTP?: boolean; message?: string }> => {
    try {
      setLoading(true);

      const fingerprint = providedFingerprint || deviceFingerprint;

      const deviceInfo = {
        fingerprint,
        userAgent: navigator.userAgent,
        browser: navigator.appName,
        browserVersion: navigator.appVersion,
        os: navigator.platform,
        osVersion: "Unknown",
        device: /Mobile|Android|iP(hone|od|ad)/.test(navigator.userAgent)
          ? "mobile"
          : /Tablet|iPad/.test(navigator.userAgent)
          ? "tablet"
          : "desktop",
        platform: navigator.platform,
      };

      const response = await api.post("/auth/login", {
        email,
        password,
        deviceFingerprint: fingerprint,
        deviceInfo,
      });

      const data = response.data;

      if (data.requiresOTP) {
        // Store temp token for OTP verification
        localStorage.setItem("tempToken", data.tempToken);
        return {
          success: true,
          requiresOTP: true,
          message: data.message,
        };
      }

      // Normal login successful
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      if (data.sessionToken) {
        localStorage.setItem("sessionToken", data.sessionToken);
        setSessionToken(data.sessionToken);
      }

      setUser(data.user);
      setIsAuthenticated(true);

      // Connect socket with session token
      if (data.sessionToken) {
        connectSocket({
          token: data.accessToken,
          sessionToken: data.sessionToken,
        });
      }

      // Trigger auth change event
      window.dispatchEvent(new Event("auth-changed"));

      return {
        success: true,
        message: "Login successful",
      };
    } catch (error: any) {
      console.error("Login error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Network error. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (
    otp: string,
    purpose: "login" | "logout" | "logout_all" | "session_logout",
    additionalData?: any
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);

      const tempToken = localStorage.getItem("tempToken");
      const accessToken = localStorage.getItem("accessToken");

      const token = purpose === "login" ? tempToken : accessToken;

      if (!token) {
        return {
          success: false,
          message: "Authentication token missing",
        };
      }

      const response = await api.post(
        "/security/verify-otp",
        {
          otp,
          purpose,
          deviceFingerprint,
          sessionToken: additionalData?.sessionToken,
          exceptCurrent: additionalData?.exceptCurrent,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      // Handle successful verification based on purpose
      if (purpose === "login") {
        // Complete login after OTP verification
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        if (data.sessionToken) {
          localStorage.setItem("sessionToken", data.sessionToken);
          setSessionToken(data.sessionToken);
        }

        setUser(data.user);
        setIsAuthenticated(true);

        // Connect socket with session token
        if (data.sessionToken) {
          connectSocket({
            token: data.accessToken,
            sessionToken: data.sessionToken,
          });
        }

        // Clean up temp token
        localStorage.removeItem("tempToken");

        // Trigger auth change event
        window.dispatchEvent(new Event("auth-changed"));
      }

      return {
        success: true,
        message: data.message || "Verification successful",
      };
    } catch (error: any) {
      console.error("OTP verification error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Network error. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const getUserSessions = async (): Promise<Session[]> => {
    try {
      const response = await api.get("/security/sessions");
      return response.data.sessions || [];
    } catch (error) {
      console.error("Get user sessions error:", error);
      return [];
    }
  };

  const logoutSession = async (
    targetSessionToken: string
  ): Promise<{ success: boolean; requiresOTP?: boolean; message?: string }> => {
    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        return { success: false, message: "Not authenticated" };
      }

      const response = await api.post("/security/sessions/logout", {
        sessionToken: targetSessionToken,
      });

      const data = response.data;

      if (data.requiresOTP) {
        return {
          success: true,
          requiresOTP: true,
          message: data.message,
        };
      }

      // If this is the current session, logout locally
      if (targetSessionToken === sessionToken) {
        logout();
      }

      return {
        success: true,
        message: data.message || "Session logged out successfully",
      };
    } catch (error: any) {
      console.error("Logout session error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Network error. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const logoutAllSessions = async (
    exceptCurrent: boolean = true
  ): Promise<{ success: boolean; requiresOTP?: boolean; message?: string }> => {
    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        return { success: false, message: "Not authenticated" };
      }

      const requestData: any = {
        exceptCurrent,
      };

      // Include current session token if excepting current session
      if (exceptCurrent && sessionToken) {
        requestData.currentSessionToken = sessionToken;
      }

      const response = await api.post(
        "/security/sessions/logout-all",
        requestData
      );

      const data = response.data;

      if (data.requiresOTP) {
        return {
          success: true,
          requiresOTP: true,
          message: data.message,
        };
      }

      // Logout locally if not excepting current session
      if (!exceptCurrent) {
        logout();
      }

      return {
        success: true,
        message: data.message || "All sessions logged out successfully",
      };
    } catch (error: any) {
      console.error("Logout all sessions error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Network error. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout to clean up session
      if (sessionToken) {
        await api.post("/token/logout", { sessionToken });
      }
    } catch (error) {
      console.error("Backend logout error:", error);
      // Continue with frontend cleanup even if backend fails
    }

    // Frontend cleanup
    disconnectSocket();
    localStorage.clear();
    setIsAuthenticated(false);
    setUser(null);
    setSessionToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        sessionToken,
        login,
        verifyOTP,
        logout,
        logoutSession,
        logoutAllSessions,
        getUserSessions,
        loading,
        deviceFingerprint,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
