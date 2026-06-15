import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DAYS, HOURS, TYPE_LABEL, TYPE_BADGE, SMALL_GROUP_CAPACITY, fmtH, fmtDate, getWeekDates } from '../lib/utils'
import Modal from '../components/Modal'
import SmallGroupModal from '../components/SmallGroupModal'

export default function CalendarPage({ onAddSession, refreshKey }) {
  const { user }    = useAuth()
  const [events, setEvents]     = useState([])
  const [members, setMembers]   = useState([])   // event_members joined with client name
  const [clients, setClients]   = useState([])
  const [weekOff, setWeekOff]   = useState(0)
  const [detail, setDetail]     = useState(null) // generic event detail
  const [groupDetail, setGroupDetail] = useState(null) // small-group event
  const [loading, setLoading]   = useState(true)

  useEffect(() => { loadAll() }, [user, refreshKey])

  async function loadAll() {
    setLoading(true)
    const [{ data: ev }, { data: mem }, { data: cl }] = await Promise.all([
      supabase.from('events').select('*').eq('user_id', user.id),
      supabase.from('event_members').select('id, event_id, client_id, clients(name)').eq('user_id', user.id),
      supabase.from('clients').select('id, name').eq('user_id', user.id).eq('archived', false).order('name'),
    ])
    setEvents(ev || [])
    setMembers((mem || []).map(m => ({ id: m.id, event_id: m.event_id, client_id: m.client_id, name: m.clients?.name || '—' })))
    setClients(cl || [])
    setLoading(false)
  }

  async function deleteEvent(id) {
    await supabase.from('events').delete().eq('id', id)
    setEvents(ev => ev.filter(e => e.id !== id))
    setDetail(null)
  }

  function refresh() { loadAll() }

  const dates = getWeekDates(weekOff)
  const today = new Date()

  function evClass(type) {
    if (type === 'fixed')         return 'cal-event ev-fixed'
    if (type === 'personal-time') return 'cal-event ev-personal-time'
    if (type === 'travel')        return 'cal-event ev-travel'
    if (type === 'small-group')   return 'cal-event ev-small-group'
    return 'cal-event ev-personal'
  }

  function membersFor(eventId) {
    return members.filter(m => m.event_id === eventId)
  }

  // small-group slots annotated with member counts (for the roster modal's "move" picker)
  const groupSlots = events
    .filter(e => e.type === 'small-group')
    .map(e => ({ ...e, memberCount: membersFor(e.id).length }))

  function openEvent(ev) {
    if (ev.type === 'small-group') setGroupDetail(ev)
    else setDetail(ev)
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
                        {cellEvents.map(ev => {
                          const roster = ev.type === 'small-group' ? membersFor(ev.id) : []
                          return (
                            <div
                              key={ev.id}
                              className={evClass(ev.type)}
                              style={{ height: ev.dur * 40 - 2 }}
                              onClick={() => openEvent(ev)}
                            >
                              <div>{ev.title}</div>
                              {ev.type === 'small-group' ? (
                                <div style={{ opacity: 0.75 }}>{roster.length}/{ev.capacity || SMALL_GROUP_CAPACITY} filled</div>
                              ) : ev.location && (
                                <div style={{ opacity: 0.75 }}>{ev.location}</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generic event detail */}
      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <h3>{detail.title}</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span className={`badge ${TYPE_BADGE[detail.type]}`}>{TYPE_LABEL[detail.type]}</span>
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

      {/* Small-group roster detail */}
      {groupDetail && (
        <SmallGroupModal
          event={groupDetail}
          members={membersFor(groupDetail.id)}
          allClients={clients}
          groupSlots={groupSlots}
          onClose={() => setGroupDetail(null)}
          onChange={refresh}
        />
      )}
    </>
  )
}
