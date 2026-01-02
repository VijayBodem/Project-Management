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
    <div>
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        disabled={disabled}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        className="form-input"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              SkillForge
            </h1>
            <h2 className="text-xl font-semibold text-gray-700">
              Welcome Back
            </h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

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
              className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
            >
              {loginState.status === "loading" ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="text-center pt-6 border-t border-gray-200 mt-8">
            <span className="text-gray-600">Don't have an account? </span>
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
            >
              Create one here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

Login.displayName = "Login";

export default Login;
