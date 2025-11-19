import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/shared/user/context/UserContext';
import { Mail, Lock, User, Github, Chrome, Briefcase, Users, Building2 } from 'lucide-react';
import emailService from '@/shared/lib/services/emailService';
import { Persona, getPersonaFromTargetGroup } from '@/shared/user/segmentation/personaMapping';

interface LoginFormProps {
  redirect?: string;
  onSuccess?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export default function LoginForm({ redirect, onSuccess }: LoginFormProps) {
  const router = useRouter();
  const { setUserProfile } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [persona, setPersona] = useState<Persona | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize persona from localStorage target group selection if available
  useEffect(() => {
    if (isSignUp && !persona) {
      const storedPersona = getPersonaFromTargetGroup();
      if (storedPersona) {
        setPersona(storedPersona);
      } else {
        // Default to founder if nothing stored
        setPersona('founder');
      }
    }
  }, [isSignUp, persona]);

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
          name: isSignUp ? name : undefined,
          persona: isSignUp ? persona : undefined
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

      // Call onSuccess if provided, otherwise redirect
      if (onSuccess) {
        onSuccess();
      } else {
        if (redirect) {
          router.push(redirect);
        } else {
          router.push('/dashboard');
        }
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
    <div className="w-full max-w-md">
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
            <>
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

              {/* Persona Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a... <span className="text-gray-500 font-normal">(helps us personalize your experience)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPersona('founder');
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('selectedTargetGroup', 'startups');
                      }
                    }}
                    className={`p-3 border-2 rounded-lg transition-all text-left ${
                      persona === 'founder'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className={`w-4 h-4 ${persona === 'founder' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`font-medium text-sm ${persona === 'founder' ? 'text-blue-600' : 'text-gray-700'}`}>
                        Founder
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Solo founder or startup</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPersona('advisor');
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('selectedTargetGroup', 'advisors');
                      }
                    }}
                    className={`p-3 border-2 rounded-lg transition-all text-left ${
                      persona === 'advisor'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users className={`w-4 h-4 ${persona === 'advisor' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`font-medium text-sm ${persona === 'advisor' ? 'text-blue-600' : 'text-gray-700'}`}>
                        Advisor
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Business consultant</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPersona('incubator');
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('selectedTargetGroup', 'universities');
                      }
                    }}
                    className={`p-3 border-2 rounded-lg transition-all text-left ${
                      persona === 'incubator'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className={`w-4 h-4 ${persona === 'incubator' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`font-medium text-sm ${persona === 'incubator' ? 'text-blue-600' : 'text-gray-700'}`}>
                        Incubator
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">University/Program</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPersona('sme');
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('selectedTargetGroup', 'sme');
                      }
                    }}
                    className={`p-3 border-2 rounded-lg transition-all text-left ${
                      persona === 'sme'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className={`w-4 h-4 ${persona === 'sme' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`font-medium text-sm ${persona === 'sme' ? 'text-blue-600' : 'text-gray-700'}`}>
                        SME
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Established business</p>
                  </button>
                </div>
              </div>
            </>
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
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
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

        {/* GDPR Note */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Data Privacy:</strong> By signing in, you agree to our{' '}
            <a href="/privacy" className="underline hover:text-blue-900" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            . We comply with GDPR and only use your data to provide our services.
          </p>
        </div>

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
                  // Initialize persona when switching to signup
                  if (!persona) {
                    const storedPersona = getPersonaFromTargetGroup();
                    setPersona(storedPersona || 'founder');
                  }
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
  );
}

