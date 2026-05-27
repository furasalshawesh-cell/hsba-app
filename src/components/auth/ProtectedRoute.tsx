import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '../ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSubscription?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireSubscription = false,
}: ProtectedRouteProps) {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Still loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#0ea5a4]" />
          <p className="text-sm text-gray-500">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // Requires admin but user is not admin - show access denied page
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">غير مصرح</h2>
          <p className="text-gray-600 text-sm mb-6">
            ليس لديك صلاحية للوصول إلى لوحة التحكم.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="bg-[#0ea5a4] hover:bg-[#0d9695] text-white"
          >
            العودة للحاسبة
          </Button>
        </div>
      </div>
    );
  }

  // Requires active subscription
  if (requireSubscription) {
    const status = profile?.subscription_status;
    const hasActiveSubscription = status === 'active' || status === 'trial';
    if (!hasActiveSubscription && !isAdmin) {
      return <Navigate to="/subscribe" replace />;
    }
  }

  return <>{children}</>;
}
