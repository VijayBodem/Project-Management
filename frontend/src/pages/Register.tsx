import { useState, useCallback, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUser } from "../services/auth.service";
import { registerSchema, type RegisterInput } from "../schemas/validation";
import {
  ErrorMessage,
  ErrorAlert,
  SuccessAlert,
} from "../components/ErrorMessage";
import { handleApiError } from "../utils/errorHandler";

/**
 * Discriminated union type for form submission states
 * Ensures only one state is active at a time and provides type safety
 */
type FormState =
  | { status: "idle" } // Initial state, no operation in progress
  | { status: "loading" } // Form submission in progress
  | { status: "success"; message: string } // Successful registration
  | { status: "error"; message: string }; // Registration failed

/**
 * Props interface for the reusable InputField component
 * Defines the structure for form input fields with validation and accessibility support
 */
interface InputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  name: keyof RegisterInput;
  register: UseFormRegister<RegisterInput>;
  errors: FieldErrors<RegisterInput>;
  disabled?: boolean;
}

/**
 * Reusable input field component with built-in validation display and accessibility features
 * Reduces code duplication across form inputs while maintaining consistent styling and behavior
 *
 * @param label - The visible label text for the input field
 * @param type - HTML input type (text, email, password, etc.)
 * @param placeholder - Placeholder text displayed when input is empty
 * @param name - Field name that corresponds to RegisterInput schema
 * @param register - React Hook Form register function for form state management
 * @param errors - Form validation errors object
 * @param disabled - Whether the input should be disabled during loading states
 */
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
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-2"
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
        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
      />
      <ErrorMessage message={errors[name]?.message} />
    </div>
  )
);

InputField.displayName = "InputField";

/**
 * User registration page component
 * Provides a form for new users to create an account with validation and error handling
 * Features include form validation, loading states, and automatic redirect after successful registration
 *
 * @returns JSX.Element - The registration form UI
 */
const Register = memo(() => {
  // Navigation hook for programmatic routing
  const navigate = useNavigate();

  // Unified state management using discriminated union pattern
  // Ensures only one state (idle/loading/success/error) is active at a time
  // Provides better type safety and prevents conflicting states
  const [formState, setFormState] = useState<FormState>({ status: "idle" });

  // React Hook Form setup with Zod validation schema
  // Provides form state management, validation, and error handling
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema), // Zod schema validation
  });

  /**
   * Form submission handler with error handling and user feedback
   * Manages the complete registration flow including API calls and navigation
   * Uses unified state management to ensure consistent state transitions
   *
   * @param data - Validated form data conforming to RegisterInput schema
   */
  const onSubmit = useCallback(
    async (data: RegisterInput) => {
      // Set loading state to indicate operation in progress
      setFormState({ status: "loading" });

      try {
        // Attempt user registration via API
        await registerUser(data);

        // Set success state with message
        setFormState({
          status: "success",
          message: "Registration successful! Redirecting to login...",
        });

        // Redirect to login after showing success message
        setTimeout(() => navigate("/login"), 2000);
      } catch (err) {
        // Set error state with handled error message
        setFormState({ status: "error", message: handleApiError(err) });
      }
    },
    [navigate] // Dependency: navigate function for redirect
  );

  // console.log('errorrrrrr', errors)

  return (
    // Main container with responsive centering and background
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Registration card with modern styling */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h2>
          <p className="text-gray-600 text-sm mb-8">
            Join us to start managing your projects
          </p>
        </div>

        {/* Conditional rendering of alerts based on form state */}
        {(formState.status === "error" || formState.status === "success") && (
          <div className="mb-6">
            {formState.status === "error" && (
              <ErrorAlert
                message={formState.message}
                onClose={() => setFormState({ status: "idle" })}
              />
            )}
            {formState.status === "success" && (
              <SuccessAlert message={formState.message} />
            )}
          </div>
        )}

        {/* Registration form with validation and accessibility features */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate // Disable native HTML5 validation in favor of React Hook Form
        >
          <InputField
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            name="name"
            register={register}
            errors={errors}
            disabled={formState.status === "loading"}
          />

          <InputField
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            name="email"
            register={register}
            errors={errors}
            disabled={formState.status === "loading"}
          />

          <InputField
            label="Password"
            type="password"
            placeholder="Create a secure password"
            name="password"
            register={register}
            errors={errors}
            disabled={formState.status === "loading"}
          />

          {/* Submit button with loading state and accessibility features */}
          <button
            type="submit"
            disabled={formState.status === "loading"}
            className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
          >
            {formState.status === "loading" ? (
              <>
                {/* Animated loading spinner for visual feedback during submission */}
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
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer with link to login page for existing users */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
});

// Display name for React DevTools and debugging
Register.displayName = "Register";

export default Register;
