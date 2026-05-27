import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, Mail, Lock, Eye, EyeOff, Calculator, KeyRound, CheckCircle } from 'lucide-react';

type AuthMode = 'password' | 'otp';
type OtpStep = 'email' | 'verify' | 'success';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signInWithOtp, verifyOtp, signInWithGoogle } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('password');
  const [otpStep, setOtpStep] = useState<OtpStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('[v0] Google login error:', error);
        // Check for common OAuth errors
        if (error.message?.includes('provider is not enabled')) {
          setError('تسجيل الدخول بـ Google غير مفعّل. يرجى التواصل مع مدير النظام.');
        } else if (error.message?.includes('redirect_uri')) {
          setError('خطأ في إعدادات Google OAuth. يرجى التحقق من إعدادات Supabase.');
        } else {
          setError(`حدث خطأ أثناء تسجيل الدخول بـ Google: ${error.message}`);
        }
        setGoogleLoading(false);
      }
      // If no error, browser will redirect to Google OAuth page
    } catch (err) {
      console.error('[v0] Unexpected Google login error:', err);
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      setGoogleLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await login(email, password);
    
    if (error) {
      setError(error.message === 'Invalid login credentials' 
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        : error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signInWithOtp(email);
    
    if (error) {
      setError(error.message);
    } else {
      setOtpStep('verify');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await verifyOtp(email, otp);
    
    if (error) {
      setError(error.message);
    } else {
      setOtpStep('success');
      setTimeout(() => navigate('/'), 1500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0ea5a4] to-[#0d8a89] shadow-lg mb-4">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">حاسبة التمويل العقاري</h1>
          <p className="text-gray-500 mt-2">أهلاً بعودتك</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors mb-6 disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="text-sm font-medium text-gray-600">
              {googleLoading ? 'جاري التوجيه...' : 'تسجيل الدخول بـ Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">أو</span>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setMode('password'); setOtpStep('email'); setError(null); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'password'
                  ? 'bg-white text-[#0ea5a4] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              كلمة المرور
            </button>
            <button
              type="button"
              onClick={() => { setMode('otp'); setError(null); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'otp'
                  ? 'bg-white text-[#0ea5a4] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              رمز التحقق
            </button>
          </div>

          {/* Password Login Form */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10 h-12 text-right"
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 pl-10 h-12"
                    required
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-[#0ea5a4] hover:bg-[#0d9695] text-white text-base font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </form>
          )}

          {/* OTP Login Form */}
          {mode === 'otp' && otpStep === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10 h-12 text-right"
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-[#0ea5a4] hover:bg-[#0d9695] text-white text-base font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  'إرسال رمز التحقق'
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                سيتم إرسال رمز تحقق إلى بريدك الإلكتروني
              </p>
            </form>
          )}

          {mode === 'otp' && otpStep === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center mb-4">
                <p className="text-gray-600">تم إرسال رمز التحقق إلى</p>
                <p className="font-medium text-gray-800" dir="ltr">{email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">رمز التحقق</label>
                <div className="relative">
                  <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="pr-10 h-12 text-center tracking-[0.5em] font-mono text-lg"
                    maxLength={6}
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-[#0ea5a4] hover:bg-[#0d9695] text-white text-base font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  'تأكيد'
                )}
              </Button>

              <button
                type="button"
                onClick={() => { setOtpStep('email'); setOtp(''); setError(null); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                تغيير البريد الإلكتروني
              </button>
            </form>
          )}

          {mode === 'otp' && otpStep === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-lg font-medium text-gray-700">تم تسجيل الدخول بنجاح</p>
            </div>
          )}

          {/* Register Link */}
          {(mode === 'password' || (mode === 'otp' && otpStep === 'email')) && (
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-500">
                ليس لديك حساب؟{' '}
                <Link to="/register" className="text-[#0ea5a4] hover:underline font-medium">
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
