import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginUser } from "../services/auth.service";
import { useAuth } from "../context/AuthContext";
import { loginSchema, type LoginInput } from "../schemas/validation";
import { ErrorMessage, ErrorAlert } from "../components/ErrorMessage";
import { handleApiError } from "../utils/errorHandler";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError("");
    setLoading(true);

    try {
      const response = await loginUser(data);
      login(response.accessToken, response.refreshToken);
      navigate("/dashboard");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-md w-full">
        <div className="card shadow-soft">
          <div className="card-body">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gradient mb-2">SkillForge</h1>
              <h2 className="text-xl font-semibold text-gray-700">Welcome Back</h2>
              <p className="text-gray-500 mt-2">Sign in to your account</p>
            </div>

            {error && <ErrorAlert message={error} onClose={() => setError("")} />}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                  disabled={loading}
                  className="form-input"
                />
                <ErrorMessage message={errors.email?.message} />
              </div>

              <div>
                <label className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  {...register("password")}
                  disabled={loading}
                  className="form-input"
                />
                <ErrorMessage message={errors.password?.message} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary btn-lg"
              >
                {loading && <div className="loading-spinner mr-2"></div>}
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="text-center pt-6 border-t border-gray-200 mt-8">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                Create one here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
