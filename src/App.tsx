import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppStateProvider, useAppState } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import StepWizard from './components/calculator/StepWizard';
import AdminDashboard from './components/admin/AdminDashboard';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ProfilePage from './components/auth/ProfilePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ShieldCheck, Mail, Phone } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs font-semibold">
        
        {/* Logo & Legal Disclaimer */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0057B8] rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-md">
              ح
            </div>
            <span className="text-white font-bold text-lg">حسبة الذكية</span>
          </div>
          <p className="font-sans leading-relaxed text-slate-400">
            منصة تقنية مالية (Fintech) مرنة لحساب التمويل العقاري والشخصي بما يطابق تعليمات البنك المركزي السعودي (SAMA) ومصلحة معاشات التقاعد ومؤسسة تبادل المنافع.
          </p>
        </div>

        {/* Quick links info */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm">سرعة التنقل والتحكم لمدير الحسبة:</h4>
          <p className="font-sans leading-relaxed">
            يمكنك الدخول إلى لوحة تحكم الإشراف وتغيير هوامش البنوك أو تعديل معايير الحد الأدنى للرواتب والمقاييس عبر النوافذ في القائمة الجانبية بنقرة واحدة لتجربة الملاءمة والمقارنة الفورية في حاسبة العميل.
          </p>
        </div>

        {/* Contact Details */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm">قنوات الارتباط والاستعلام:</h4>
          <div className="space-y-1.5 flex flex-col">
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#0EA5A4]" />
              <span className="font-mono text-slate-300">support@hesba.sa</span>
            </span>
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#0EA5A4]" />
              <span className="font-mono text-slate-300">+966 11 405 6000</span>
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0EA5A4]" />
              <span className="text-emerald-500">متوافق مع الشريعة الإسلامية بالكامل</span>
            </span>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-800 text-center text-[10px] text-slate-500">
        <p>© {new Date().getFullYear()} حسبة للحلول المالية والتقنية. جميع الحقوق محفوظة لوزارة التجارة وهيئة منشآت والمؤسسات المانحة.</p>
      </div>
    </footer>
  );
}

// Calculator page layout
function CalculatorLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />
      <main className="flex-grow">
        <StepWizard />
      </main>
      <Footer />
    </div>
  );
}

// Admin dashboard page layout
function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />
      <main className="flex-grow">
        <AdminDashboard />
      </main>
      <Footer />
    </div>
  );
}

function AppRoutes() {
  const { loading } = useAuth();

  // شاشة التحميل الأولية
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0ea5a4] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">جاري التحقق من الهوية...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* صفحات عامة — تحوّل للرئيسية إذا مسجّل */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <RegisterPage />}
      />

      {/* صفحة الملف الشخصي — تتطلب تسجيل دخول */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute requireAuth>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* لوحة الإدارة — للأدمن فقط */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAuth requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }
      />

      {/* الصفحة الرئيسية — الحاسبة — لجميع المستخدمين المسجلين */}
      <Route
        path="/"
        element={
          <ProtectedRoute requireAuth>
            <CalculatorLayout />
          </ProtectedRoute>
        }
      />

      {/* أي مسار آخر */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppStateProvider>
          <AppRoutes />
        </AppStateProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
