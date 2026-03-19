import styles from './PageHeader.module.css'

export default function PageHeader({ greeting, title, titleAccent, right }) {
  return (
    <div className={styles.header}>
      <div>
        {greeting && <p className={styles.greeting}>{greeting}</p>}
        <h1 className={styles.title}>
          {title}
          {titleAccent && <span className={styles.accent}> {titleAccent}</span>}
        </h1>
      </div>
      {right && <div className={styles.right}>{right}</div>}
    </div>
  )
}
