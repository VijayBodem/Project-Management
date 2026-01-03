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
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-slate-900">
        {label}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        disabled={disabled}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Section */}
          <div className="px-8 py-8 text-center bg-gradient-to-r from-green-600 to-green-700 text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">
            Create Account
            </h1>
            <p className="text-green-100">Join us to start managing your projects</p>
        </div>

          {/* Form Section */}
          <div className="px-8 py-8">

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

          <button
            type="submit"
            disabled={formState.status === "loading"}
                className="w-full flex justify-center items-center py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-xl transition-all duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm hover:shadow-lg"
          >
            {formState.status === "loading" ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </div>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

            <div className="text-center pt-8 border-t border-slate-100 mt-8">
              <span className="text-slate-600">Already have an account? </span>
            <Link
              to="/login"
                className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
            >
              Sign in here
            </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Display name for React DevTools and debugging
Register.displayName = "Register";

export default Register;
