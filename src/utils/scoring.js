/**
 * Calculate category scores from user answers.
 *
 * @param {Array} questions - All questions from questions.json
 * @param {Object} answers - Map of question id -> selected option text(s)
 *   For single/rating: answers[id] = "option text"
 *   For multi:         answers[id] = ["option text", ...]
 * @returns {Object} - Category name -> score (0–10, 1 decimal)
 */
export function calculateScores(questions, answers) {
  // Build a map from category to list of scores
  const categoryScores = {}

  for (const question of questions) {
    const answer = answers[question.id]
    if (answer === undefined || answer === null || answer === '') continue

    let score = 0

    if (question.type === 'single' || question.type === 'rating') {
      const option = question.options.find(o => o.text === answer)
      if (option) score = option.score
    } else if (question.type === 'multi') {
      const selected = Array.isArray(answer) ? answer : [answer]
      const total = selected.reduce((sum, text) => {
        const option = question.options.find(o => o.text === text)
        return sum + (option ? option.score : 0)
      }, 0)
      score = Math.min(total, question.scoreCap ?? 10)
    }

    if (!categoryScores[question.category]) {
      categoryScores[question.category] = []
    }
    categoryScores[question.category].push(score)
  }

  // Average each category
  const result = {}
  for (const [category, scores] of Object.entries(categoryScores)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    result[category] = Math.round(avg * 10) / 10
  }

  return result
}

/**
 * Build the answers_json payload for Netlify Forms submission.
 */
export function buildAnswersJson(questions, answers, notes) {
  return questions.map(q => ({
    id: q.id,
    category: q.category,
    question: q.text,
    answer: answers[q.id] ?? null,
    note: notes[q.id] ?? null,
  }))
}
