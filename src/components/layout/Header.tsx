import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Calculator, ShieldAlert, User, LogOut, Save, Loader2, UserCircle } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export default function Header() {
  const navigate = useNavigate();
  const { activeNav, setActiveNav, hasUnsavedChanges, formData } = useAppState();
  const { user, profile, loading: authLoading, signOut, saveSettings, isConfigured, isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleNavChange = (target: 'calculator' | 'admin') => {
    // Only admins can access the admin panel
    if (target === 'admin' && !isAdmin) {
      return;
    }
    
    if (activeNav === 'admin' && target === 'calculator' && hasUnsavedChanges) {
      const confirmLeave = window.confirm("لديك تغييرات غير محفوظة، هل تريد المتابعة؟");
      if (confirmLeave) {
        setActiveNav(target);
      }
    } else {
      setActiveNav(target);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setSaving(true);
    await saveSettings(formData);
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
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
          
          {/* Only show admin button for admins */}
          {isAdmin && (
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
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-xs text-gray-400 font-semibold uppercase tracking-wider">v2.4</span>
          
          {isConfigured && (
            authLoading ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {profile?.name || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" dir="rtl">
                  <DropdownMenuItem onClick={handleProfile}>
                    <UserCircle className="ml-2 h-4 w-4" />
                    <span>الملف الشخصي</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSaveSettings} disabled={saving}>
                    {saving ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="ml-2 h-4 w-4" />
                    )}
                    <span>حفظ الإعدادات</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="ml-2 h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
