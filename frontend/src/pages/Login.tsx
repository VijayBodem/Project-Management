import { useState, useCallback, memo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { loginSchema, type LoginInput } from "../schemas/validation";
import { ErrorMessage, ErrorAlert } from "../components/ErrorMessage";
import OTPVerificationModal from "../components/OTPVerificationModal";

// Discriminated union type for login form states
type LoginState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "otp_required"; email: string };

// Reusable input field component for consistency
interface InputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  name: keyof LoginInput;
  register: UseFormRegister<LoginInput>;
  errors: FieldErrors<LoginInput>;
  disabled?: boolean;
}

const InputField = memo(
  ({
    label,
    type,
    placeholder,
    name,
    register,
    errors,
    disabled,
  }: InputFieldProps) => (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-900"
      >
        {label}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        disabled={disabled}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <ErrorMessage message={errors[name]?.message} />
    </div>
  )
);

InputField.displayName = "InputField";

const Login = memo(() => {
  const navigate = useNavigate();
  const { login, verifyOTP, isAuthenticated, deviceFingerprint } = useAuth();

  // Unified state management using discriminated union
  const [loginState, setLoginState] = useState<LoginState>({ status: "idle" });

  // OTP Modal state
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpError, setOtpError] = useState<string>("");
  const [loginCredentials, setLoginCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Memoized submit handler to prevent unnecessary re-renders
  const onSubmit = useCallback(
    async (data: LoginInput) => {
      setLoginState({ status: "loading" });
      setOtpError("");

      try {
        const result = await login(
          data.email,
          data.password,
          deviceFingerprint || undefined
        );

        if (!result.success) {
          setLoginState({
            status: "error",
            message: result.message || "Login failed",
          });
          return;
        }

        if (result.requiresOTP) {
          // Store credentials for OTP verification
          setLoginCredentials({ email: data.email, password: data.password });
          setLoginState({ status: "otp_required", email: data.email });
          setShowOTPModal(true);
        } else {
          // Normal login successful
          navigate("/dashboard");
        }
      } catch (err: any) {
        setLoginState({
          status: "error",
          message: err.message || "Login failed",
        });
      }
    },
    [login, navigate, deviceFingerprint]
  );

  // Handle OTP verification
  const handleOTPVerify = useCallback(
    async (otp: string) => {
      if (!loginCredentials) return;

      const result = await verifyOTP(otp, "login");

      if (result.success) {
        setShowOTPModal(false);
        setLoginCredentials(null);
        navigate("/dashboard");
      } else {
        setOtpError(result.message);
      }
    },
    [verifyOTP, loginCredentials, navigate]
  );

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Header Section */}
            <div className="px-8 py-8 text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
              <p className="text-blue-100">Sign in to your account</p>
            </div>

            {/* Form Section */}
            <div className="px-8 py-8">
              {/* Conditional error display */}
              {loginState.status === "error" && (
                <div className="mb-6">
                  <ErrorAlert
                    message={loginState.message}
                    onClose={() => setLoginState({ status: "idle" })}
                  />
                </div>
              )}

              {/* OTP Required Message */}
              {loginState.status === "otp_required" && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-blue-800">
                        Additional Verification Required
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        We detected another active session. For security, we've
                        sent a verification code to your email.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
                noValidate
              >
                <InputField
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email address"
                  name="email"
                  register={register}
                  errors={errors}
                  disabled={
                    loginState.status === "loading" ||
                    loginState.status === "otp_required"
                  }
                />

                <InputField
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  name="password"
                  register={register}
                  errors={errors}
                  disabled={
                    loginState.status === "loading" ||
                    loginState.status === "otp_required"
                  }
                />

                <button
                  type="submit"
                  disabled={
                    loginState.status === "loading" ||
                    loginState.status === "otp_required"
                  }
                  className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-lg"
                >
                  {loginState.status === "loading" ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </div>
                  ) : loginState.status === "otp_required" ? (
                    "Verification Code Sent"
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <div className="text-center pt-8 border-t border-slate-100 mt-8">
                <span className="text-slate-600">Don't have an account? </span>
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
                >
                  Create one here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          setLoginState({ status: "idle" });
          setLoginCredentials(null);
        }}
        onVerify={handleOTPVerify}
        title="Verify Your Login"
        description="For your security, we need to verify your identity before allowing access from this device."
        email={
          loginState.status === "otp_required" ? loginState.email : undefined
        }
        isLoading={false}
        error={otpError}
      />
    </>
  );
});

Login.displayName = "Login";

export default Login;
