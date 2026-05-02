import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DAYS_FULL, HOURS, fmtH, fmtDate, getWeekDates } from '../lib/utils'

export default function ExportPage() {
  const { user }  = useAuth()
  const [events, setEvents]   = useState([])
  const [weekOff, setWeekOff] = useState(0)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    supabase.from('events').select('*').eq('user_id', user.id)
      .then(({ data }) => setEvents(data || []))
  }, [user])

  const dates = getWeekDates(weekOff)
  const text  = buildText(events, weekOff)

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <div className="topbar">
        <button className="btn" onClick={() => setWeekOff(w => w - 1)}>←</button>
        <span style={{ fontWeight: 500, fontSize: 13 }}>{fmtDate(dates[0])} – {fmtDate(dates[6])}</span>
        <button className="btn" onClick={() => setWeekOff(w => w + 1)}>→</button>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={copy}>
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
      </div>
      <div className="page-content">
        <div style={{ maxWidth: 560 }}>
          <div className="export-block">{text}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            Paste this into a text, email, or notes app.
          </div>
        </div>
      </div>
    </>
  )
}

function buildText(events, weekOff) {
  const dates = getWeekDates(weekOff)
  const lines = []
  lines.push(`SCHEDULE — ${fmtDate(dates[0]).toUpperCase()} TO ${fmtDate(dates[6]).toUpperCase()}`)
  lines.push('')
  let hasAny = false
  for (let d = 0; d < 7; d++) {
    const day = events
      .filter(e => e.day === d && e.type !== 'travel')
      .sort((a, b) => a.start_hour - b.start_hour)
    if (!day.length) continue
    hasAny = true
    lines.push(DAYS_FULL[d].toUpperCase())
    day.forEach(ev => {
      const tag = ev.type === 'fixed' ? '[Group]' : ev.type === 'personal-time' ? '[Personal]' : '[PT]'
      const loc = ev.location ? ` @ ${ev.location}` : ''
      lines.push(`  ${fmtH(ev.start_hour)} – ${fmtH(ev.start_hour + ev.dur)}  ${tag} ${ev.title}${loc}`)
    })
    lines.push('')
  }
  if (!hasAny) lines.push('No sessions scheduled this week.')
  const pt    = events.filter(e => e.type === 'personal').length
  const group = events.filter(e => e.type === 'fixed').length
  const hrs   = events.filter(e => e.type !== 'travel' && e.type !== 'personal-time').reduce((s, e) => s + e.dur, 0)
  lines.push('─────────────────────────')
  lines.push(`${pt} personal training session${pt !== 1 ? 's' : ''}`)
  lines.push(`${group} group class${group !== 1 ? 'es' : ''}`)
  lines.push(`${hrs.toFixed(1)} hours coaching total`)
  return lines.join('\n')
}
