import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DAYS, HOURS, fmtH } from '../lib/utils'
import Modal from './Modal'

export default function AddSessionModal({ onClose, onSaved }) {
  const { user }  = useAuth()
  const [clients, setClients]     = useState([])
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState({
    client_id: '',
    day: 1,
    start_hour: 9,
    dur: 1,
    location: '',
    title: '',
    type: 'personal',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id).eq('archived', false),
      supabase.from('locations').select('*').eq('user_id', user.id),
    ]).then(([{ data: cl }, { data: lo }]) => {
      setClients(cl || [])
      setLocations(lo || [])
      if (lo?.length) set('location', lo[0].name)
    })
  }, [user])

  async function save() {
    const cl = clients.find(c => c.id === form.client_id)
    const isPersonalTime = !form.client_id
    const row = {
      user_id: user.id,
      type: isPersonalTime ? 'personal-time' : 'personal',
      title: isPersonalTime ? (form.title || 'Personal time') : cl.name,
      day: Number(form.day),
      start_hour: Number(form.start_hour),
      dur: Number(form.dur),
      location: form.location,
      client_id: form.client_id || null,
    }
    const { data, error } = await supabase.from('events').insert(row).select().single()
    if (!error) { onSaved(data); onClose() }
  }

  const halfHours = HOURS.flatMap(h => [h, h + 0.5]).filter(h => h < 21)

  return (
    <Modal onClose={onClose}>
      <h3>Add session</h3>
      <div className="field">
        <label>Client (blank = personal time)</label>
        <select value={form.client_id} onChange={e => set('client_id', e.target.value)}>
          <option value="">Personal time</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {!form.client_id && (
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
            {halfHours.map(h => <option key={h} value={h}>{fmtH(h)}</option>)}
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
        <button className="btn btn-primary" onClick={save}>Add</button>
      </div>
    </Modal>
  )
}
