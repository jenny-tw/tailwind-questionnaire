export default function ThankYou({ name }) {
  return (
    <div className="thankyou-wrapper">
      <div className="thankyou-card">
        <div className="thankyou-icon" aria-hidden="true">✓</div>
        <h1 className="thankyou-title">Snapshot Submitted</h1>
        <p className="thankyou-message">
          Thank you, <strong>{name}</strong>. Your Venture Snapshot has been submitted successfully.
        </p>
        <p className="thankyou-sub">
          The Tailwind Ventures team will review your responses and be in touch soon.
        </p>
      </div>
    </div>
  )
}
