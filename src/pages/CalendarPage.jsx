import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DAYS, HOURS, fmtH, fmtDate, getWeekDates } from '../lib/utils'
import Modal from '../components/Modal'

export default function CalendarPage({ onAddSession }) {
  const { user }    = useAuth()
  const [events, setEvents]   = useState([])
  const [weekOff, setWeekOff] = useState(0)
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadEvents() }, [user])

  async function loadEvents() {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
    setEvents(data || [])
    setLoading(false)
  }

  async function deleteEvent(id) {
    await supabase.from('events').delete().eq('id', id)
    setEvents(ev => ev.filter(e => e.id !== id))
    setDetail(null)
  }

  const dates = getWeekDates(weekOff)
  const today = new Date()

  function evClass(type) {
    if (type === 'fixed')         return 'cal-event ev-fixed'
    if (type === 'personal-time') return 'cal-event ev-personal-time'
    if (type === 'travel')        return 'cal-event ev-travel'
    return 'cal-event ev-personal'
  }

  return (
    <>
      <div className="topbar">
        <button className="btn" onClick={() => setWeekOff(w => w - 1)}>←</button>
        <span style={{ fontWeight: 500, fontSize: 13 }}>
          {fmtDate(dates[0])} – {fmtDate(dates[6])}
        </span>
        <button className="btn" onClick={() => setWeekOff(w => w + 1)}>→</button>
        {weekOff !== 0 && (
          <button className="btn btn-sm" onClick={() => setWeekOff(0)}>Today</button>
        )}
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={onAddSession}>
          + Session
        </button>
      </div>

      <div className="page-content">
        {loading ? <div className="loading">Loading…</div> : (
          <div className="week-scroll">
            <div className="week-grid">
              {/* Header row */}
              <div className="corner" />
              {dates.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString() && weekOff === 0
                return (
                  <div key={i} className={`day-header${isToday ? ' today' : ''}`}>
                    <div className="dn">{DAYS[i]}</div>
                    <div className="dd">{d.getDate()}</div>
                  </div>
                )
              })}

              {/* Time rows */}
              {HOURS.map(h => (
                <>
                  <div key={`t-${h}`} className="time-cell">{fmtH(h)}</div>
                  {Array.from({ length: 7 }, (_, d) => {
                    const cellEvents = events.filter(ev =>
                      ev.day === d && Math.floor(ev.start_hour) === h
                    )
                    return (
                      <div key={`c-${h}-${d}`} className="day-cell">
                        {cellEvents.map(ev => (
                          <div
                            key={ev.id}
                            className={evClass(ev.type)}
                            style={{ height: ev.dur * 40 - 2 }}
                            onClick={() => setDetail(ev)}
                          >
                            <div>{ev.title}</div>
                            {ev.location && <div style={{ opacity: 0.75 }}>{ev.location}</div>}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </>
              ))}
            </div>
          </div>
        )}
      </div>

      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <h3>{detail.title}</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span className={`badge badge-${detail.type === 'fixed' ? 'purple' : detail.type === 'personal-time' ? 'coral' : detail.type === 'travel' ? 'amber' : 'teal'}`}>
              {detail.type === 'fixed' ? 'Group class' : detail.type === 'personal-time' ? 'Personal time' : detail.type === 'travel' ? 'Travel' : 'Personal training'}
            </span>
            {detail.location && <span className="badge badge-amber">{detail.location}</span>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            {DAYS[detail.day]} · {fmtH(detail.start_hour)} – {fmtH(detail.start_hour + detail.dur)} ({Math.round(detail.dur * 60)} min)
          </div>
          <div className="btn-row">
            {detail.type !== 'fixed' ? (
              <button className="btn btn-danger" onClick={() => deleteEvent(detail.id)}>Remove</button>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>Fixed class — cannot remove</span>
            )}
            <button className="btn" onClick={() => setDetail(null)}>Close</button>
          </div>
        </Modal>
      )}
    </>
  )
}
