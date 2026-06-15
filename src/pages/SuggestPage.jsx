import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DAYS, fmtH, findSlots } from '../lib/utils'

export default function SuggestPage() {
  const { user }  = useAuth()
  const [clients, setClients]     = useState([])
  const [locations, setLocations] = useState([])
  const [events, setEvents]       = useState([])
  const [clientId, setClientId]   = useState('')
  const [dur, setDur]             = useState(1)
  const [loading, setLoading]     = useState(true)
  const [booking, setBooking]     = useState(null)

  useEffect(() => { load() }, [user])

  async function load() {
    setLoading(true)
    const [{ data: cl }, { data: lo }, { data: ev }] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id).eq('archived', false),
      supabase.from('locations').select('*').eq('user_id', user.id),
      supabase.from('events').select('*').eq('user_id', user.id),
    ])
    setClients(cl || [])
    setLocations(lo || [])
    setEvents(ev || [])
    setLoading(false)
  }

  async function book(slot) {
    setBooking(slot)
    const cl   = clients.find(c => c.id === clientId)
    const loc  = locations.find(l => l.name === cl.location_name)
    const rows = [{
      user_id: user.id,
      type: 'personal',
      title: cl.name,
      day: slot.day,
      start_hour: slot.h,
      dur: slot.dur,
      location: cl.location_name,
      client_id: cl.id,
    }]
    if (loc?.travel_min > 0) {
      rows.push({
        user_id: user.id,
        type: 'travel',
        title: 'Travel',
        day: slot.day,
        start_hour: slot.h - loc.travel_min / 60,
        dur: loc.travel_min / 60,
        location: '',
        client_id: null,
      })
    }
    const { data } = await supabase.from('events').insert(rows).select()
    setEvents(ev => [...ev, ...(data || [])])
    setBooking(null)
    setClientId('')
  }

  const cl        = clients.find(c => c.id === clientId)
  const loc       = cl ? locations.find(l => l.name === cl.location_name) : null
  const slots     = cl ? findSlots(events, loc?.travel_min || 0, dur) : []
  const top       = slots.slice(0, 5)

  const sessionCount = events.filter(e => e.type === 'personal').length
  const busyHours    = events.reduce((s, e) => s + e.dur, 0)
  const freeHours    = Math.round(Math.max(0, 14 * 7 - busyHours))

  return (
    <>
      <div className="topbar"><span style={{ fontWeight: 500 }}>Find a slot</span></div>
      <div className="page-content">
        {loading ? <div className="loading">Loading…</div> : (
          <div style={{ maxWidth: 520 }}>
            <div className="stat-grid">
              <div className="stat-card"><div className="val">{sessionCount}</div><div className="lbl">Sessions this week</div></div>
              <div className="stat-card"><div className="val">{freeHours}h</div><div className="lbl">Available hours</div></div>
            </div>

            <div className="field">
              <label>Client</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">— select —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Session length</label>
              <select value={dur} onChange={e => setDur(Number(e.target.value))}>
                <option value={1}>60 min</option>
                <option value={0.75}>45 min</option>
                <option value={1.5}>90 min</option>
              </select>
            </div>

            {cl && !top.length && (
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>No open slots found this week.</div>
            )}

            {cl && top.length > 0 && (
              <>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Top slots for {cl.name}</div>
                {top.map((s, i) => (
                  <div key={`${s.day}-${s.h}`} className={`slot-row${i === 0 ? ' best' : ''}`}>
                    <div className="slot-score">{s.score}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{DAYS[s.day]} · {fmtH(s.h)} – {fmtH(s.h + s.dur)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                        {cl.location_name || ''}
                        {s.tb > 0 && ` · ${Math.round(s.tb * 60)}m travel included`}
                      </div>
                      {i === 0 && <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 2 }}>Best fit</div>}
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={!!booking}
                      onClick={() => book(s)}
                    >
                      {booking === s ? 'Booking…' : 'Book'}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
