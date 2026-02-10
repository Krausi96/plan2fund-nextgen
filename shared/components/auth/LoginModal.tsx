import { useEffect } from 'react';
import { useUser } from '@/platform/core/context/hooks/useUser';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirect?: string;
}

export default function LoginModal({ isOpen, onClose, redirect }: LoginModalProps) {
  const { userProfile, isLoadingUser } = useUser();

  // Don't auto-close if still loading - wait for auth check to complete
  // Only auto-close if user is confirmed logged in AND modal is open
  useEffect(() => {
    if (!isLoadingUser && userProfile && isOpen) {
      // Small delay to prevent race condition with login success
      const timer = setTimeout(() => {
        onClose();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [userProfile, isLoadingUser, isOpen, onClose]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
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

        <LoginForm 
          redirect={redirect} 
          onSuccess={handleSuccess}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

