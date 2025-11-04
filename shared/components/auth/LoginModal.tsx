import { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/shared/contexts/UserContext';
import { X, Mail, Lock, User, Github, Chrome } from 'lucide-react';
import emailService from '@/shared/lib/emailService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirect?: string;
}

export default function LoginModal({ isOpen, onClose, redirect }: LoginModalProps) {
  const router = useRouter();
  const { setUserProfile, userProfile } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, close modal
  if (userProfile && isOpen) {
    onClose();
    return null;
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (isSignUp && !password) {
      setError('Password is required for sign up');
      return;
    }

    if (!isSignUp && !password) {
      setError('Password is required to sign in');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: isSignUp ? name : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      // Update user profile in context
      setUserProfile({
        id: String(data.user.id), // Use database ID as string
        segment: data.user.segment || 'B2C_FOUNDER',
        programType: data.user.program_type || 'GRANT',
        industry: data.user.industry || 'GENERAL',
        language: data.user.language || 'EN',
        payerType: data.user.payer_type || 'INDIVIDUAL',
        experience: data.user.experience || 'NEWBIE',
        createdAt: data.user.created_at,
        lastActiveAt: data.user.last_active_at,
        gdprConsent: data.user.gdpr_consent || true
      });

      // Send welcome email (non-blocking)
      if (isSignUp && email) {
        emailService.sendWelcomeEmail(email, name || undefined).catch(err => {
          console.error('Failed to send welcome email:', err);
        });
      }

      // Close modal and redirect if needed
      onClose();
      if (redirect) {
        router.push(redirect);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'github') => {
    // TODO: Implement OAuth flow
    console.log(`Social login with ${provider}`);
    // For now, just show a message
    setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon!`);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {isSignUp 
              ? 'Sign up to save your progress and access your dashboard' 
              : 'Sign in to continue to your account'}
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all font-medium text-gray-700"
            >
              <Chrome className="w-5 h-5 text-blue-600" />
              Continue with Google
            </button>
            <button
              onClick={() => handleSocialLogin('github')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-gray-800 hover:bg-gray-50 transition-all font-medium text-gray-700"
            >
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name (optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Your name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password {isSignUp && '(min. 8 characters)'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                  required={isSignUp}
                  minLength={isSignUp ? 8 : undefined}
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => setError('Password reset coming soon!')}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/30"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setError('');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setError('');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

