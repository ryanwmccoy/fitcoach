import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DAYS_FULL, fmtH, fmtDate, getWeekDates, TYPE_LABEL, SMALL_GROUP_CAPACITY } from '../lib/utils'

export default function ExportPage() {
  const { user }  = useAuth()
  const [events, setEvents]   = useState([])
  const [members, setMembers] = useState([])
  const [weekOff, setWeekOff] = useState(0)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('events').select('*').eq('user_id', user.id),
      supabase.from('event_members').select('event_id, clients(name)').eq('user_id', user.id),
    ]).then(([{ data: ev }, { data: mem }]) => {
      setEvents(ev || [])
      setMembers((mem || []).map(m => ({ event_id: m.event_id, name: m.clients?.name || '—' })))
    })
  }, [user])

  const dates = getWeekDates(weekOff)
  const text  = buildText(events, members, weekOff)

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

const TAG = {
  fixed: '[Group]',
  personal: '[PT]',
  'personal-time': '[Personal]',
  'small-group': '[Small Group]',
}

function buildText(events, members, weekOff) {
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
      const tag = TAG[ev.type] || ''
      const loc = ev.location ? ` @ ${ev.location}` : ''
      lines.push(`  ${fmtH(ev.start_hour)} – ${fmtH(ev.start_hour + ev.dur)}  ${tag} ${ev.title}${loc}`)
      if (ev.type === 'small-group') {
        const roster = members.filter(m => m.event_id === ev.id).map(m => m.name)
        const cap = ev.capacity || SMALL_GROUP_CAPACITY
        lines.push(`      Roster (${roster.length}/${cap}): ${roster.length ? roster.join(', ') : '—'}`)
      }
    })
    lines.push('')
  }
  if (!hasAny) lines.push('No sessions scheduled this week.')
  const pt    = events.filter(e => e.type === 'personal').length
  const group = events.filter(e => e.type === 'fixed').length
  const sg    = events.filter(e => e.type === 'small-group').length
  const hrs   = events.filter(e => e.type !== 'travel' && e.type !== 'personal-time').reduce((s, e) => s + e.dur, 0)
  lines.push('─────────────────────────')
  lines.push(`${pt} personal training session${pt !== 1 ? 's' : ''}`)
  lines.push(`${group} group class${group !== 1 ? 'es' : ''}`)
  lines.push(`${sg} small group slot${sg !== 1 ? 's' : ''}`)
  lines.push(`${hrs.toFixed(1)} hours coaching total`)
  return lines.join('\n')
}
