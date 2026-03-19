import styles from './StatCard.module.css'

export default function StatCard({ icon, iconBg, value, valueColor, label }) {
  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.icon} style={{ background: iconBg }}>{icon}</div>
      <div className={styles.value} style={{ color: valueColor }}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  )
}
