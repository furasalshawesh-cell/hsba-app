import React from 'react';
import { AppStateProvider, useAppState } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import StepWizard from './components/calculator/StepWizard';
import AdminDashboard from './components/admin/AdminDashboard';
import { ShieldCheck, Mail, Phone } from 'lucide-react';

function DashboardOrWizard() {
  const { activeNav } = useAppState();

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Content Area */}
      <main className="flex-grow">
        {activeNav === 'calculator' ? <StepWizard /> : <AdminDashboard />}
      </main>

      {/* Modern Professional Footer */}
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
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <div className="min-h-screen flex flex-col justify-between">
          <Header />
          <DashboardOrWizard />
        </div>
      </AppStateProvider>
    </AuthProvider>
  );
}
