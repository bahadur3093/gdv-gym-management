interface StatCardProps {
  icon:        string
  iconBg:      string
  value:       string | number
  valueColor?: string
  label:       string
}

export default function StatCard({ icon, iconBg, value, valueColor, label }: StatCardProps) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg2)] p-[14px_12px] shadow-[var(--shadow)]">
      <div className="mb-2.5 h-8 w-8 rounded-[10px] flex items-center justify-center text-[16px]" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="text-[20px] font-bold font-['Open Sans'] leading-none" style={{ color: valueColor }}>
        {value}
      </div>
      <div className="text-[11px] text-[var(--text2)] mt-1 tracking-[0.02em]">{label}</div>
    </div>
  )
}
