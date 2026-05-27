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
  const { login, signInWithOtp, verifyOtp } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('password');
  const [otpStep, setOtpStep] = useState<OtpStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
