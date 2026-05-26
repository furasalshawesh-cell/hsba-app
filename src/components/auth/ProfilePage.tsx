import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, User, Mail, Phone, Shield, Calendar, Save, ArrowRight, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, updateProfile, signOut } = useAuth();
  
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await updateProfile({ name, phone });
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getSubscriptionLabel = (status: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      free: { text: 'مجاني', color: 'bg-gray-100 text-gray-700' },
      trial: { text: 'فترة تجريبية', color: 'bg-blue-100 text-blue-700' },
      active: { text: 'مفعل', color: 'bg-green-100 text-green-700' },
      expired: { text: 'منتهي', color: 'bg-red-100 text-red-700' },
      cancelled: { text: 'ملغي', color: 'bg-orange-100 text-orange-700' },
    };
    return labels[status] || labels.free;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير متوفر';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0ea5a4]" />
      </div>
    );
  }

  const subscription = getSubscriptionLabel(profile.subscription_status);

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
            {profile.role === 'admin' && (
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                مسؤول
              </span>
            )}
          </div>

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
                    value={profile.email}
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
                    value={formatDate(profile.created_at)}
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
                disabled={loading}
              >
                {loading ? (
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
