import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import api from "@/utils/api";

type Tab = "members" | "checkins" | "payments";

interface MemberRow {
  id: string;
  name: string;
  phone: string;
  flat_number: string;
  tower?: string;
  role: string;
  status: string;
  current_streak: number;
  created_at: string;
}
interface CheckinRow {
  date: string;
  checked_in_at: string;
  checked_out_at?: string;
  duration_mins?: number;
  auto_checkout: boolean;
  members: { name: string; flat_number: string };
}
interface PaymentRow {
  id: string;
  month: string;
  amount: number;
  status: string;
  is_partial: boolean;
  reason?: string;
  utr_number: string;
  submitted_at: string;
  members: { name: string; flat_number: string };
}
interface PaymentStats {
  totalCollected: number;
  totalTransactions: number;
  byMonth: [string, number][];
  byYear: [string, number][];
  byMember: {
    name: string;
    flat_number: string;
    total: number;
    months: number;
  }[];
}

const LIMIT = 30;

function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map((r) =>
      keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

export default function AdminLogsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("members");

  if (user?.role !== "admin") {
    navigate("/", { replace: true });
    return null;
  }

  // ── Members tab ──────────────────────────────────────────
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatus, setMemberStatus] = useState("");
  const [membersLoading, setMembersLoading] = useState(false);

  const loadMembers = useCallback(() => {
    setMembersLoading(true);
    const p = new URLSearchParams();
    if (memberSearch) p.set("search", memberSearch);
    if (memberStatus) p.set("status", memberStatus);
    api
      .get<MemberRow[]>(`/logs/members?${p}`)
      .then((r) => setMembers(r.data))
      .finally(() => setMembersLoading(false));
  }, [memberSearch, memberStatus]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (tab === "members") loadMembers();
  }, [tab, loadMembers]);

  // ── Checkins tab ─────────────────────────────────────────
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [checkinTotal, setCheckinTotal] = useState(0);
  const [checkinSearch, setCheckinSearch] = useState("");
  const [checkinFrom, setCheckinFrom] = useState("");
  const [checkinTo, setCheckinTo] = useState("");
  const [checkinPage, setCheckinPage] = useState(0);
  const [checkinsLoading, setCheckinsLoading] = useState(false);

  const loadCheckins = useCallback(() => {
    setCheckinsLoading(true);
    const p = new URLSearchParams({
      limit: String(LIMIT),
      offset: String(checkinPage * LIMIT),
    });
    if (checkinSearch) p.set("search", checkinSearch);
    if (checkinFrom) p.set("from", checkinFrom);
    if (checkinTo) p.set("to", checkinTo);
    api
      .get<{ total: number; records: CheckinRow[] }>(`/logs/checkins?${p}`)
      .then((r) => {
        setCheckins(r.data.records);
        setCheckinTotal(r.data.total);
      })
      .finally(() => setCheckinsLoading(false));
  }, [checkinSearch, checkinFrom, checkinTo, checkinPage]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (tab === "checkins") loadCheckins();
  }, [tab, loadCheckins]);

  // ── Payments tab ─────────────────────────────────────────
  const [payRecords, setPayRecords] = useState<PaymentRow[]>([]);
  const [payStats, setPayStats] = useState<PaymentStats | null>(null);
  const [paySearch, setPaySearch] = useState("");
  const [payFrom, setPayFrom] = useState("");
  const [payTo, setPayTo] = useState("");
  const [payStatus, setPayStatus] = useState("approved");
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [payView, setPayView] = useState<"stats" | "records">("stats");

  const loadPayments = useCallback(() => {
    setPaymentsLoading(true);
    const p = new URLSearchParams();
    if (paySearch) p.set("search", paySearch);
    if (payFrom) p.set("from", payFrom);
    if (payTo) p.set("to", payTo);
    if (payStatus) p.set("status", payStatus);
    api
      .get<{ records: PaymentRow[]; stats: PaymentStats }>(
        `/logs/payments?${p}`,
      )
      .then((r) => {
        setPayRecords(r.data.records);
        setPayStats(r.data.stats);
      })
      .finally(() => setPaymentsLoading(false));
  }, [paySearch, payFrom, payTo, payStatus]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (tab === "payments") loadPayments();
  }, [tab, loadPayments]);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const fmtDuration = (m?: number) => {
    if (!m) return "—";
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  };
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const fmtTime = (s: string) =>
    new Date(s).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const fmtMonth = (m: string) =>
    new Date(m + "-02").toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });

  const inputCls = "w-full rounded-xl px-3 py-2 text-sm outline-none";
  const inputStyle = {
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  const TABS: { val: Tab; label: string }[] = [
    { val: "members", label: "Members" },
    { val: "checkins", label: "Check-ins" },
    { val: "payments", label: "Payments" },
  ];

  return (
    <div className="min-h-dvh pb-28">
      <div className="px-6 mx-auto">
        <PageHeader greeting="Admin" title="Logs" />

        {/* Tabs */}
        <div className="flex gap-2 pb-4 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.val}
              onClick={() => setTab(t.val)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: tab === t.val ? "var(--text)" : "var(--bg2)",
                color: tab === t.val ? "var(--bg)" : "var(--text2)",
                border: `1px solid ${tab === t.val ? "var(--text)" : "var(--border)"}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── MEMBERS TAB ── */}
        {tab === "members" && (
          <div>
            <div className="flex gap-2 mb-3">
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Search by name…"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
              <select
                className={inputCls}
                style={{ ...inputStyle, width: "auto", flexShrink: 0 }}
                value={memberStatus}
                onChange={(e) => setMemberStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button
              onClick={() =>
                exportCSV(
                  members.map((m) => ({
                    Name: m.name,
                    Phone: m.phone,
                    Villa: m.flat_number,
                    Zone: m.tower || "",
                    Role: m.role,
                    Status: m.status,
                    Streak: m.current_streak,
                    Joined: fmtDate(m.created_at),
                  })),
                  "members.csv",
                )
              }
              className="w-full rounded-xl py-2.5 mb-3 text-sm font-semibold transition-all"
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                color: "var(--text2)",
              }}
            >
              ↓ Export CSV
            </button>
            <div
              className="rounded-[20px] overflow-hidden mb-4"
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
              }}
            >
              {membersLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="skeleton h-14 mx-4 my-2 rounded-xl"
                    />
                  ))
              ) : members.length === 0 ? (
                <div
                  className="p-7 text-center text-sm"
                  style={{ color: "var(--text2)" }}
                >
                  No members found
                </div>
              ) : (
                members.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom:
                        i < members.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0"
                      style={{
                        background: "var(--bg3)",
                        color: "var(--accent)",
                      }}
                    >
                      {m.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {m.name}
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: "var(--text2)" }}
                      >
                        Villa {m.flat_number}
                        {m.tower ? ` · Zone ${m.tower}` : ""} · {m.phone}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            m.status === "active"
                              ? "rgba(0,229,160,0.12)"
                              : m.status === "pending"
                                ? "rgba(255,181,71,0.12)"
                                : "rgba(255,92,92,0.1)",
                          color:
                            m.status === "active"
                              ? "var(--accent)"
                              : m.status === "pending"
                                ? "var(--warn)"
                                : "var(--danger)",
                        }}
                      >
                        {m.status}
                      </span>
                      <div
                        className="text-[11px] mt-0.5"
                        style={{ color: "var(--text3)" }}
                      >
                        🔥 {m.current_streak}d
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div
              className="text-center text-xs pb-2"
              style={{ color: "var(--text3)" }}
            >
              {members.length} members
            </div>
          </div>
        )}

        {/* ── CHECKINS TAB ── */}
        {tab === "checkins" && (
          <div>
            <div className="flex flex-col gap-2 mb-3">
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Search by name…"
                value={checkinSearch}
                onChange={(e) => {
                  setCheckinSearch(e.target.value);
                  setCheckinPage(0);
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider mb-1"
                    style={{ color: "var(--text3)" }}
                  >
                    From
                  </label>
                  <input
                    type="date"
                    className={inputCls}
                    style={inputStyle}
                    value={checkinFrom}
                    onChange={(e) => {
                      setCheckinFrom(e.target.value);
                      setCheckinPage(0);
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider mb-1"
                    style={{ color: "var(--text3)" }}
                  >
                    To
                  </label>
                  <input
                    type="date"
                    className={inputCls}
                    style={inputStyle}
                    value={checkinTo}
                    onChange={(e) => {
                      setCheckinTo(e.target.value);
                      setCheckinPage(0);
                    }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                exportCSV(
                  checkins.map((c) => ({
                    Name: c.members.name,
                    Villa: c.members.flat_number,
                    Date: c.date,
                    "Check In": fmtTime(c.checked_in_at),
                    "Check Out": c.checked_out_at
                      ? fmtTime(c.checked_out_at)
                      : "",
                    Duration: fmtDuration(c.duration_mins),
                    Auto: c.auto_checkout ? "Yes" : "No",
                  })),
                  "checkins.csv",
                )
              }
              className="w-full rounded-xl py-2.5 mb-3 text-sm font-semibold transition-all"
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                color: "var(--text2)",
              }}
            >
              ↓ Export CSV
            </button>
            <div
              className="rounded-[20px] overflow-hidden mb-3"
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
              }}
            >
              {checkinsLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="skeleton h-14 mx-4 my-2 rounded-xl"
                    />
                  ))
              ) : checkins.length === 0 ? (
                <div
                  className="p-7 text-center text-sm"
                  style={{ color: "var(--text2)" }}
                >
                  No check-ins found
                </div>
              ) : (
                checkins.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom:
                        i < checkins.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0"
                      style={{
                        background: "var(--bg3)",
                        color: "var(--accent)",
                      }}
                    >
                      {c.members.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {c.members.name}
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: "var(--text2)" }}
                      >
                        Villa {c.members.flat_number} ·{" "}
                        {fmtDate(c.checked_in_at)}
                      </div>
                    </div>
                    <div className="text-right text-xs flex-shrink-0">
                      <div>
                        {fmtTime(c.checked_in_at)}
                        {c.checked_out_at
                          ? ` – ${fmtTime(c.checked_out_at)}`
                          : ""}
                      </div>
                      <div
                        style={{
                          color: c.auto_checkout
                            ? "var(--warn)"
                            : "var(--text3)",
                        }}
                      >
                        {fmtDuration(c.duration_mins)}
                        {c.auto_checkout ? " · auto" : ""}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {checkinTotal > LIMIT && (
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCheckinPage((p) => Math.max(0, p - 1))}
                  disabled={checkinPage === 0}
                  className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30"
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  ← Prev
                </button>
                <span className="text-xs" style={{ color: "var(--text2)" }}>
                  {checkinPage * LIMIT + 1}–
                  {Math.min((checkinPage + 1) * LIMIT, checkinTotal)} of{" "}
                  {checkinTotal}
                </span>
                <button
                  onClick={() => setCheckinPage((p) => p + 1)}
                  disabled={(checkinPage + 1) * LIMIT >= checkinTotal}
                  className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30"
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PAYMENTS TAB ── */}
        {tab === "payments" && (
          <div>
            <div className="flex flex-col gap-2 mb-3">
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Search by name…"
                value={paySearch}
                onChange={(e) => setPaySearch(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider mb-1"
                    style={{ color: "var(--text3)" }}
                  >
                    From month
                  </label>
                  <input
                    type="month"
                    className={inputCls}
                    style={inputStyle}
                    value={payFrom}
                    onChange={(e) => setPayFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    className="block text-[10px] uppercase tracking-wider mb-1"
                    style={{ color: "var(--text3)" }}
                  >
                    To month
                  </label>
                  <input
                    type="month"
                    className={inputCls}
                    style={inputStyle}
                    value={payTo}
                    onChange={(e) => setPayTo(e.target.value)}
                  />
                </div>
              </div>
              <select
                className={inputCls}
                style={inputStyle}
                value={payStatus}
                onChange={(e) => setPayStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* View toggle */}
            <div className="flex gap-2 mb-3">
              {(["stats", "records"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setPayView(v)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: payView === v ? "var(--text)" : "var(--bg2)",
                    color: payView === v ? "var(--bg)" : "var(--text2)",
                    border: `1px solid ${payView === v ? "var(--text)" : "var(--border)"}`,
                  }}
                >
                  {v === "stats" ? "📊 Summary" : "📋 Records"}
                </button>
              ))}
            </div>

            {paymentsLoading ? (
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-xl mb-2" />
                ))
            ) : payView === "stats" && payStats ? (
              <>
                {/* Total cards */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div
                    className="rounded-[16px] p-4"
                    style={{
                      background: "var(--bg2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="text-[11px] uppercase tracking-wider mb-1"
                      style={{ color: "var(--text2)" }}
                    >
                      Total collected
                    </div>
                    <div
                      className=" text-xl font-extrabold"
                      style={{ color: "var(--accent)" }}
                    >
                      {fmt(payStats.totalCollected)}
                    </div>
                  </div>
                  <div
                    className="rounded-[16px] p-4"
                    style={{
                      background: "var(--bg2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="text-[11px] uppercase tracking-wider mb-1"
                      style={{ color: "var(--text2)" }}
                    >
                      Transactions
                    </div>
                    <div
                      className=" text-xl font-extrabold"
                      style={{ color: "var(--accent2)" }}
                    >
                      {payStats.totalTransactions}
                    </div>
                  </div>
                </div>

                {/* By year */}
                {payStats.byYear.length > 0 && (
                  <>
                    <div
                      className=" text-sm font-bold mb-2"
                      style={{ color: "var(--text)" }}
                    >
                      By year
                    </div>
                    <div
                      className="rounded-[16px] overflow-hidden mb-4"
                      style={{
                        background: "var(--bg2)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {payStats.byYear.map(([year, total], i) => (
                        <div
                          key={year}
                          className="flex justify-between px-4 py-3"
                          style={{
                            borderBottom:
                              i < payStats.byYear.length - 1
                                ? "1px solid var(--border)"
                                : "none",
                          }}
                        >
                          <span className="text-sm font-semibold">{year}</span>
                          <span
                            className="font-bold text-sm"
                            style={{ color: "var(--accent)" }}
                          >
                            {fmt(total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* By month */}
                {payStats.byMonth.length > 0 && (
                  <>
                    <div
                      className=" text-sm font-bold mb-2"
                      style={{ color: "var(--text)" }}
                    >
                      By month
                    </div>
                    <div
                      className="rounded-[16px] overflow-hidden mb-4"
                      style={{
                        background: "var(--bg2)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {payStats.byMonth.map(([month, total], i) => (
                        <div
                          key={month}
                          className="flex justify-between px-4 py-3"
                          style={{
                            borderBottom:
                              i < payStats.byMonth.length - 1
                                ? "1px solid var(--border)"
                                : "none",
                          }}
                        >
                          <span className="text-sm">{fmtMonth(month)}</span>
                          <span
                            className="font-bold text-sm"
                            style={{ color: "var(--accent)" }}
                          >
                            {fmt(total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* By member */}
                {payStats.byMember.length > 0 && (
                  <>
                    <div
                      className=" text-sm font-bold mb-2"
                      style={{ color: "var(--text)" }}
                    >
                      By member
                    </div>
                    <div
                      className="rounded-[16px] overflow-hidden mb-4"
                      style={{
                        background: "var(--bg2)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {payStats.byMember.map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-3"
                          style={{
                            borderBottom:
                              i < payStats.byMember.length - 1
                                ? "1px solid var(--border)"
                                : "none",
                          }}
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium">{m.name}</div>
                            <div
                              className="text-[11px]"
                              style={{ color: "var(--text2)" }}
                            >
                              Villa {m.flat_number} · {m.months} month
                              {m.months !== 1 ? "s" : ""}
                            </div>
                          </div>
                          <span
                            className=" font-bold text-sm"
                            style={{ color: "var(--accent)" }}
                          >
                            {fmt(m.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : payView === "records" ? (
              <>
                <button
                  onClick={() =>
                    exportCSV(
                      payRecords.map((p) => ({
                        Name: p.members.name,
                        Villa: p.members.flat_number,
                        Month: p.month,
                        Amount: p.amount,
                        Status: p.status,
                        Partial: p.is_partial ? "Yes" : "No",
                        Reason: p.reason || "",
                        UTR: p.utr_number,
                        Submitted: fmtDate(p.submitted_at),
                      })),
                      "payments.csv",
                    )
                  }
                  className="w-full rounded-xl py-2.5 mb-3 text-sm font-semibold transition-all"
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                    color: "var(--text2)",
                  }}
                >
                  ↓ Export CSV
                </button>
                <div
                  className="rounded-[20px] overflow-hidden"
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {payRecords.length === 0 ? (
                    <div
                      className="p-7 text-center text-sm"
                      style={{ color: "var(--text2)" }}
                    >
                      No payments found
                    </div>
                  ) : (
                    payRecords.map((p, i) => (
                      <div
                        key={p.id}
                        className="px-4 py-3"
                        style={{
                          borderBottom:
                            i < payRecords.length - 1
                              ? "1px solid var(--border)"
                              : "none",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {p.members.name}
                            </div>
                            <div
                              className="text-[11px]"
                              style={{ color: "var(--text2)" }}
                            >
                              Villa {p.members.flat_number} ·{" "}
                              {fmtMonth(p.month)}
                              {p.is_partial && (
                                <span
                                  className="ml-1 font-semibold"
                                  style={{ color: "var(--warn)" }}
                                >
                                  · Partial
                                </span>
                              )}
                            </div>
                            {p.reason && (
                              <div
                                className="text-[11px] italic mt-0.5"
                                style={{ color: "var(--text3)" }}
                              >
                                "{p.reason}"
                              </div>
                            )}
                            <div
                              className="text-[11px] mt-0.5"
                              style={{
                                fontFamily: "monospace",
                                color: "var(--text3)",
                              }}
                            >
                              UTR: {p.utr_number}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div
                              className=" font-bold text-sm"
                              style={{ color: "var(--accent)" }}
                            >
                              ₹{p.amount}
                            </div>
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{
                                background:
                                  p.status === "approved"
                                    ? "rgba(0,229,160,0.12)"
                                    : p.status === "pending"
                                      ? "rgba(255,181,71,0.12)"
                                      : "rgba(255,92,92,0.1)",
                                color:
                                  p.status === "approved"
                                    ? "var(--accent)"
                                    : p.status === "pending"
                                      ? "var(--warn)"
                                      : "var(--danger)",
                              }}
                            >
                              {p.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
