import { useState, useCallback, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginUser } from "../services/auth.service";
import { useAuth } from "../context/AuthContext";
import { loginSchema, type LoginInput } from "../schemas/validation";
import { ErrorMessage, ErrorAlert } from "../components/ErrorMessage";
import { handleApiError } from "../utils/errorHandler";

// Discriminated union type for login form states
type LoginState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

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
  const { login } = useAuth();

  // Unified state management using discriminated union
  const [loginState, setLoginState] = useState<LoginState>({ status: "idle" });

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

      try {
        const response = await loginUser(data);
        login(response.accessToken, response.refreshToken);
        navigate("/dashboard");
      } catch (err) {
        setLoginState({ status: "error", message: handleApiError(err) });
      }
    },
    [login, navigate]
  );

  return (
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
                disabled={loginState.status === "loading"}
              />

              <InputField
                label="Password"
                type="password"
                placeholder="Enter your password"
                name="password"
                register={register}
                errors={errors}
                disabled={loginState.status === "loading"}
              />

              <button
                type="submit"
                disabled={loginState.status === "loading"}
                className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-lg"
              >
                {loginState.status === "loading" ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </div>
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
  );
});

Login.displayName = "Login";

export default Login;
