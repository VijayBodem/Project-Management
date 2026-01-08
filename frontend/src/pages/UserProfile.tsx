import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  type UserProfile as UserProfileType,
} from "../services/user.service";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "../schemas/validation";
import {
  ErrorMessage,
  ErrorAlert,
  SuccessAlert,
} from "../components/ErrorMessage";
import { handleApiError } from "../utils/errorHandler";
import { UserAvatar } from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import {
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  Shield,
  LogOut,
  Power,
  Loader2,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import OTPVerificationModal from "../components/OTPVerificationModal";

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

const UserProfile = () => {
  const navigate = useNavigate();
  const {
    logout,
    user,
    sessionToken: currentSessionToken,
    getUserSessions,
    logoutSession,
    logoutAllSessions,
    verifyOTP,
  } = useAuth();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "profile" | "password" | "preferences" | "sessions"
  >("profile");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Session management state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // OTP Modal state for sessions
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<
    "logout" | "logout_all" | "session_logout"
  >("logout");
  const [otpError, setOtpError] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    type: "session_logout" | "logout_all";
    sessionToken?: string;
    exceptCurrent?: boolean;
    currentSessionToken?: string;
  } | null>(null);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  // Load sessions when sessions tab is active
  useEffect(() => {
    if (activeTab === "sessions") {
      loadSessions();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfile(data);
      resetProfile({
        name: data.name,
        bio: data.bio || "",
        avatar: data.avatar || "",
      });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const onUpdateProfile = async (data: UpdateProfileInput) => {
    setError("");
    setSuccess("");

    try {
      const updated = await updateUserProfile(data);
      setProfile(updated);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const onChangePassword = async (data: ChangePasswordInput) => {
    setError("");
    setSuccess("");

    try {
      await changePassword(data);
      setSuccess(
        "Password changed successfully! You will be logged out from all devices."
      );
      resetPassword();

      setTimeout(() => {
        logout();
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  // Session management functions
  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const userSessions = await getUserSessions();
      setSessions(userSessions);
    } catch (err: any) {
      console.error("Load sessions error:", err);
    } finally {
      setSessionsLoading(false);
    }
  }, [getUserSessions]);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="w-5 h-5" />;
      case "tablet":
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const formatLastActivity = (lastActivity: string) => {
    const now = new Date();
    const activityTime = new Date(lastActivity);
    const diffInMinutes = Math.floor(
      (now.getTime() - activityTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleSessionLogout = async (sessionToken: string) => {
    setActionLoading(sessionToken);
    setError("");

    try {
      const result = await logoutSession(sessionToken);

      if (result.requiresOTP) {
        setPendingAction({ type: "session_logout", sessionToken });
        setOtpPurpose("session_logout");
        setShowOTPModal(true);
      } else if (result.success) {
        await loadSessions(); // Refresh sessions list
      } else {
        setError(result.message || "Failed to logout session");
      }
    } catch (err: any) {
      setError("Failed to initiate session logout");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogoutAll = async (exceptCurrent: boolean = true) => {
    const loadingKey = exceptCurrent ? "other" : "all";
    setActionLoading(loadingKey);
    setError("");

    try {
      const result = await logoutAllSessions(exceptCurrent);

      if (result.requiresOTP) {
        setPendingAction({
          type: "logout_all",
          exceptCurrent,
          currentSessionToken: exceptCurrent
            ? currentSessionToken || undefined
            : undefined,
        });
        setOtpPurpose("logout_all");
        setShowOTPModal(true);
      } else if (result.success) {
        if (!exceptCurrent) {
          // User will be logged out, navigation will happen automatically
          return;
        }
        await loadSessions(); // Refresh sessions list
      } else {
        setError(result.message || "Failed to logout all sessions");
      }
    } catch (err: any) {
      setError("Failed to initiate logout all sessions");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOTPVerify = async (otp: string) => {
    if (!pendingAction) return;

    const result = await verifyOTP(otp, otpPurpose, {
      sessionToken: pendingAction.sessionToken,
      exceptCurrent: pendingAction.exceptCurrent,
      currentSessionToken: pendingAction.currentSessionToken,
    });

    if (result.success) {
      setShowOTPModal(false);
      setPendingAction(null);
      await loadSessions(); // Refresh sessions list
    } else {
      setOtpError(result.message);
    }
  };

  const getOtpModalTitle = () => {
    switch (otpPurpose) {
      case "session_logout":
        return "Verify Session Logout";
      case "logout_all":
        return "Verify Logout All Devices";
      default:
        return "Verify Logout";
    }
  };

  const getOtpModalDescription = () => {
    switch (otpPurpose) {
      case "session_logout":
        return "For security, we need to verify your identity before logging out from this device.";
      case "logout_all":
        return "For security, we need to verify your identity before logging out from all your devices.";
      default:
        return "For security, we need to verify your identity before proceeding with logout.";
    }
  };

  if (loading) {
    return (
      <div className="p-5 text-center">
        <p className="text-gray-600 ">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-5 text-center">
        <p className="text-gray-600 ">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-[800px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 border border-gray-300 "
        >
          ← Back to Dashboard
        </button>
        <h1 className="m-0 mb-2 text-3xl font-bold text-gray-900 ">
          User Profile
        </h1>
        <p className="m-0 text-gray-600 ">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Alerts */}
      {error && <ErrorAlert message={error} onClose={() => setError("")} />}
      {success && (
        <SuccessAlert message={success} onClose={() => setSuccess("")} />
      )}

      {/* Tabs */}
      <div className="border-b-2 border-gray-200 ">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 border-none bg-transparent cursor-pointer text-base transition-colors -mb-0.5 ${
              activeTab === "profile"
                ? "border-b-2 border-blue-500 font-semibold text-blue-500"
                : "border-b-2 border-transparent font-normal text-gray-600 "
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-6 py-3 border-none bg-transparent cursor-pointer text-base transition-colors -mb-0.5 ${
              activeTab === "password"
                ? "border-b-2 border-blue-500 font-semibold text-blue-500"
                : "border-b-2 border-transparent font-normal text-gray-600 "
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`px-6 py-3 border-none bg-transparent cursor-pointer text-base transition-colors -mb-0.5 ${
              activeTab === "preferences"
                ? "border-b-2 border-blue-500 font-semibold text-blue-500"
                : "border-b-2 border-transparent font-normal text-gray-600 "
            }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-6 py-3 border-none bg-transparent cursor-pointer text-base transition-colors -mb-0.5 ${
              activeTab === "sessions"
                ? "border-b-2 border-blue-500 font-semibold text-blue-500"
                : "border-b-2 border-transparent font-normal text-gray-600 "
            }`}
          >
            Sessions
          </button>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div>
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <UserAvatar
                name={profile.name}
                avatar={profile.avatar}
                size={120}
                fontSize={48}
              />
            </div>
            <h2 className="m-0 mb-1 text-2xl font-semibold text-gray-900 ">
              {profile.name}
            </h2>
            <p className="m-0 text-gray-600 ">{profile.email}</p>
          </div>

          <form
            onSubmit={handleSubmitProfile(onUpdateProfile)}
            className="space-y-5"
          >
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 ">
                Name
              </label>
              <input
                type="text"
                {...registerProfile("name")}
                className="w-full px-3 py-2 border border-gray-300 "
              />
              <ErrorMessage message={profileErrors.name?.message} />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 ">
                Bio
              </label>
              <textarea
                {...registerProfile("bio")}
                rows={4}
                placeholder="Tell us about yourself..."
                className="w-full px-3 py-2 border border-gray-300 "
              />
              <ErrorMessage message={profileErrors.bio?.message} />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 ">
                Avatar URL
              </label>
              <input
                type="text"
                {...registerProfile("avatar")}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3 py-2 border border-gray-300 "
              />
              <ErrorMessage message={profileErrors.avatar?.message} />
              <p className="mt-1 text-xs text-gray-600 ">
                Enter a URL to your profile picture
              </p>
            </div>

            <button
              type="submit"
              className="px-6 py-3 border-none rounded bg-blue-500 text-white cursor-pointer text-base font-medium hover:bg-blue-600 transition-colors"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Active Sessions
              </h3>
              <p className="text-gray-600">
                Manage your active sessions across different devices
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadSessions()}
                disabled={sessionsLoading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh sessions"
              >
                <RefreshCw
                  className={`w-4 h-4 ${sessionsLoading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={() => handleLogoutAll(true)}
                disabled={actionLoading === "other"}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === "other" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Power className="w-4 h-4" />
                )}
                Logout Other Devices
              </button>

              <button
                onClick={() => handleLogoutAll(false)}
                disabled={actionLoading === "all"}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === "all" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                Logout All Devices
              </button>
            </div>
          </div>

          {/* Sessions List */}
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-slate-600">Loading sessions...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const isCurrentSession =
                  session.sessionToken === currentSessionToken;
                const isSuspicious =
                  session.isSuspicious ||
                  (session.riskScore && session.riskScore > 70);

                return (
                  <div
                    key={session.sessionToken}
                    className={`bg-white rounded-xl border p-6 transition-all ${
                      isCurrentSession
                        ? "border-blue-200 bg-blue-50"
                        : isSuspicious
                        ? "border-red-200 bg-red-50"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-lg ${
                            isCurrentSession
                              ? "bg-blue-100"
                              : isSuspicious
                              ? "bg-red-100"
                              : "bg-slate-100"
                          }`}
                        >
                          {getDeviceIcon(session.deviceInfo.device)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900">
                              {session.deviceInfo.browser} on{" "}
                              {session.deviceInfo.os}
                            </h3>
                            {isCurrentSession && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                Current Session
                              </span>
                            )}
                            {isSuspicious && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Suspicious
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {session.location.city &&
                                session.location.country
                                  ? `${session.location.city}, ${session.location.country}`
                                  : "Location unknown"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                Logged in{" "}
                                {new Date(
                                  session.loginTime
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>
                                Active{" "}
                                {formatLastActivity(session.lastActivity)}
                              </span>
                            </div>

                            <div className="text-xs text-slate-500 mt-2">
                              {session.deviceInfo.platform} •{" "}
                              {session.loginMethod === "otp"
                                ? "Verified Login"
                                : "Standard Login"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {!isCurrentSession && (
                        <button
                          onClick={() =>
                            handleSessionLogout(session.sessionToken)
                          }
                          disabled={actionLoading === session.sessionToken}
                          className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === session.sessionToken ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogOut className="w-4 h-4" />
                          )}
                          Logout
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {sessions.length === 0 && !sessionsLoading && (
            <div className="text-center py-12">
              <Monitor className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No active sessions
              </h3>
              <p className="text-slate-600">
                You don't have any active sessions at the moment.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <div>
          <form
            onSubmit={handleSubmitPassword(onChangePassword)}
            className="space-y-5"
          >
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 ">
                Current Password
              </label>
              <input
                type="password"
                {...registerPassword("currentPassword")}
                className="w-full px-3 py-2 border border-gray-300 "
              />
              <ErrorMessage message={passwordErrors.currentPassword?.message} />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 ">
                New Password
              </label>
              <input
                type="password"
                {...registerPassword("newPassword")}
                className="w-full px-3 py-2 border border-gray-300 "
              />
              <ErrorMessage message={passwordErrors.newPassword?.message} />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 ">
                Confirm New Password
              </label>
              <input
                type="password"
                {...registerPassword("confirmPassword")}
                className="w-full px-3 py-2 border border-gray-300 "
              />
              <ErrorMessage message={passwordErrors.confirmPassword?.message} />
            </div>

            <button
              type="submit"
              className="px-6 py-3 border-none rounded bg-blue-500 text-white cursor-pointer text-base font-medium hover:bg-blue-600 transition-colors"
            >
              Change Password
            </button>
          </form>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="m-0 mb-2 font-medium text-gray-900 ">
              Account Information
            </p>
            <p className="m-0 mb-1 text-sm text-gray-600 ">
              <strong>Member since:</strong>{" "}
              {new Date(profile.createdAt).toLocaleDateString()}
            </p>
            <p className="m-0 mb-4 text-sm text-gray-600 ">
              <strong>Role:</strong> {profile.role}
            </p>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Session Management:</strong> Use the "Sessions" tab
                above to manage your active sessions and logout from specific
                devices.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          setPendingAction(null);
          setOtpError("");
          setActionLoading(null);
        }}
        onVerify={handleOTPVerify}
        title={getOtpModalTitle()}
        description={getOtpModalDescription()}
        email={user?.email}
        error={otpError}
      />
    </div>
  );
};

export default UserProfile;
