import Image from "next/image";
import demo1 from "@/assets/img/demo1.png";
import demo2 from "@/assets/img/demo2.png";
import demo3 from "@/assets/img/demo3.png";

const demoImages = [demo1, demo2, demo3];
import React, { useState, useEffect } from 'react';
import { authService } from "../../services/auth.service";
import { Eye, EyeOff, Fingerprint, ShieldCheck, ScanFace, Mail, Lock, Building2, User, ArrowRight, KeyRound } from 'lucide-react';



interface LoginViewProps {
authMode: 'login' | 'register' | 'setup' | 'forgotPassword';
setAuthMode: (
  mode: 'login' | 'register' | 'setup' | 'forgotPassword'
) => void;
  authForm: any;
  setAuthForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  setupRequired?: boolean;
  onSetupSubmit?: (setupData: any) => Promise<boolean>;
}



export default function LoginView({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  onSubmit,
  addToast,
  setupRequired,
  onSetupSubmit
}: LoginViewProps) {

  const [currentImage, setCurrentImage] = useState(0);

useEffect(() => {
    const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % demoImages.length);
    }, 3000);

    return () => clearInterval(interval);
}, []);
  // Local state for setup form
  const [setupData, setSetupData] = useState({
    companyName: '',
    companyEmail: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [showSetupConfirmPassword, setShowSetupConfirmPassword] = useState(false);
 const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
const [forgotStep, setForgotStep] = useState(1);

const [forgotData, setForgotData] = useState({
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
});
  const handleLocalSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field validations
    if (!setupData.companyName.trim()) {
      setError('Company Name is required.');
      return;
    }
    if (!setupData.companyEmail.trim()) {
      setError('Company Email is required.');
      return;
    }
    if (!setupData.name.trim()) {
      setError('Super Admin Name is required.');
      return;
    }
    if (!setupData.email.trim()) {
      setError('Super Admin Email is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(setupData.email) || !emailRegex.test(setupData.companyEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (setupData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (setupData.password !== setupData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (onSetupSubmit) {
        const ok = await onSetupSubmit({
          companyName: setupData.companyName,
          companyEmail: setupData.companyEmail,
          name: setupData.name,
          email: setupData.email,
          password: setupData.password
        });
        if (!ok) {
          setError('Setup execution failed. Please verify database connection.');
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Initial setup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Format validations
    if (!authForm.email.trim()) {
      setError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authForm.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!authForm.password) {
      setError('Password is required.');
      return;
    }
    if (authForm.password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(e);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Invalid email or password.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

const handleForgotPassword = async () => {
  setLoading(true);
  setError("");

  try {
    const res = await authService.forgotPassword(forgotData.email);

    addToast("success", res.message);

    setForgotStep(2);
  } catch (err: any) {
    setError(err.response?.data?.message || "Failed to send OTP");
  } finally {
    setLoading(false);
  }
};
const handleOtpChange = (
  value: string,
  index: number
) => {
  if (!/^\d?$/.test(value)) return;

  const newOtp = [...otpInputs];
  newOtp[index] = value;

  setOtpInputs(newOtp);

  setForgotData({
    ...forgotData,
    otp: newOtp.join("")
  });

  if (value && index < 5) {
    const next = document.getElementById(`otp-${index + 1}`);
    (next as HTMLInputElement)?.focus();
  }
};

const handleOtpKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>,
  index: number
) => {
  if (
    e.key === "Backspace" &&
    !otpInputs[index] &&
    index > 0
  ) {
    const prev = document.getElementById(`otp-${index - 1}`);
    (prev as HTMLInputElement)?.focus();
  }
};


const handleVerifyOtp = async () => {
  setLoading(true);
  setError("");

  try {
    const res = await authService.verifyOtp(
      forgotData.email,
      forgotData.otp
    );

    addToast("success", res.message);

    setForgotStep(3);
  } catch (err: any) {
    setError(err.response?.data?.message || "Invalid OTP");
  } finally {
    setLoading(false);
  }
};

const handleResetPassword = async () => {
  if (forgotData.newPassword !== forgotData.confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  setLoading(true);

  try {
    const res = await authService.resetPassword(
      forgotData.email,
      forgotData.otp,
      forgotData.newPassword
    );

    addToast("success", res.message);

    setForgotStep(1);

    setForgotData({
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });

    setAuthMode("login");
  } catch (err: any) {
    setError(err.response?.data?.message || "Password reset failed");
  } finally {
    setLoading(false);
  }
};

  const selectQuickAccount = (email: string) => {
    setError('');
    setAuthForm({ ...authForm, email, password: 'password' });
    addToast('info', `Credential filled for ${email}`);
  };

  const isSetup = authMode === 'setup' || setupRequired;

  // Shared input classes — flat boxed style with room for a leading icon
  const fieldClass =
    "w-full bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl pl-11 pr-4 py-3.5 text-sm text-txt-primary placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-350 relative overflow-hidden">

      {/* Ambient background accents */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-violet-300/10 blur-3xl" />

      <div className="max-w-md md:max-w-4xl min-h-fit md:min-h-[600px] w-full bg-card/95 backdrop-blur-xl rounded-2xl md:rounded-[2rem] shadow-2xl shadow-indigo-950/10 border border-border-crm overflow-hidden text-txt-primary transition-colors duration-350 grid grid-cols-1 md:grid-cols-2 relative">

        {/* LEFT: form panel */}
        <div className="relative flex flex-col p-6 sm:p-8 md:p-10 overflow-hidden">

  
          <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/[0.06] blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 -left-16 w-56 h-56 rounded-full bg-blue-500/[0.05] blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

          <div className="flex items-center justify-between gap-3 mb-6 relative">
         <div className="flex items-center gap-4">

    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-lg shadow-indigo-600/30 flex items-center justify-center ring-1 ring-white/20">

        <span className="text-white font-black text-2xl tracking-tight">
            C
        </span>

    </div>

    <div>

        <h2 className="text-3xl font-black text-slate-900 dark:text-gray-300 tracking-tight">
            CRM 360
        </h2>

        <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">
            Sales Intelligence Platform
        </p>

    </div>

</div>
          </div>

          {/* form content is vertically centered so the panel reads balanced, not top-heavy */}
          <div className="flex-1 flex flex-col justify-center relative">

          {/* Header tabs - only show if first-run setup is NOT active */}
          {!isSetup ? (
            authMode !== 'forgotPassword' && (
              <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
Welcome Back
</h1>

<p className="text-sm text-slate-500 mt-2 leading-relaxed">
Sign in to continue managing your leads,
sales pipeline and customer relationships.
</p>
              </div>
            )
          ) : (
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-amber-600 bg-amber-500/10 ring-1 ring-amber-500/20 rounded-full px-3 py-1.5">
                ⚙️ DATABASE INITIAL SETUP
              </span>
              <p className="text-txt-secondary text-xs mt-2">Enterprise Organization &amp; Super Admin Setup</p>
            </div>
          )}

          {/* Validation Alert Box */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl text-xs font-semibold mb-4 leading-relaxed transition-all animate-in fade-in slide-in-from-top-1">
              ⚠️ {error}
            </div>
          )}

          {isSetup ? (
            /* First time setup registration form */
            <form onSubmit={handleLocalSetupSubmit} className="space-y-4">
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text" required
                  className={fieldClass}
                  placeholder="Company name"
                  value={setupData.companyName}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, companyName: e.target.value });
                  }}
                />
              </div>

              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email" required
                  className={fieldClass}
                  placeholder="Company email"
                  value={setupData.companyEmail}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, companyEmail: e.target.value });
                  }}
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs font-bold text-txt-secondary tracking-wide">SUPER ADMIN CREDENTIALS</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text" required
                  className={fieldClass}
                  placeholder="Super admin name"
                  value={setupData.name}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, name: e.target.value });
                  }}
                />
              </div>

              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email" required
                  className={fieldClass}
                  placeholder="Super admin email"
                  value={setupData.email}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, email: e.target.value });
                  }}
                />
              </div>

              <div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showSetupPassword ? "text" : "password"} required
                    className={`${fieldClass} pr-10`}
                    placeholder="Password"
                    value={setupData.password}
                    onChange={e => {
                      setError('');
                      setSetupData({ ...setupData, password: e.target.value });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(!showSetupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showSetupConfirmPassword ? "text" : "password"} required
                    className={`${fieldClass} pr-10`}
                    placeholder="Confirm password"
                    value={setupData.confirmPassword}
                    onChange={e => {
                      setError('');
                      setSetupData({ ...setupData, confirmPassword: e.target.value });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupConfirmPassword(!showSetupConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showSetupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-3.5 text-sm font-bold transition-all mt-4 cursor-pointer shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Initializing organization...' : (
                  <>
                    Initialize CRM Organization
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : authMode === "forgotPassword" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();

                if (forgotStep === 1) {
                  handleForgotPassword();
                } else if (forgotStep === 2) {
                  handleVerifyOtp();
                } else {
                  handleResetPassword();
                }
              }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-extrabold text-txt-primary tracking-tight">
                  {forgotStep === 1
                    ? "Forgot password"
                    : forgotStep === 2
                    ? "Verify OTP"
                    : "Reset password"}
                </h2>
              </div>

              {forgotStep === 1 && (
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    className={fieldClass}
                    placeholder="Enter your email"
                    value={forgotData.email}
                    onChange={(e) =>
                      setForgotData({
                        ...forgotData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {forgotStep === 1 && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-3.5 text-sm font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              )}

              {forgotStep === 2 && (
                <div>
                  <label className="block text-xs font-bold text-txt-secondary mb-3 tracking-wide">
                    Enter OTP
                  </label>

                  <div className="flex justify-between gap-2">
                    {otpInputs.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handleOtpChange(e.target.value, index)
                        }
                        onKeyDown={(e) =>
                          handleOtpKeyDown(e, index)
                        }
                        className="w-12 h-12 text-center text-lg font-bold bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                    ))}
                  </div>
                </div>
              )}

              {forgotStep === 2 && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-3.5 text-sm font-bold transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              )}

              {forgotStep === 3 && (
                <>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      placeholder="New password"
                      className={fieldClass}
                      value={forgotData.newPassword}
                      onChange={(e) =>
                        setForgotData({
                          ...forgotData,
                          newPassword: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className={fieldClass}
                      value={forgotData.confirmPassword}
                      onChange={(e) =>
                        setForgotData({
                          ...forgotData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {forgotStep === 3 && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-3.5 text-sm font-bold transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset password"}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setForgotStep(1);
                  setError("");
                }}
                className="w-full text-indigo-600 hover:underline text-sm font-semibold pt-2"
              >
                ← Back to sign in
              </button>
            </form>

          ) : (
            /* Normal Login Form */
            <form onSubmit={handleLocalLoginSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email" required
                  className={fieldClass}
                  placeholder="Email address"
                  value={authForm.email}
                  onChange={e => {
                    setError('');
                    setAuthForm({ ...authForm, email: e.target.value });
                  }}
                />
              </div>

              <div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"} required
                    className={`${fieldClass} pr-10`}
                    placeholder="Password"
                    value={authForm.password}
                    onChange={e => {
                      setError('');
                      setAuthForm({ ...authForm, password: e.target.value });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer animate-in fade-in"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-3.5 text-sm font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setForgotStep(1);
                    setAuthMode("forgotPassword");
                  }}
                  className="text-indigo-600 hover:underline font-semibold bg-transparent border-0 cursor-pointer p-0 focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}
          </div>

          {/* trust strip — grounds the panel instead of leaving dead space below the form */}
          <div className="relative mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-6 text-slate-400">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
            </div>
          </div>
        </div>

        {/* RIGHT: illustration / value-prop panel (hidden on small screens, like the reference) */}
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-slate-900 dark:to-slate-800 p-6 lg:p-8 text-center relative overflow-hidden">

         {/* subtle decorative grid + glow behind the preview card */}
         <div className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:radial-gradient(circle,theme(colors.indigo.300)_1px,transparent_1px)] [background-size:24px_24px]" />
         <div className="pointer-events-none absolute top-10 right-10 w-40 h-40 rounded-full bg-indigo-400/20 blur-3xl" />

         <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-white shadow-2xl shadow-indigo-950/10 border border-slate-200/70 mb-6 ring-1 ring-black/5">

    {/* Floating Icons */}
    <div className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40 ring-4 ring-white/40">
        <ShieldCheck className="w-4 h-4" />
    </div>

    <div className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40 ring-4 ring-white/40">
        <ScanFace className="w-4 h-4" />
    </div>

    <div className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40 ring-4 ring-white/40">
        <Fingerprint className="w-4 h-4" />
    </div>

 <Image
    src={demoImages[currentImage]}
    alt="CRM Preview"
    width={600}
    height={340}
    className="w-full h-[280px] lg:h-[320px] object-cover transition-opacity duration-500"
/>
</div>

          <h3 className="text-base font-extrabold text-txt-primary mb-2 tracking-tight">Built for enterprise sales teams</h3>
          <p className="text-xs text-txt-secondary max-w-xs leading-relaxed">
            One secure workspace for your pipeline, contacts, and reporting — sign in to pick up right where you left off.
          </p>

          <div className="flex items-center gap-1.5 mt-4">
            {demoImages.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentImage ? "w-6 bg-indigo-600" : "w-1.5 bg-indigo-200"
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
