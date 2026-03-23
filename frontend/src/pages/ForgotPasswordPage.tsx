import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import { AxiosError } from "axios";
import { ApiError } from "@/types";
import api from "@/utils/api";

type Step = "verify" | "reset" | "done";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>("verify");
  const [phone, setPhone] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleVerifyAndReset = async (e: FormEvent) => {
    e.preventDefault();

    if (step === "verify") {
      // Just move to reset step — actual verification happens on submit
      if (!phone || phone.length < 10 || !flatNumber) return;
      setStep("reset");
      return;
    }

    // step === 'reset'
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", {
        phone,
        flatNumber,
        newPassword,
      });
      setStep("done");
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const msg = error.response?.data?.error || "Reset failed";
      showToast(msg, "error");
      // If verification failed, go back to verify step
      if (error.response?.status === 404) setStep("verify");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-[14px] px-4 py-3.5 text-[var(--text)] outline-none transition-all duration-200 font-['Open_Sans'] placeholder:text-[var(--text3)] focus:border-[var(--accent)]";
  const inputStyle = {
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    fontFamily: "Open Sans, sans-serif",
  };
  const labelCls =
    "block text-[11px] font-semibold text-[var(--text2)] uppercase tracking-[0.06em] mb-2";

  if (step === "done") {
    return (
      <div
        className="min-h-dvh flex items-center justify-center px-6 py-8"
        style={{ background: "var(--bg)" }}
      >
        <div className="w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1
            className="font-[Syne] text-2xl font-bold mb-2"
            style={{ color: "var(--text)" }}
          >
            Password reset!
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text2)" }}>
            Your password has been updated successfully. Sign in with your new
            password.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-[14px] py-4 font-[Syne] text-sm font-bold transition-all hover:-translate-y-0.5"
            style={{
              background: "var(--accent)",
              color: "#0D1117",
              boxShadow: "0 4px 20px rgba(0,229,160,0.3)",
            }}
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-6 py-8"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{step === "verify" ? "🔐" : "🔑"}</div>
          <h1
            className="font-[Syne] text-2xl font-bold mb-2"
            style={{ color: "var(--text)" }}
          >
            {step === "verify" ? "Forgot password?" : "Set new password"}
          </h1>
          <p className="text-sm" style={{ color: "var(--text2)" }}>
            {step === "verify"
              ? "Enter your registered phone and villa number to verify your identity"
              : "Choose a strong password for your account"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(["verify", "reset"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-[Syne] flex-shrink-0 transition-all duration-300"
                style={{
                  background:
                    step === s
                      ? "var(--accent)"
                      : s === "verify" && step === "reset"
                        ? "rgba(0,229,160,0.2)"
                        : "var(--bg3)",
                  color:
                    step === s
                      ? "#0D1117"
                      : s === "verify" && step === "reset"
                        ? "var(--accent)"
                        : "var(--text3)",
                  border: `1px solid ${step === s ? "var(--accent)" : s === "verify" && step === "reset" ? "rgba(0,229,160,0.4)" : "var(--border)"}`,
                }}
              >
                {s === "verify" && step === "reset" ? "✓" : i + 1}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: step === s ? "var(--text)" : "var(--text3)" }}
              >
                {s === "verify" ? "Verify identity" : "New password"}
              </span>
              {i === 0 && (
                <div
                  className="flex-1 h-px"
                  style={{
                    background:
                      step === "reset" ? "var(--accent)" : "var(--border)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleVerifyAndReset} className="flex flex-col gap-4">
          {step === "verify" && (
            <>
              <div>
                <label className={labelCls}>Phone number</label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  maxLength={10}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className={labelCls}>Villa number</label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  placeholder="e.g. 12"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  required
                />
                <p
                  className="text-[11px] mt-1.5"
                  style={{ color: "var(--text3)" }}
                >
                  Both must match your registered account
                </p>
              </div>
            </>
          )}

          {step === "reset" && (
            <>
              {/* Show verified info */}
              <div
                className="rounded-[14px] px-4 py-3 flex items-center gap-3"
                style={{
                  background: "rgba(0,229,160,0.08)",
                  border: "1px solid rgba(0,229,160,0.2)",
                }}
              >
                <span>✅</span>
                <div>
                  <div
                    className="text-xs font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    Identity verified
                  </div>
                  <div
                    className="text-[11px]"
                    style={{ color: "var(--text2)" }}
                  >
                    Phone {phone.slice(0, 5)}·····{phone.slice(-2)} · Villa{" "}
                    {flatNumber}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("verify")}
                  className="ml-auto text-[11px] font-semibold"
                  style={{ color: "var(--text3)" }}
                >
                  Change
                </button>
              </div>

              <div>
                <label className={labelCls}>New password</label>
                <div className="relative">
                  <input
                    className={inputCls}
                    style={{ ...inputStyle, paddingRight: 48 }}
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: "var(--text3)" }}
                  >
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>Confirm new password</label>
                <input
                  className={inputCls}
                  style={{
                    ...inputStyle,
                    borderColor:
                      confirmPassword && confirmPassword !== newPassword
                        ? "var(--danger)"
                        : confirmPassword && confirmPassword === newPassword
                          ? "var(--accent)"
                          : "var(--border)",
                  }}
                  type={showPass ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p
                    className="text-[11px] mt-1.5"
                    style={{ color: "var(--danger)" }}
                  >
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Password strength indicator */}
              {newPassword.length > 0 && (
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background:
                            newPassword.length >= i * 3
                              ? i <= 1
                                ? "var(--danger)"
                                : i <= 2
                                  ? "var(--warn)"
                                  : i <= 3
                                    ? "var(--accent2)"
                                    : "var(--accent)"
                              : "var(--bg4)",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text3)" }}>
                    {newPassword.length < 6
                      ? "Too short"
                      : newPassword.length < 9
                        ? "Weak"
                        : newPassword.length < 12
                          ? "Good"
                          : "Strong"}
                  </p>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              (step === "verify" && (phone.length < 10 || !flatNumber)) ||
              (step === "reset" &&
                (newPassword.length < 6 || newPassword !== confirmPassword))
            }
            className="w-full rounded-[14px] py-4 font-[Syne] text-sm font-bold transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:translate-y-0"
            style={{
              background: "var(--accent)",
              color: "#0D1117",
              opacity:
                loading ||
                (step === "verify" && (phone.length < 10 || !flatNumber)) ||
                (step === "reset" &&
                  (newPassword.length < 6 || newPassword !== confirmPassword))
                  ? 0.4
                  : 1,
              boxShadow: "0 4px 20px rgba(0,229,160,0.25)",
            }}
          >
            {loading ? (
              <span className="spinner w-5 h-5" />
            ) : step === "verify" ? (
              "Continue →"
            ) : (
              "Reset password"
            )}
          </button>
        </form>

        <p
          className="text-center text-sm mt-6"
          style={{ color: "var(--text2)" }}
        >
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-semibold"
            style={{ color: "var(--accent)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
