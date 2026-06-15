import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DAYS, fmtH, SMALL_GROUP_CAPACITY } from '../lib/utils'
import Modal from './Modal'

export default function SmallGroupModal({ event, members, allClients, groupSlots, onClose, onChange }) {
  const { user } = useAuth()
  const [adding, setAdding] = useState(false)
  const [addClientId, setAddClientId] = useState('')
  const [movingId, setMovingId] = useState(null)  // membership id currently picking a destination
  const [moveTarget, setMoveTarget] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const capacity = event.capacity || SMALL_GROUP_CAPACITY
  const rosterIds = members.map(m => m.client_id)
  const availableClients = allClients.filter(c => !rosterIds.includes(c.id))

  // other small-group slots with at least one open spot
  const otherSlots = groupSlots.filter(s => s.id !== event.id && s.memberCount < (s.capacity || SMALL_GROUP_CAPACITY))

  async function addMember() {
    if (!addClientId) return
    setBusy(true)
    await supabase.from('event_members').insert({ event_id: event.id, client_id: addClientId, user_id: user.id })
    setBusy(false)
    setAdding(false)
    setAddClientId('')
    onChange()
  }

  async function removeMember(membershipId) {
    setBusy(true)
    await supabase.from('event_members').delete().eq('id', membershipId)
    setBusy(false)
    onChange()
  }

  async function moveMember(membershipId, clientId) {
    if (!moveTarget) return
    setBusy(true)
    await supabase.from('event_members').delete().eq('id', membershipId)
    await supabase.from('event_members').insert({ event_id: moveTarget, client_id: clientId, user_id: user.id })
    setBusy(false)
    setMovingId(null)
    setMoveTarget('')
    onChange()
  }

  async function deleteSlot() {
    setBusy(true)
    await supabase.from('events').delete().eq('id', event.id)
    setBusy(false)
    onClose()
    onChange()
  }

  return (
    <Modal onClose={onClose}>
      <h3>{event.title}</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="badge badge-pink">Small group</span>
        {event.location && <span className="badge badge-amber">{event.location}</span>}
        <span className={`capacity-pill${members.length >= capacity ? ' full' : ''}`}>
          {members.length}/{capacity} filled
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
        {DAYS[event.day]} · {fmtH(event.start_hour)} – {fmtH(event.start_hour + event.dur)}
      </div>

      {/* Roster */}
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>Roster</div>
      {members.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--text3)', padding: '8px 0' }}>No clients assigned yet.</div>
      )}
      {members.map(m => (
        <div key={m.id} className="roster-row">
          <span className="roster-name">{m.name}</span>
          {movingId === m.id ? (
            <>
              <select value={moveTarget} onChange={e => setMoveTarget(e.target.value)} style={{ width: 'auto', fontSize: 12, padding: '4px 8px' }}>
                <option value="">Move to…</option>
                {otherSlots.map(s => (
                  <option key={s.id} value={s.id}>
                    {DAYS[s.day]} {fmtH(s.start_hour)} ({s.memberCount}/{s.capacity || SMALL_GROUP_CAPACITY})
                  </option>
                ))}
              </select>
              <button className="btn btn-sm btn-primary" disabled={!moveTarget || busy} onClick={() => moveMember(m.id, m.client_id)}>Move</button>
              <button className="btn btn-sm" onClick={() => { setMovingId(null); setMoveTarget('') }}>Cancel</button>
            </>
          ) : (
            <>
              {otherSlots.length > 0 && (
                <button className="btn btn-sm" disabled={busy} onClick={() => setMovingId(m.id)}>Move</button>
              )}
              <button className="btn btn-sm btn-danger" disabled={busy} onClick={() => removeMember(m.id)}>Remove</button>
            </>
          )}
        </div>
      ))}

      {/* Add member */}
      {members.length < capacity && (
        adding ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <select value={addClientId} onChange={e => setAddClientId(e.target.value)} style={{ flex: 1 }}>
              <option value="">— select client —</option>
              {availableClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn btn-sm btn-primary" disabled={!addClientId || busy} onClick={addMember}>Add</button>
            <button className="btn btn-sm" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => setAdding(true)}>+ Add client to slot</button>
        )
      )}

      {confirmDelete && (
        <div className="confirm-danger" style={{ marginTop: 14 }}>
          This will permanently delete this slot{members.length ? ` and remove ${members.length} client${members.length !== 1 ? 's' : ''} from it` : ''}. Cannot be undone.
        </div>
      )}

      <div className="btn-row">
        {!confirmDelete ? (
          <>
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Delete slot</button>
            <button className="btn" onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <button className="btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button className="btn btn-danger" disabled={busy} onClick={deleteSlot}>Yes, delete</button>
          </>
        )}
      </div>
    </Modal>
  )
}
