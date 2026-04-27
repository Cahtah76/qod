function parseDate(str) { return new Date(str + 'T00:00:00') }
function completionPct(tasks) {
  return tasks.length ? Math.round(tasks.filter(t => t.status === 'Done').length / tasks.length * 100) : 0
}

export function computeProjectHealth(project) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { sprints } = project
  if (!sprints.length) return 'On Track'

  const completed = sprints.filter(s => parseDate(s.endDate) < today)
  const active = sprints.filter(s => parseDate(s.startDate) <= today && parseDate(s.endDate) >= today)
  const allTasks = sprints.flatMap(s => s.tasks)
  const highPriorityIncomplete = allTasks.filter(t => t.priority === 'High' && t.status !== 'Done')

  const allNoteTexts = [
    ...(project.notes || []).map(n => n.text.toLowerCase()),
    ...sprints.flatMap(s => [
      ...(s.notes || []).map(n => n.text.toLowerCase()),
      ...s.tasks.flatMap(t => (t.notes || []).map(n => n.text.toLowerCase())),
    ]),
  ]
  const hasBlockerMention = allNoteTexts.some(t => t.includes('block') || t.includes('stuck'))

  const overdueWithLowCompletion = completed.filter(s => completionPct(s.tasks) < 70)

  let activeBehind = false
  for (const s of active) {
    const start = parseDate(s.startDate).getTime()
    const end = parseDate(s.endDate).getTime()
    const elapsed = (today.getTime() - start) / (end - start)
    if (elapsed > 0.6 && completionPct(s.tasks) / 100 < elapsed - 0.25) activeBehind = true
  }

  if (hasBlockerMention) return 'Blocked'
  if (overdueWithLowCompletion.length > 0 || activeBehind || highPriorityIncomplete.length > 3) return 'At Risk'
  return 'On Track'
}
