import { useState } from 'react'

export default function QuestionCard({ question, answer, note, onAnswer, onNote, showError }) {
  const isMulti = question.type === 'multi'
  const isRating = question.type === 'rating'

  function handleSingle(optionText) {
    onAnswer(question.id, optionText)
  }

  function handleMulti(optionText) {
    const current = Array.isArray(answer) ? answer : []
    const next = current.includes(optionText)
      ? current.filter(t => t !== optionText)
      : [...current, optionText]
    onAnswer(question.id, next)
  }

  const hasAnswer = isMulti
    ? Array.isArray(answer) && answer.length > 0
    : answer !== undefined && answer !== null && answer !== ''

  if (isRating) {
    return (
      <div className="question-card">
        <div className="question-category">{question.category}</div>
        <h2 className="question-text">{question.text}</h2>

        <div className="rating-scale">
          {question.options.map((opt) => {
            const val = opt.text
            const label = question.ratingLabels?.[val]
            const isSelected = answer === val
            const isPlaceholder = label === '??'
            return (
              <button
                key={val}
                type="button"
                className={`rating-btn${isSelected ? ' selected' : ''}`}
                onClick={() => handleSingle(val)}
                aria-pressed={isSelected}
                aria-label={`Rating ${val}${label && !isPlaceholder ? ': ' + label : ''}`}
              >
                <span className="rating-number">{val}</span>
                {label && !isPlaceholder && (
                  <span className="rating-label">{label}</span>
                )}
              </button>
            )
          })}
        </div>

        {showError && !hasAnswer && (
          <p className="field-error" role="alert">Please select a rating to continue.</p>
        )}
      </div>
    )
  }

  return (
    <div className="question-card">
      <div className="question-category">{question.category}</div>
      <h2 className="question-text">{question.text}</h2>

      {question.instruction && (
        <p className="question-instruction">{question.instruction}</p>
      )}
      {question.helperText && (
        <p className="question-helper">{question.helperText}</p>
      )}

      <div className="options-list" role={isMulti ? 'group' : undefined}>
        {question.options.map((opt) => {
          const isSelected = isMulti
            ? Array.isArray(answer) && answer.includes(opt.text)
            : answer === opt.text

          return (
            <label
              key={opt.text}
              className={`option-label${isSelected ? ' selected' : ''}`}
            >
              <input
                type={isMulti ? 'checkbox' : 'radio'}
                name={`q-${question.id}`}
                value={opt.text}
                checked={isSelected}
                onChange={() => isMulti ? handleMulti(opt.text) : handleSingle(opt.text)}
                className="option-input"
              />
              <span className="option-indicator" />
              <span className="option-text">{opt.text}</span>
            </label>
          )
        })}
      </div>

      {question.hasNote && (
        <div className="note-field">
          <label htmlFor={`note-${question.id}`} className="note-label">
            Additional context (optional)
          </label>
          <input
            id={`note-${question.id}`}
            type="text"
            className="note-input"
            placeholder={question.notePlaceholder || 'Add a note…'}
            value={note || ''}
            onChange={e => onNote(question.id, e.target.value)}
          />
        </div>
      )}

      {showError && !hasAnswer && (
        <p className="field-error" role="alert">
          {isMulti ? 'Please select at least one option to continue.' : 'Please select an answer to continue.'}
        </p>
      )}
    </div>
  )
}
