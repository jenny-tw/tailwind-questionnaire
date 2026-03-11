export default function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="progress-wrapper" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      <div className="progress-label">
        Question <strong>{current}</strong> of <strong>{total}</strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
