import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, User, Mail, Phone, Shield, Calendar, Save, ArrowRight, CheckCircle, Settings, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, logout, isAdmin, ensureProfileExists, loading } = useAuth();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setProfileLoading(false);
    } else if (user && !loading) {
      // Profile missing, try to create it
      ensureProfileExists().then(() => {
        setProfileLoading(false);
      });
    } else if (!loading) {
      setProfileLoading(false);
    }
  }, [profile, user, loading, ensureProfileExists]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error } = await updateProfile({ name, phone });
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const getSubscriptionLabel = (status: string | undefined) => {
    const labels: Record<string, { text: string; color: string }> = {
      free: { text: 'مجاني', color: 'bg-gray-100 text-gray-700' },
      trial: { text: 'فترة تجريبية', color: 'bg-blue-100 text-blue-700' },
      active: { text: 'مفعل', color: 'bg-green-100 text-green-700' },
      expired: { text: 'منتهي', color: 'bg-red-100 text-red-700' },
      cancelled: { text: 'ملغي', color: 'bg-orange-100 text-orange-700' },
    };
    return labels[status || 'free'] || labels.free;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'غير متوفر';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Show loading while checking profile
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#0ea5a4] mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  // Show message if no profile and couldn't create one
  if (!profile && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4" dir="rtl">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">لم يتم إنشاء الملف الشخصي</h2>
            <p className="text-gray-600 mb-6">
              يرجى المحاولة مرة أخرى أو تسجيل الخروج وإعادة تسجيل الدخول.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => ensureProfileExists()}
                className="w-full h-12 bg-[#0ea5a4] hover:bg-[#0d9695] text-white"
              >
                إعادة المحاولة
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full h-12"
              >
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subscription = getSubscriptionLabel(profile?.subscription_status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowRight className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">الملف الشخصي</h1>
            <p className="text-gray-500">إدارة معلومات حسابك</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-[#0ea5a4] to-[#0d8a89]" />
          
          {/* Avatar */}
          <div className="px-8 -mt-12">
            <div className="w-24 h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
              <User className="w-12 h-12 text-[#0ea5a4]" />
            </div>
          </div>

          {/* Info Badges */}
          <div className="px-8 py-4 flex flex-wrap gap-3">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${subscription.color}`}>
              {subscription.text}
            </span>
            {isAdmin && (
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                مدير النظام
              </span>
            )}
          </div>

          {/* Admin Quick Access */}
          {isAdmin && (
            <div className="px-8 pb-4">
              <Button
                type="button"
                onClick={() => navigate('/admin')}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Settings className="ml-2 h-5 w-5" />
                الدخول إلى لوحة التحكم
              </Button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الاسم</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="أدخل اسمك"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pr-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">رقم الجوال</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="05xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pr-10 h-12"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Read-only fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    value={profile?.email || user?.email || ''}
                    className="pr-10 h-12 bg-gray-50"
                    disabled
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">تاريخ التسجيل</label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={formatDate(profile?.created_at)}
                    className="pr-10 h-12 bg-gray-50"
                    disabled
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                تم حفظ التغييرات بنجاح
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1 h-12 bg-[#0ea5a4] hover:bg-[#0d9695] text-white"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-5 w-5" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Sign out section */}
          <div className="px-8 pb-8 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleSignOut}
              className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50"
            >
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
