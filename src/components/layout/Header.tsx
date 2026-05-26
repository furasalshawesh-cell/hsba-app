import React from 'react';
import { useAppState } from '../../context/AppContext';
import { Calculator, ShieldAlert, Award, FileText } from 'lucide-react';

export default function Header() {
  const { activeNav, setActiveNav, hasUnsavedChanges } = useAppState();

  const handleNavChange = (target: 'calculator' | 'admin') => {
    if (activeNav === 'admin' && target === 'calculator' && hasUnsavedChanges) {
      const confirmLeave = window.confirm("لديك تغييرات غير محفوظة، هل تريد المتابعة؟");
      if (confirmLeave) {
        setActiveNav(target);
      }
    } else {
      setActiveNav(target);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Identity */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0057B8] rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-2xl select-none">
            ح
          </div>
          <div>
            <h1 className="font-sans font-bold text-2xl tracking-tight text-[#111827] leading-none">حسبة</h1>
            <span className="text-xs text-gray-500 font-medium block mt-1">التمويل الذكي للمواطن السعودي</span>
          </div>
        </div>

        {/* Global Navigation */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            id="nav-calc-btn"
            onClick={() => handleNavChange('calculator')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-sans text-xs font-bold transition-all ${
              activeNav === 'calculator'
                ? 'bg-white text-[#0057B8] shadow-sm'
                : 'text-gray-500 hover:text-[#111827]'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>حاسبة العميل</span>
          </button>
          
          <button
            id="nav-admin-btn"
            onClick={() => handleNavChange('admin')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-sans text-xs font-bold transition-all ${
              activeNav === 'admin'
                ? 'bg-white text-[#0057B8] shadow-sm'
                : 'text-gray-500 hover:text-[#111827]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>لوحة التحكم للإدارة</span>
          </button>
        </div>

        {/* Brand Minimal Accent */}
        <div className="hidden md:flex items-center gap-1.5">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">النسخة التجريبية المعتمدة v2.4</span>
        </div>
      </div>
    </header>
  );
}
