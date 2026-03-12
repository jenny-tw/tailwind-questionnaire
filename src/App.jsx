import { useState } from 'react'
import emailjs from '@emailjs/browser'
import questionsData from './data/questions.json'
import { calculateScores, getBenchmarks, buildAnswersJson } from './utils/scoring.js'
import ProgressBar from './components/ProgressBar.jsx'
import QuestionCard from './components/QuestionCard.jsx'
import ResultsPage from './components/ResultsPage.jsx'

const STEPS = {
  WELCOME: 'welcome',
  QUESTIONNAIRE: 'questionnaire',
  REVIEW: 'review',
  SUBMITTED: 'submitted',
}

const { questions } = questionsData

const STAGE_OPTIONS = [
  { value: 'Pre-Seed', label: 'Pre-Seed', sub: 'includes friends & family' },
  { value: 'Seed', label: 'Seed', sub: '' },
  { value: 'Series A', label: 'Series A', sub: 'or post-Series A Bridge round' },
  { value: 'Series B+', label: 'Series B+', sub: '' },
]

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function formatScoresSummary(scores, benchmarks) {
  return Object.entries(scores)
    .map(([cat, score]) => {
      const target = benchmarks[cat] ?? 0
      const met = score >= target
      return `${cat}: ${score.toFixed(1)} (target: ${target})${met ? ' ✓' : ''}`
    })
    .join('\n')
}

