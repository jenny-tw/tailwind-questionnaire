import { useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import RadarChartComponent from './RadarChart.jsx'

const CATEGORIES = [
  'Problem & Market',
  'Competitive Position',
  'Commercial Traction',
  'Team & Governance',
  'Financial Story',
  'Narrative',
]

export default function ResultsPage({ respondent, scores, benchmarks, submittedAt }) {
  const printRef = useRef(null)

  async function handleDownloadPDF() {
    const element = printRef.current
    if (!element) return

    const canvas = await html2canvas(element, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

    const companySlug = respondent.company.replace(/\s+/g, '')
    const dateStr = new Date().toISOString().slice(0, 10)
    const filename = `${companySlug}-VentureSnapshot-${dateStr}.pdf`
    pdf.save(filename)
  }

  return (
    <div className="results-outer">
      {/* Success banner — not included in PDF */}
      <div className="results-success-banner">
        <span className="results-success-icon" aria-hidden="true">✓</span>
        <div>
          <p className="results-success-title">Snapshot Submitted</p>
          <p className="results-success-sub">
            Thank you, <strong>{respondent.name}</strong>. Your responses have been received.
          </p>
        </div>
      </div>

      {/* Printable section — captured for PDF */}
      <div ref={printRef} className="results-printable">

        {/* Section A — Header */}
        <div className="results-header">
          <img
            src="/Tailwind_Full_Color_Logo_Inline.svg"
            alt="Tailwind Ventures"
            className="logo results-logo"
          />
          <h1 className="results-title">Your Venture Snapshot</h1>
          <p className="results-subheading">
            {respondent.name} — {respondent.company} — {respondent.stage}
          </p>
          <p className="results-date">Submitted on {submittedAt}</p>
        </div>

        {/* Section B — Dual Radar Chart */}
        <div className="results-section">
          <RadarChartComponent
            scores={scores}
            benchmarks={benchmarks}
            stage={respondent.stage}
          />
        </div>

        {/* Section C — Scores Table */}
        <div className="results-section">
          <table className="scores-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Your Score</th>
                <th>{respondent.stage} Target</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(cat => {
                const score = scores[cat] ?? 0
                const target = benchmarks[cat] ?? 0
                const meetsTarget = score >= target
                return (
                  <tr key={cat}>
                    <td>{cat}</td>
                    <td
                      className="scores-table-score"
                      style={{ color: meetsTarget ? '#255cff' : '#dc7f32' }}
                    >
                      {score.toFixed(1)}
                    </td>
                    <td>{target}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Section D — Download Button */}
      <div className="results-actions">
        <button className="btn btn-primary btn-large" onClick={handleDownloadPDF}>
          Download PDF Report
        </button>
      </div>

      {/* Section E — Closing message */}
      <p className="results-closing">
        The Tailwind Ventures team will be in touch soon. If you have any questions in the
        meantime, please reach out to{' '}
        <a href="mailto:jenny.m@tailwindventures.co">jenny.m@tailwindventures.co</a>
      </p>
    </div>
  )
}
