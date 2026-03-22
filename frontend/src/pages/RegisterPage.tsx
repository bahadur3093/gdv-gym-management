import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import { AxiosError } from "axios";
import { ApiError, RegisterPayload } from "@/types";
import api from "@/utils/api";

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterPayload>({
    name: "",
    phone: "",
    flatNumber: "",
    tower: "GDV",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const set =
    (k: keyof RegisterPayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      setDone(true);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      showToast(error.response?.data?.error || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (done)
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--bg)] px-6 py-6">
        <div className="w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="font-['Open Sans'] text-[28px] font-extrabold text-[var(--text)] mb-1">
            Request submitted!
          </h2>
          <p className="text-[14px] text-[var(--text2)] mb-8">
            The admin will approve your account shortly.
          </p>
          <button
            className="w-full rounded-[10px] bg-[var(--accent)] text-[#0D1117] border-0 px-5 py-3 font-['Open Sans'] text-[15px] font-bold tracking-[0.02em] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(0,229,160,0.35)] hover:-translate-y-[1px]"
            onClick={() => navigate("/login")}
          >
            Back to login
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--bg)] py-6">
      <div className="w-full px-6">
        <div className="text-center text-[48px] mb-3">🏋️</div>
        <h1 className="font-['Open Sans'] text-[28px] font-extrabold text-center text-[var(--text)] mb-1">
          Join the gym
        </h1>
        <p className="text-[14px] text-[var(--text2)] text-center mb-8">
          Register as a society member
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text2)] uppercase tracking-[0.06em] mb-2">
              Full name
            </label>
            <input
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-[var(--text)] outline-none transition-all duration-200 font-['Open Sans'] placeholder:text-[var(--text3)] focus:border-[var(--accent)]"
              placeholder="Rajan Sharma"
              value={form.name}
              onChange={set("name")}
              required
            />
          </div>

          <div className="grid grid-cols-[1fr_30%] gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text2)] uppercase tracking-[0.06em] mb-2">
                Phone number
              </label>
              <input
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-[var(--text)] outline-none transition-all duration-200 font-['Open Sans'] placeholder:text-[var(--text3)] focus:border-[var(--accent)]"
                type="tel"
                placeholder="98765 43210"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    phone: e.target.value.replace(/\D/g, ""),
                  }))
                }
                maxLength={10}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text2)] uppercase tracking-[0.06em] mb-2">
                Villa number
              </label>
              <input
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-[var(--text)] outline-none transition-all duration-200 font-['Open Sans'] placeholder:text-[var(--text3)] focus:border-[var(--accent)]"
                placeholder="12"
                value={form.flatNumber}
                onChange={set("flatNumber")}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text2)] uppercase tracking-[0.06em] mb-2">
              Password
            </label>
            <input
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-[var(--text)] outline-none transition-all duration-200 font-['Open Sans'] placeholder:text-[var(--text3)] focus:border-[var(--accent)]"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={set("password")}
              minLength={6}
              required
            />
          </div>

          <button
            className="w-full rounded-[10px] bg-[var(--accent)] text-[#0D1117] border-none px-5 py-3 font-['Open Sans'] text-[15px] font-bold flex items-center justify-center gap-2 transition-all duration-200 tracking-[0.02em] hover:shadow-[0_6px_20px_rgba(0,229,160,0.35)] hover:-translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed"
            type="submit"
            disabled={
              loading ||
              !form.name ||
              form.phone.length < 10 ||
              !form.flatNumber ||
              !form.password
            }
          >
            {loading ? (
              <span className="h-5 w-5 rounded-full border-4 border-white border-t-transparent animate-spin" />
            ) : (
              "Submit registration"
            )}
          </button>
        </form>

        <p className="text-center text-[13px] text-[var(--text2)] mt-6">
          Already registered?{" "}
          <Link className="text-[var(--accent)] font-semibold" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
