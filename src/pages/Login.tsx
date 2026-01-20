import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-state';
import BrandLogo from '@/components/ui/brand-logo';
import Footer from '@/components/ui/footer';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';

type LoginStep = 'email' | 'otp';

const Login = () => {
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { sendOtp, verifyOtp, isLoggedIn } = useAuth();
  const notifications = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      notifications.error("Erro", "Digite seu email");
      return;
    }

    setLoading(true);

    try {
      const { error } = await sendOtp(email);

      if (error) {
        if (error.message.includes('Signups not allowed')) {
          notifications.error("Acesso restrito", "Seu email não está cadastrado. Contate o administrador.");
        } else {
          notifications.error("Erro", error.message);
        }
        setLoading(false);
        return;
      }

      notifications.success("Código enviado!", `Verifique sua caixa de entrada: ${email}`);
      setStep('otp');
      setCountdown(60);

      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      notifications.error("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const token = otpDigits.join('');
    if (token.length !== 6) {
      notifications.error("Erro", "Digite o código completo de 6 dígitos");
      return;
    }

    setLoading(true);

    try {
      const { error } = await verifyOtp(email, token);

      if (error) {
        notifications.error("Código inválido", "Verifique o código e tente novamente");
        setOtpDigits(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        setLoading(false);
        return;
      }

      // Sucesso - o redirecionamento acontece via useEffect de isLoggedIn
      notifications.success("Login realizado!", "Bem-vindo ao sistema");
      // Importante: resetar loading para não ficar travado
      setLoading(false);
    } catch (error: any) {
      notifications.error("Erro", error.message);
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (value && index === 5 && newDigits.every(d => d !== '')) {
      setTimeout(() => handleVerifyOtp(), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newDigits = pastedData.split('');
      setOtpDigits(newDigits);
      otpRefs.current[5]?.focus();
      setTimeout(() => handleVerifyOtp(), 100);
    }
  };

  if (loading && step === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner message="Enviando código..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="mb-8 animate-fade-in">
          <BrandLogo size="xl" className="text-center" showSubtitle />
        </div>

        <Card className="w-full max-w-md shadow-xl animate-fade-in bg-card">
          {step === 'email' ? (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Acesso ao Sistema</CardTitle>
                <CardDescription>
                  Digite seu email para receber o código de acesso
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      required
                      autoFocus
                      className="text-center text-lg"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    Enviar Código de Acesso
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-4"
                  onClick={() => {
                    setStep('email');
                    setOtpDigits(['', '', '', '', '', '']);
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Voltar
                </Button>

                <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Digite o Código</CardTitle>
                <CardDescription>
                  Enviamos um código de 6 dígitos para<br />
                  <strong>{email}</strong>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-bold"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || otpDigits.some(d => !d)}
                  >
                    {loading ? 'Verificando...' : 'Entrar'}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    {countdown > 0 ? (
                      <p>Reenviar código em {countdown}s</p>
                    ) : (
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleSendOtp}
                        disabled={loading}
                      >
                        Não recebeu? Reenviar código
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <Footer variant="minimal" className="mb-4" />
    </div>
  );
};

export default Login;
