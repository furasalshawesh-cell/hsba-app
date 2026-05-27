import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSubscription?: boolean; // اشتراك نشط مطلوب (ليس free)
}

export default function ProtectedRoute({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireSubscription = false,
}: ProtectedRouteProps) {
  const { user, profile, loading, isAdmin } = useAuth();

  // لا تزال تحميل
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

  // غير مسجّل — حوّله للدخول
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // يتطلب أدمن
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // يتطلب اشتراك نشط
  if (requireSubscription) {
    const status = profile?.subscription_status;
    const hasActiveSubscription = status === 'active' || status === 'trial';
    if (!hasActiveSubscription && !isAdmin) {
      return <Navigate to="/subscribe" replace />;
    }
  }

  return <>{children}</>;
}
