import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  updateUserPreferences,
  type UserProfile as UserProfileType,
} from "../services/user.service";
import { logoutAllDevices } from "../services/auth.service";
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

const UserProfile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "profile" | "password" | "preferences"
  >("profile");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleLogoutAllDevices = async () => {
    if (
      !confirm(
        "Are you sure you want to logout from all devices? You will need to login again."
      )
    ) {
      return;
    }

    try {
      await logoutAllDevices();
      setSuccess("Logged out from all devices successfully!");

      setTimeout(() => {
        logout();
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handlePreferenceChange = async (key: string, value: any) => {
    if (!profile) return;

    try {
      const updated = await updateUserPreferences({ [key]: value });
      setProfile({ ...profile, preferences: updated });
      setSuccess("Preferences updated!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(handleApiError(err));
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
          <div className="mb-6">
            <h3 className="m-0 mb-4 text-lg font-semibold text-gray-900 ">
              Notifications
            </h3>

            <div className="flex justify-between items-center p-4 border border-gray-200 ">
              <div>
                <p className="m-0 mb-1 font-medium text-gray-900 ">
                  Email Notifications
                </p>
                <p className="m-0 text-sm text-gray-600 ">
                  Receive notifications via email
                </p>
              </div>
              <label className="relative inline-block w-[50px] h-6">
                <input
                  type="checkbox"
                  checked={profile.preferences.emailNotifications}
                  onChange={(e) =>
                    handlePreferenceChange(
                      "emailNotifications",
                      e.target.checked
                    )
                  }
                  className="opacity-0 w-0 h-0 peer"
                />
                <span className="absolute cursor-pointer inset-0 bg-gray-300 ">
                  <span
                    className={`absolute h-[18px] w-[18px] bottom-[3px] bg-white transition-all duration-300 rounded-full ${
                      profile.preferences.emailNotifications
                        ? "left-[28px]"
                        : "left-[3px]"
                    }`}
                  />
                </span>
              </label>
            </div>

            <div className="flex justify-between items-center p-4 border border-gray-200 ">
              <div>
                <p className="m-0 mb-1 font-medium text-gray-900 ">
                  Push Notifications
                </p>
                <p className="m-0 text-sm text-gray-600 ">
                  Receive push notifications in the app
                </p>
              </div>
              <label className="relative inline-block w-[50px] h-6">
                <input
                  type="checkbox"
                  checked={profile.preferences.pushNotifications}
                  onChange={(e) =>
                    handlePreferenceChange(
                      "pushNotifications",
                      e.target.checked
                    )
                  }
                  className="opacity-0 w-0 h-0 peer"
                />
                <span className="absolute cursor-pointer inset-0 bg-gray-300 ">
                  <span
                    className={`absolute h-[18px] w-[18px] bottom-[3px] bg-white transition-all duration-300 rounded-full ${
                      profile.preferences.pushNotifications
                        ? "left-[28px]"
                        : "left-[3px]"
                    }`}
                  />
                </span>
              </label>
            </div>
          </div>

          <div className="p-4 bg-gray-50 ">
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

            <button
              onClick={handleLogoutAllDevices}
              className="w-full px-5 py-2.5 border border-red-500 rounded bg-white "
            >
              🚪 Logout from All Devices
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
