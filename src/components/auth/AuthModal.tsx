import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Mail, KeyRound, CheckCircle } from 'lucide-react';

type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { signInWithOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signInWithOtp(email);
    
    if (error) {
      setError(error.message);
    } else {
      setStep('otp');
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
      setStep('success');
      setTimeout(() => {
        onOpenChange(false);
        // Reset state for next time
        setStep('email');
        setEmail('');
        setOtp('');
      }, 1500);
    }
    setLoading(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('email');
      setEmail('');
      setOtp('');
      setError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {step === 'email' && 'تسجيل الدخول'}
            {step === 'otp' && 'التحقق من الرمز'}
            {step === 'success' && 'تم بنجاح'}
          </DialogTitle>
        </DialogHeader>

        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 text-right"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#0ea5a4] hover:bg-[#0d9695] text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
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

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">رمز التحقق</label>
              <div className="relative">
                <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="أدخل رمز التحقق المكون من 6 أرقام"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="pr-10 text-center tracking-widest"
                  maxLength={6}
                  required
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#0ea5a4] hover:bg-[#0d9695] text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                'تأكيد'
              )}
            </Button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              تغيير البريد الإلكتروني
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-lg font-medium text-gray-700">تم تسجيل الدخول بنجاح</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