export default function App() {
  const [step, setStep] = useState(STEPS.WELCOME)

  // Welcome form state
  const [respondent, setRespondent] = useState({ name: '', company: '', email: '', stage: '' })
  const [welcomeErrors, setWelcomeErrors] = useState({})

  // Questionnaire state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [notes, setNotes] = useState({})
  const [showError, setShowError] = useState(false)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Results state
  const [finalScores, setFinalScores] = useState(null)
  const [finalBenchmarks, setFinalBenchmarks] = useState(null)
  const [submittedAt, setSubmittedAt] = useState(null)

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  // --- Handlers ---

  function handleWelcomeChange(e) {
    setRespondent(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setWelcomeErrors(prev => ({ ...prev, [e.target.name]: undefined }))
  }

  function handleWelcomeSubmit(e) {
    e.preventDefault()
    const errors = {}
    if (!respondent.name.trim()) errors.name = 'Full name is required.'
    if (!respondent.company.trim()) errors.company = 'Company name is required.'
    if (!respondent.email.trim()) errors.email = 'Email address is required.'
    else if (!validateEmail(respondent.email)) errors.email = 'Please enter a valid email address.'
    if (!respondent.stage) errors.stage = 'Please select a financing round.'

    if (Object.keys(errors).length > 0) {
      setWelcomeErrors(errors)
      return
    }
    setStep(STEPS.QUESTIONNAIRE)
  }

  function handleAnswer(id, value) {
    setAnswers(prev => ({ ...prev, [id]: value }))
    setShowError(false)
  }

  function handleNote(id, value) {
    setNotes(prev => ({ ...prev, [id]: value }))
  }

  function isAnswered(question) {
    const a = answers[question.id]
    if (question.type === 'multi') return Array.isArray(a) && a.length > 0
    return a !== undefined && a !== null && a !== ''
  }

  function handleNext() {
    if (!isAnswered(currentQuestion)) {
      setShowError(true)
      return
    }
    setShowError(false)
    if (isLastQuestion) {
      setStep(STEPS.REVIEW)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  function handlePrev() {
    setShowError(false)
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
    } else {
      setStep(STEPS.WELCOME)
    }
  }

  function handleEditQuestion(index) {
    setCurrentIndex(index)
    setStep(STEPS.QUESTIONNAIRE)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)

    const scores = calculateScores(questions, answers)
    const benchmarks = getBenchmarks(respondent.stage, questionsData)
    const answersJson = buildAnswersJson(questions, answers, notes)
    const dateStr = new Date().toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const params = new URLSearchParams()
    params.append('form-name', 'questionnaire-submission')
    params.append('submitter_name', respondent.name)
    params.append('submitter_company', respondent.company)
    params.append('submitter_email', respondent.email)
    params.append('stage', respondent.stage)
    params.append('submitted_at', new Date().toISOString())
    params.append('category_problem_market', scores['Problem & Market'] ?? '')
    params.append('category_competitive_position', scores['Competitive Position'] ?? '')
    params.append('category_commercial_traction', scores['Commercial Traction'] ?? '')
    params.append('category_team_governance', scores['Team & Governance'] ?? '')
    params.append('category_financial_story', scores['Financial Story'] ?? '')
    params.append('category_narrative', scores['Narrative'] ?? '')
    params.append('answers_json', JSON.stringify(answersJson))

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
      if (!res.ok) throw new Error(`Submission failed (${res.status})`)
    } catch (err) {
      console.error('Form submission error:', err)
      setSubmitError('Something went wrong submitting the form. Please try again.')
      setSubmitting(false)
      return
    }

    // EmailJS — non-blocking; failure does not prevent results from showing
    try {
      const scoresSummary = formatScoresSummary(scores, benchmarks)
      await emailjs.send(
        'service_4bywiqh',
        'template_tzdmps8',
        {
          submitter_name: respondent.name,
          company_name: respondent.company,
          stage: respondent.stage,
          submitted_at: dateStr,
          scores_summary: scoresSummary,
        },
        'hnudtcWLNWSrtPNN3'
      )
    } catch (err) {
      console.error('EmailJS error:', err)
    }

    setFinalScores(scores)
    setFinalBenchmarks(benchmarks)
    setSubmittedAt(dateStr)
    setSubmitting(false)
    setStep(STEPS.SUBMITTED)
  }

  function getAnswerDisplay(question) {
    const a = answers[question.id]
    if (!a) return <em className="review-empty">Not answered</em>
    if (Array.isArray(a)) return a.join(', ')
    if (question.type === 'rating') {
      const label = question.ratingLabels?.[a]
      return label && label !== '??' ? `${a} — ${label}` : a
    }
    return a
  }

  // --- Render ---

  if (step === STEPS.SUBMITTED) {
    return (
      <div className="app">
        <header className="app-header">
          <img
            src="/Tailwind_Full_Color_Logo_Inline.svg"
            alt="Tailwind Ventures"
            className="logo"
          />
        </header>
        <main className="app-main app-main--wide">
          <ResultsPage
            respondent={respondent}
            scores={finalScores}
            benchmarks={finalBenchmarks}
            submittedAt={submittedAt}
          />
        </main>
      </div>
    )
  }

  if (step === STEPS.WELCOME) {
    return (
      <div className="app">
        <header className="app-header">
          <img
            src="/Tailwind_Full_Color_Logo_Inline.svg"
            alt="Tailwind Ventures"
            className="logo"
          />
        </header>
        <main className="app-main">
          <div className="welcome-card">
            <h1 className="welcome-title">Venture Snapshot</h1>
            <p className="welcome-description">
              This short questionnaire helps the Tailwind Ventures team build a picture of
              where your company stands across six key dimensions. It takes approximately
              5–10 minutes to complete. Your answers are confidential and used solely to
              guide our initial conversation.
            </p>

            <form onSubmit={handleWelcomeSubmit} noValidate className="welcome-form">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name <span className="required-star">*</span></label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={`form-input${welcomeErrors.name ? ' input-error' : ''}`}
                  value={respondent.name}
                  onChange={handleWelcomeChange}
                  placeholder="Jane Smith"
                  aria-describedby={welcomeErrors.name ? 'name-error' : undefined}
                  aria-invalid={!!welcomeErrors.name}
                />
                {welcomeErrors.name && (
                  <p id="name-error" className="field-error" role="alert">{welcomeErrors.name}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="company" className="form-label">Company Name <span className="required-star">*</span></label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  className={`form-input${welcomeErrors.company ? ' input-error' : ''}`}
                  value={respondent.company}
                  onChange={handleWelcomeChange}
                  placeholder="Acme Corp"
                  aria-describedby={welcomeErrors.company ? 'company-error' : undefined}
                  aria-invalid={!!welcomeErrors.company}
                />
                {welcomeErrors.company && (
                  <p id="company-error" className="field-error" role="alert">{welcomeErrors.company}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address <span className="required-star">*</span></label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`form-input${welcomeErrors.email ? ' input-error' : ''}`}
                  value={respondent.email}
                  onChange={handleWelcomeChange}
                  placeholder="jane@example.com"
                  aria-describedby={welcomeErrors.email ? 'email-error' : undefined}
                  aria-invalid={!!welcomeErrors.email}
                />
                {welcomeErrors.email && (
                  <p id="email-error" className="field-error" role="alert">{welcomeErrors.email}</p>
                )}
              </div>

              <div className="form-group">
                <p className="form-label">
                  What financing round are you currently raising or preparing for?{' '}
                  <span className="required-star">*</span>
                </p>
                <div
                  className={`stage-selector${welcomeErrors.stage ? ' stage-selector--error' : ''}`}
                  role="group"
                  aria-label="Financing round"
                >
                  {STAGE_OPTIONS.map(s => (
                    <label
                      key={s.value}
                      className={`stage-option${respondent.stage === s.value ? ' selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="stage"
                        value={s.value}
                        checked={respondent.stage === s.value}
                        onChange={handleWelcomeChange}
                        className="option-input"
                      />
                      <span className="stage-option-label">{s.label}</span>
                      {s.sub && <span className="stage-option-sub">{s.sub}</span>}
                    </label>
                  ))}
                </div>
                {welcomeErrors.stage && (
                  <p className="field-error" role="alert">{welcomeErrors.stage}</p>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-large">
                Begin Venture Snapshot →
              </button>
            </form>
          </div>
        </main>
      </div>
    )
  }

  if (step === STEPS.REVIEW) {
    return (
      <div className="app">
        <header className="app-header">
          <img
            src="/Tailwind_Full_Color_Logo_Inline.svg"
            alt="Tailwind Ventures"
            className="logo"
          />
        </header>
        <main className="app-main">
          <div className="review-card">
            <h2 className="review-title">Review Your Answers</h2>
            <p className="review-subtitle">
              Please check your answers below. You can go back to edit any response before submitting.
            </p>

            <div className="review-respondent">
              <span><strong>{respondent.name}</strong></span>
              <span>{respondent.company}</span>
              <span>{respondent.email}</span>
              <span>{respondent.stage}</span>
            </div>

            <ol className="review-list">
              {questions.map((q, idx) => (
                <li key={q.id} className="review-item">
                  <div className="review-question-header">
                    <span className="review-category">{q.category}</span>
                    <button
                      type="button"
                      className="btn btn-edit"
                      onClick={() => handleEditQuestion(idx)}
                    >
                      Edit
                    </button>
                  </div>
                  <p className="review-question-text">{q.text}</p>
                  <p className="review-answer">{getAnswerDisplay(q)}</p>
                  {notes[q.id] && (
                    <p className="review-note">Note: {notes[q.id]}</p>
                  )}
                </li>
              ))}
            </ol>

            {submitError && (
              <p className="field-error submit-error" role="alert">{submitError}</p>
            )}

            <div className="nav-buttons">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setCurrentIndex(questions.length - 1); setStep(STEPS.QUESTIONNAIRE) }}
              >
                ← Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit Snapshot →'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // QUESTIONNAIRE step
  return (
    <div className="app">
      <header className="app-header">
        <img
          src="/Tailwind_Full_Color_Logo_Inline.svg"
          alt="Tailwind Ventures"
          className="logo"
        />
      </header>
      <main className="app-main">
        <ProgressBar current={currentIndex + 1} total={questions.length} />

        <QuestionCard
          question={currentQuestion}
          answer={answers[currentQuestion.id]}
          note={notes[currentQuestion.id]}
          onAnswer={handleAnswer}
          onNote={handleNote}
          showError={showError}
        />

        <div className="nav-buttons">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrev}
          >
            ← Previous
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNext}
          >
            {isLastQuestion ? 'Review Answers →' : 'Next →'}
          </button>
        </div>
      </main>
    </div>
  )
}
