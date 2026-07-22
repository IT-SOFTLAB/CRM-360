import React, { useState } from 'react';
import { authService } from "../../services/auth.service";
import { Eye, EyeOff } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 transition-colors duration-350">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-2xl border border-border-crm overflow-hidden text-txt-primary transition-colors duration-350">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">CRM 360</h1>
          <p className="text-blue-100 mt-2 text-sm font-semibold">
            {isSetup 
              ? 'Enterprise Organization & Super Admin Setup'
              : 'Unified Platform for High-Performance Enterprise Sales'
            }
          </p>
        </div>

        <div className="p-8">
          {/* Header tabs - only show if first-run setup is NOT active */}
          {!isSetup ? (
            <div className="flex border-b border-border-crm mb-6">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setAuthMode('login');
                }}
                className={`flex-1 pb-3 font-bold text-sm transition-colors ${authMode === 'login' ? 'text-primary border-b-2 border-primary' : 'text-txt-secondary'}`}
              >
                Sign In
              </button>
            </div>
          ) : (
            <div className="flex border-b border-border-crm mb-6 justify-center">
              <span className="pb-3 font-extrabold text-sm text-amber-500 border-b-2 border-amber-500">
                ⚙️ DATABASE INITIAL SETUP
              </span>
            </div>
          )}

          {/* Validation Alert Box */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl text-xs font-semibold mb-4 leading-relaxed transition-all">
              ⚠️ {error}
            </div>
          )}

          {isSetup ? (
            /* First time setup registration form */
            <form onSubmit={handleLocalSetupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Company Name</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                  placeholder="e.g. Acme Corporation"
                  value={setupData.companyName}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, companyName: e.target.value });
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Company Email</label>
                <input
                  type="email" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                  placeholder="e.g. contact@acme.com"
                  value={setupData.companyEmail}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, companyEmail: e.target.value });
                  }}
                />
              </div>

              <div className="border-t border-border-crm my-4 pt-4">
                <span className="text-xs font-bold text-txt-secondary block mb-2">SUPER ADMIN CREDENTIALS</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Super Admin Name</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                  placeholder="e.g. Administrator"
                  value={setupData.name}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, name: e.target.value });
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Super Admin Email</label>
                <input
                  type="email" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                  placeholder="e.g. admin@acme.com"
                  value={setupData.email}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, email: e.target.value });
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showSetupPassword ? "text" : "password"} required
                    className="w-full border border-border-crm rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                    placeholder="••••••••"
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
                <label className="block text-xs font-bold text-txt-secondary mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showSetupConfirmPassword ? "text" : "password"} required
                    className="w-full border border-border-crm rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                    placeholder="••••••••"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition mt-6 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Initializing organization...' : 'Initialize CRM Organization'}
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

  <h2 className="text-xl font-bold text-center">
  {forgotStep === 1
    ? "Forgot Password"
    : forgotStep === 2
    ? "Verify OTP"
    : "Reset Password"}
</h2>

{forgotStep === 1 && (
  <div>
    <label className="block text-xs font-bold text-txt-secondary mb-1">
      Email Address
    </label>

    <input
      type="email"
      required
      className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
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
    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition cursor-pointer disabled:opacity-50"
  >
    {loading ? "Sending OTP..." : "Send OTP"}
  </button>
)}

{forgotStep === 2 && (
 <div>
  <label className="block text-xs font-bold text-txt-secondary mb-3">
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
        className="w-12 h-12 text-center text-lg font-bold border border-border-crm rounded-xl focus:outline-none focus:border-primary bg-bg-main"
      />
    ))}
  </div>
</div>
)}

{forgotStep === 2 && (
  <button
    type="submit"
    disabled={loading}
    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50"
  >
    {loading ? "Verifying..." : "Verify OTP"}
  </button>
)}

{forgotStep === 3 && (
  <>
    <div>
      <label className="block text-xs font-bold text-txt-secondary mb-1">
        New Password
      </label>

      <input
        type="password"
        placeholder="Enter new password"
        className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
        value={forgotData.newPassword}
        onChange={(e) =>
          setForgotData({
            ...forgotData,
            newPassword: e.target.value,
          })
        }
      />
    </div>

    <div>
      <label className="block text-xs font-bold text-txt-secondary mb-1">
        Confirm Password
      </label>

      <input
        type="password"
        placeholder="Confirm new password"
        className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
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
    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50"
  >
    {loading ? "Resetting..." : "Reset Password"}
  </button>
)}

<button
  type="button"
  onClick={() => {
    setAuthMode("login");
    setForgotStep(1);
    setError("");
  }}
  className="w-full text-primary hover:underline text-sm font-semibold"
>
  ← Back to Login
</button>
</form>

           ) : (
            /* Normal Login Form */
            <form onSubmit={handleLocalLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Email Address</label>
                <input
                  type="email" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                  placeholder="name@company.com"
                  value={authForm.email}
                  onChange={e => {
                    setError('');
                    setAuthForm({ ...authForm, email: e.target.value });
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} required
                    className="w-full border border-border-crm rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                    placeholder="••••••••"
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

              <div className="flex items-center justify-between text-xs mt-2">
                <button
                  type="button"
                onClick={() => {
    setError("");
    setForgotStep(1);
    setAuthMode("forgotPassword");
}}
                  className="text-primary hover:underline font-semibold bg-transparent border-0 cursor-pointer p-0 focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition mt-6 cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In to Dashboard'}
              </button>
            </form>
          )}


        </div>
      </div>
    </div>
  );
}
