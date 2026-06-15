import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DAYS, HOURS, fmtH, SMALL_GROUP_CAPACITY, GROUP_SIZE_OPTIONS } from '../lib/utils'
import Modal from './Modal'

export default function AddSessionModal({ onClose, onSaved }) {
  const { user }  = useAuth()
  const [clients, setClients]     = useState([])
  const [locations, setLocations] = useState([])
  const [sessionType, setSessionType] = useState('personal') // 'personal' | 'small-group' | 'personal-time'
  const [form, setForm] = useState({
    client_id: '',
    day: 1,
    start_hour: 9,
    dur: 1,
    location: '',
    title: '',
  })
  const [groupMembers, setGroupMembers] = useState([]) // client ids for small-group
  const [groupCapacity, setGroupCapacity] = useState(SMALL_GROUP_CAPACITY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id).eq('archived', false).order('name'),
      supabase.from('locations').select('*').eq('user_id', user.id),
    ]).then(([{ data: cl }, { data: lo }]) => {
      setClients(cl || [])
      setLocations(lo || [])
      if (lo?.length) set('location', lo[0].name)
    })
  }, [user])

  function toggleMember(id) {
    setGroupMembers(m => {
      if (m.includes(id)) return m.filter(x => x !== id)
      if (m.length >= groupCapacity) return m
      return [...m, id]
    })
  }

  function changeGroupCapacity(newCap) {
    setGroupCapacity(newCap)
    setGroupMembers(m => m.slice(0, newCap))
  }

  async function save() {
    if (sessionType === 'small-group') {
      const { data: ev, error } = await supabase.from('events').insert({
        user_id: user.id,
        type: 'small-group',
        title: form.title || 'Small group',
        day: Number(form.day),
        start_hour: Number(form.start_hour),
        dur: Number(form.dur),
        location: form.location,
        client_id: null,
        capacity: groupCapacity,
      }).select().single()
      if (error) return
      if (groupMembers.length) {
        await supabase.from('event_members').insert(
          groupMembers.map(client_id => ({ event_id: ev.id, client_id, user_id: user.id }))
        )
      }
      onSaved(ev)
      onClose()
      return
    }

    const isPersonal = sessionType === 'personal'
    const cl = isPersonal ? clients.find(c => c.id === form.client_id) : null
    if (isPersonal && !cl) return

    const row = {
      user_id: user.id,
      type: isPersonal ? 'personal' : 'personal-time',
      title: isPersonal ? cl.name : (form.title || 'Personal time'),
      day: Number(form.day),
      start_hour: Number(form.start_hour),
      dur: Number(form.dur),
      location: form.location,
      client_id: isPersonal ? form.client_id : null,
    }
    const { data, error } = await supabase.from('events').insert(row).select().single()
    if (!error) { onSaved(data); onClose() }
  }

  const quarterHours = HOURS.flatMap(h => [h, h + 0.25, h + 0.5, h + 0.75]).filter(h => h < 21)

  return (
    <Modal onClose={onClose}>
      <h3>Add session</h3>

      <div className="field">
        <label>Session type</label>
        <select value={sessionType} onChange={e => setSessionType(e.target.value)}>
          <option value="personal">Personal training (1 client)</option>
          <option value="small-group">Small group (4–6 clients)</option>
          <option value="personal-time">Personal time / blocked</option>
        </select>
      </div>

      {sessionType === 'personal' && (
        <div className="field">
          <label>Client</label>
          <select value={form.client_id} onChange={e => set('client_id', e.target.value)}>
            <option value="">— select —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {sessionType === 'small-group' && (
        <>
          <div className="field">
            <label>Slot name</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Small Group — Strength" />
          </div>
          <div className="field">
            <label>Group size</label>
            <select value={groupCapacity} onChange={e => changeGroupCapacity(Number(e.target.value))}>
              {GROUP_SIZE_OPTIONS.map(n => <option key={n} value={n}>Up to {n}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Roster ({groupMembers.length}/{groupCapacity}) — optional, can add later</label>
            <div className="checkbox-list">
              {clients.map(c => {
                const checked = groupMembers.includes(c.id)
                const disabled = !checked && groupMembers.length >= groupCapacity
                return (
                  <label key={c.id} className={`checkbox-row${disabled ? ' disabled' : ''}`}>
                    <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleMember(c.id)} />
                    {c.name}
                  </label>
                )
              })}
              {!clients.length && <div style={{ padding: 10, fontSize: 12, color: 'var(--text3)' }}>No clients yet.</div>}
            </div>
          </div>
        </>
      )}

      {sessionType === 'personal-time' && (
        <div className="field">
          <label>Label</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Rest day, Admin, Gym…" />
        </div>
      )}

      <div className="field">
        <label>Day</label>
        <select value={form.day} onChange={e => set('day', e.target.value)}>
          {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="field">
          <label>Start time</label>
          <select value={form.start_hour} onChange={e => set('start_hour', e.target.value)}>
            {quarterHours.map(h => <option key={h} value={h}>{fmtH(h)}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Duration</label>
          <select value={form.dur} onChange={e => set('dur', e.target.value)}>
            <option value={0.75}>45 min</option>
            <option value={1}>60 min</option>
            <option value={1.5}>90 min</option>
            <option value={2}>2 hours</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>Location</label>
        <select value={form.location} onChange={e => set('location', e.target.value)}>
          <option value="">—</option>
          {locations.map(l => <option key={l.id} value={l.name}>{l.name} ({l.travel_min}m travel)</option>)}
        </select>
      </div>
      <div className="btn-row">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save}
          disabled={sessionType === 'personal' && !form.client_id}>
          Add
        </button>
      </div>
    </Modal>
  )
}
