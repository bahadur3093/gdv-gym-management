import { useState } from "react";
import { useDues, usePayments, useMemberSummary } from "@/hooks/usePayments";
import { useToast } from "@/context/ToastContext";
import { AxiosError } from "axios";
import { ApiError, DuesMonth } from "@/types";
import PageHeader from "@/components/PageHeader";
import BottomSheet from "@/components/BottomSheet";

export default function PaymentsPage() {
  const { data: duesData, loading: duesLoading, reload } = useDues();
  const { getUPILink, submitPayment } = usePayments();
  const { data: summary, loading: summaryLoading } = useMemberSummary();
  const { showToast } = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<DuesMonth | null>(null);
  const [utr, setUtr] = useState("");
  const [amount, setAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [upiLink, setUpiLink] = useState<string | null>(null);
  const [yearExpanded, setYearExpanded] = useState<string | null>(null);

  const openPaySheet = async (month: DuesMonth) => {
    setSelectedMonth(month);
    setAmount(String(month.remaining));
    setUseCustom(false);
    setReason("");
    setUtr("");
    try {
      const data = await getUPILink(month.month, month.remaining);
      setUpiLink(data.link);
    } catch {
      setUpiLink(null);
    }
    setSheetOpen(true);
  };

  const handleOpenUPI = () => {
    const payAmount = useCustom ? amount : String(selectedMonth?.remaining);
    const link = upiLink?.replace(/am=[^&]+/, `am=${payAmount}`) || upiLink;
    if (link) window.location.href = link;
    setTimeout(() => document.getElementById("utr-input")?.focus(), 1500);
  };

  const handleSubmit = async () => {
    if (utr.length !== 12 || !selectedMonth) return;
    const payAmount = useCustom ? parseFloat(amount) : selectedMonth.remaining;
    if (!payAmount || payAmount <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    if (useCustom && !reason.trim()) {
      showToast("Please add a reason for custom amount", "error");
      return;
    }
    setSubmitting(true);
    try {
      await submitPayment(
        utr,
        selectedMonth.month,
        payAmount,
        useCustom ? reason : undefined,
      );
      showToast("Payment submitted! Admin will verify soon.");
      setSheetOpen(false);
      setUtr("");
      reload();
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      showToast(error.response?.data?.error || "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const fmtMonth = (m: string) =>
    new Date(m + "-02").toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });

  const statusConfig = {
    paid: {
      bg: "rgba(0,229,160,0.1)",
      border: "rgba(0,229,160,0.25)",
      icon: "✅",
      label: "Paid",
      color: "var(--accent)",
    },
    partial: {
      bg: "rgba(255,181,71,0.1)",
      border: "rgba(255,181,71,0.3)",
      icon: "⚡",
      label: "Partial",
      color: "var(--warn)",
    },
    unpaid: {
      bg: "rgba(255,92,92,0.06)",
      border: "rgba(255,92,92,0.2)",
      icon: "⏳",
      label: "Unpaid",
      color: "var(--danger)",
    },
  };

  return (
    <div className="min-h-dvh pb-28">
      <div className="px-6 mx-auto">
        <PageHeader
          greeting="Manage your"
          title="Payments"
          right={
            <div
              className="rounded-xl px-3 py-2 text-xs font-bold"
              style={{
                background: "rgba(0,229,160,0.12)",
                border: "1px solid rgba(0,229,160,0.3)",
                color: "var(--accent)",
              }}
            >
              ₹{duesData?.gymFee ?? 500}/mo
            </div>
          }
        />

        {/* ── Summary section ── */}
        <div className="mb-5">
          {summaryLoading ? (
            <div className="skeleton h-[140px] rounded-[20px]" />
          ) : summary ? (
            <div
              className="rounded-[20px] overflow-hidden"
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Top — totals */}
              <div
                className="grid grid-cols-2 divide-x"
                style={
                  {
                    borderBottom: "1px solid var(--border)",
                    "--tw-divide-opacity": "1",
                  } as React.CSSProperties
                }
              >
                <div className="p-4">
                  <div
                    className="text-[11px] uppercase tracking-wider mb-1"
                    style={{ color: "var(--text2)" }}
                  >
                    Total paid
                  </div>
                  <div
                    className="font-[Syne] text-xl font-extrabold"
                    style={{ color: "var(--accent)" }}
                  >
                    {fmt(summary.totalPaid)}
                  </div>
                  <div
                    className="text-[11px] mt-0.5"
                    style={{ color: "var(--text3)" }}
                  >
                    lifetime contributions
                  </div>
                </div>
                <div className="p-4">
                  <div
                    className="text-[11px] uppercase tracking-wider mb-1"
                    style={{ color: "var(--text2)" }}
                  >
                    Outstanding
                  </div>
                  <div
                    className="font-[Syne] text-xl font-extrabold"
                    style={{
                      color:
                        summary.totalOutstanding > 0
                          ? "var(--warn)"
                          : "var(--accent)",
                    }}
                  >
                    {fmt(summary.totalOutstanding)}
                  </div>
                  <div
                    className="text-[11px] mt-0.5"
                    style={{ color: "var(--text3)" }}
                  >
                    {summary.totalOutstanding > 0
                      ? "needs to be cleared"
                      : "all clear 🎉"}
                  </div>
                </div>
              </div>

              {/* By year breakdown */}
              {summary.byYear.length > 0 && (
                <div className="p-4">
                  <div
                    className="text-[11px] uppercase tracking-wider mb-3"
                    style={{ color: "var(--text2)" }}
                  >
                    Year-wise
                  </div>
                  <div className="flex flex-col gap-2">
                    {summary.byYear.map(([year, total]) => (
                      <div key={year}>
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() =>
                            setYearExpanded(yearExpanded === year ? null : year)
                          }
                        >
                          <span className="text-sm font-semibold">{year}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className="font-[Syne] font-bold text-sm"
                              style={{ color: "var(--accent)" }}
                            >
                              {fmt(total)}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: "var(--text3)" }}
                            >
                              {yearExpanded === year ? "▲" : "▼"}
                            </span>
                          </div>
                        </div>

                        {/* Month breakdown within year */}
                        {yearExpanded === year && (
                          <div className="mt-2 ml-2 flex flex-col gap-1">
                            {(() => {
                              const monthTotals = summary.payments
                                .filter(
                                  (p) =>
                                    p.status === "approved" &&
                                    p.month.startsWith(year),
                                )
                                .reduce(
                                  (acc: Record<string, number>, p) => {
                                    acc[p.month] =
                                      (acc[p.month] || 0) + Number(p.amount);
                                    return acc;
                                  },
                                  {} as Record<string, number>,
                                );
                              return Object.entries(monthTotals)
                                .sort(([a], [b]) => b.localeCompare(a))
                                .map(([month, amt]) => (
                                  <div
                                    key={month}
                                    className="flex justify-between py-1 px-2 rounded-lg"
                                    style={{ background: "var(--bg3)" }}
                                  >
                                    <span
                                      className="text-xs"
                                      style={{ color: "var(--text2)" }}
                                    >
                                      {fmtMonth(month)}
                                    </span>
                                    <span
                                      className="text-xs font-semibold"
                                      style={{ color: "var(--accent)" }}
                                    >
                                      {fmt(amt)}
                                    </span>
                                  </div>
                                ));
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Outstanding banner */}
        {!duesLoading && (duesData?.totalOutstanding ?? 0) > 0 && (
          <div
            className="mb-5 rounded-[16px] p-4 flex items-center gap-4"
            style={{
              background: "rgba(255,181,71,0.08)",
              border: "1px solid rgba(255,181,71,0.25)",
            }}
          >
            <div className="text-3xl">💰</div>
            <div>
              <div
                className="font-[Syne] text-base font-bold"
                style={{ color: "var(--warn)" }}
              >
                {fmt(duesData!.totalOutstanding)} outstanding
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>
                Across{" "}
                {duesData!.dues.filter((d) => d.status !== "paid").length}{" "}
                month(s)
              </div>
            </div>
          </div>
        )}

        {/* Dues calendar */}
        <div className="mb-3">
          <span
            className="font-[Syne] text-base font-bold"
            style={{ color: "var(--text)" }}
          >
            Month-wise
          </span>
        </div>
        <div className="flex flex-col gap-3 mb-5">
          {duesLoading
            ? Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="skeleton h-[72px] rounded-[16px]" />
                ))
            : duesData?.dues
                .slice()
                .reverse()
                .map((month) => {
                  const cfg = statusConfig[month.status];
                  return (
                    <div
                      key={month.month}
                      className="rounded-[16px] p-4 flex items-center gap-3"
                      style={{
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                      }}
                    >
                      <div className="text-2xl">{cfg.icon}</div>
                      <div className="flex-1">
                        <div
                          className="font-[Syne] text-sm font-bold"
                          style={{ color: "var(--text)" }}
                        >
                          {month.label}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text2)" }}
                        >
                          {month.status === "paid"
                            ? `${fmt(month.paidAmount)} paid`
                            : month.status === "partial"
                              ? `${fmt(month.paidAmount)} of ${fmt(month.fullAmount)} paid · ${fmt(month.remaining)} remaining`
                              : `${fmt(month.fullAmount)} due`}
                        </div>
                        {month.payments.filter((p) => p.status === "pending")
                          .length > 0 && (
                          <div
                            className="text-[10px] mt-1 font-semibold"
                            style={{ color: "var(--accent2)" }}
                          >
                            ⏳ Verification pending
                          </div>
                        )}
                      </div>
                      {month.status !== "paid" &&
                        month.payments.filter((p) => p.status === "pending")
                          .length === 0 && (
                          <button
                            onClick={() => openPaySheet(month)}
                            className="rounded-xl px-3 py-2 font-[Syne] text-xs font-bold transition-all hover:opacity-80 flex-shrink-0"
                            style={{
                              background: "var(--accent)",
                              color: "#0D1117",
                            }}
                          >
                            Pay {fmt(month.remaining)}
                          </button>
                        )}
                    </div>
                  );
                })}
        </div>
      </div>

      {/* Payment sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <h2 className="font-[Syne] text-xl font-bold mb-1.5">
          Pay {selectedMonth?.label}
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text2)" }}>
          Complete the UPI payment then paste the UTR number below.
        </p>

        {/* Amount selector */}
        <div className="mb-5">
          <label
            className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--text2)" }}
          >
            Amount
          </label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => {
                setUseCustom(false);
                setAmount(String(selectedMonth?.remaining));
              }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: !useCustom ? "var(--accent)" : "var(--bg3)",
                color: !useCustom ? "#0D1117" : "var(--text2)",
                border: `1px solid ${!useCustom ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              Full {fmt(selectedMonth?.remaining ?? 0)}
            </button>
            <button
              onClick={() => setUseCustom(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: useCustom ? "var(--accent)" : "var(--bg3)",
                color: useCustom ? "#0D1117" : "var(--text2)",
                border: `1px solid ${useCustom ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              Custom amount
            </button>
          </div>
          {useCustom && (
            <div className="flex flex-col gap-2">
              <input
                className="w-full rounded-[14px] px-4 py-3.5 text-base font-bold outline-none"
                style={{
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
                type="number"
                placeholder={`Max ₹${selectedMonth?.remaining}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <input
                className="w-full rounded-[14px] px-4 py-3.5 text-sm outline-none"
                style={{
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
                placeholder="Reason for partial payment (required)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
        </div>

        {[
          {
            n: 1,
            text: (
              <>
                Open UPI app with{" "}
                <b style={{ color: "var(--accent)" }}>
                  {fmt(
                    useCustom
                      ? parseFloat(amount) || 0
                      : (selectedMonth?.remaining ?? 0),
                  )}{" "}
                  pre-filled
                </b>
              </>
            ),
          },
          {
            n: 2,
            text: (
              <>
                Note the <b style={{ color: "var(--accent)" }}>12-digit UTR</b>{" "}
                on the success screen
              </>
            ),
          },
          {
            n: 3,
            text: (
              <>
                Paste it below and tap{" "}
                <b style={{ color: "var(--accent)" }}>Submit</b>
              </>
            ),
          },
        ].map((s) => (
          <div key={s.n} className="flex items-start gap-3 mb-4">
            <div
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center font-[Syne] text-xs font-bold flex-shrink-0 mt-0.5"
              style={{
                background: "var(--accent-dim)",
                border: "1px solid rgba(0,229,160,0.3)",
                color: "var(--accent)",
              }}
            >
              {s.n}
            </div>
            <div className="text-sm pt-1" style={{ color: "var(--text2)" }}>
              {s.text}
            </div>
          </div>
        ))}

        <button
          onClick={handleOpenUPI}
          className="w-full rounded-[14px] py-3.5 font-[Syne] text-sm font-bold mb-4 transition-all hover:opacity-80 flex items-center justify-center gap-2"
          style={{
            background: "var(--bg3)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        >
          ↗ Open UPI app (GPay / PhonePe)
        </button>

        <div className="mb-4">
          <label
            className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--text2)" }}
          >
            UTR / Reference number
          </label>
          <input
            id="utr-input"
            className="w-full rounded-[14px] px-4 py-3.5 outline-none transition-all"
            style={{
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontFamily: "monospace",
              fontSize: 18,
              letterSpacing: "0.08em",
            }}
            type="tel"
            placeholder="123456789012"
            value={utr}
            maxLength={12}
            onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))}
          />
          <p className="text-[11px] mt-1.5" style={{ color: "var(--text3)" }}>
            12-digit number on the UPI success screen
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={
            utr.length !== 12 ||
            submitting ||
            (useCustom && (!amount || !reason.trim()))
          }
          className="w-full rounded-[14px] py-4 font-[Syne] text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={{
            background: "var(--accent)",
            color: "#0D1117",
            opacity:
              utr.length === 12 && (!useCustom || (amount && reason.trim()))
                ? 1
                : 0.4,
          }}
        >
          {submitting ? (
            <span className="spinner w-5 h-5" />
          ) : (
            "Submit for verification"
          )}
        </button>
      </BottomSheet>
    </div>
  );
}
