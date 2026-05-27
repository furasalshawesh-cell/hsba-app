import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ShieldX, ArrowRight } from 'lucide-react';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
};

export default function ProtectedRoute({ 
  children, 
  requireAuth = true,
  requireAdmin = false 
}: ProtectedRouteProps) {
  const { user, loading, isConfigured, isAdmin } = useAuth();
  const location = useLocation();

  // If Supabase is not configured, allow basic access but still check admin requirements
  if (!isConfigured) {
    // If admin is required but no auth system, redirect to home (no way to prove admin status)
    if (requireAdmin) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  // Show loading spinner while checking auth (with safety timeout from AuthContext)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#0ea5a4] mx-auto mb-4" />
          <p className="text-gray-500">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Requires admin but user is not admin - show access denied page
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">غير مصرح</h2>
          <p className="text-gray-600 mb-8">
            ليس لديك صلاحية للوصول إلى لوحة التحكم.
            <br />
            هذه الصفحة متاحة للمسؤولين فقط.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-3.5 bg-[#0ea5a4] hover:bg-[#0d9695] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              العودة للصفحة الرئيسية
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              الرجوع للخلف
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
