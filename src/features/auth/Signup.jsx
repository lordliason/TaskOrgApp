import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import ColorPicker from '../../components/ColorPicker';
import {
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  AlertCircle,
} from 'lucide-react';

function Signup() {
  const [formData, setFormData] = useState({
    organizationName: '',
    displayName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    color: '#4a9eff',
  });
  const [validationError, setValidationError] = useState('');
  const { signup, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError('');
  };

  const handleColorChange = (color) => {
    setFormData((prev) => ({ ...prev, color }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    const result = await signup({
      email: formData.email,
      password: formData.password,
      displayName: formData.displayName,
      phone: formData.phone,
      color: formData.color,
      organizationName: formData.organizationName,
    });

    if (result.success) {
      navigate('/');
    }
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-main py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Signup Box */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="logo-gradient text-3xl mb-2">Task Matrix</h1>
            <p className="text-text-muted text-sm">
              Set up your workspace and start managing tasks
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {displayError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {displayError}
              </div>
            )}

            <div className="space-y-4">
              {/* Organization Name */}
              <div>
                <label htmlFor="organizationName" className="label">
                  Organization Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    required
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="input pl-12"
                    placeholder="My Team"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="label">
                  Your Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={handleChange}
                    className="input pl-12"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="label">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input pl-12"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="label">
                  Phone Number (optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input pl-12"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input pl-12"
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input pl-12"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              {/* Color Picker */}
              <ColorPicker
                label="Your Color"
                value={formData.color}
                onChange={handleColorChange}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Create Organization'
              )}
            </button>

            <p className="text-center text-sm text-text-muted">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-accent-blue hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
