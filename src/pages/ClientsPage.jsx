import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { COLORS, COLOR_BG, COLOR_TEXT, initials } from '../lib/utils'
import Modal from '../components/Modal'

export default function ClientsPage() {
  const { user } = useAuth()
  const [clients, setClients]       = useState([])
  const [locations, setLocations]   = useState([])
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null) // null | 'add' | {client}

  useEffect(() => { load() }, [user])

  async function load() {
    setLoading(true)
    const [{ data: cl }, { data: lo }] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('locations').select('*').eq('user_id', user.id),
    ])
    setClients(cl || [])
    setLocations(lo || [])
    setLoading(false)
  }

  async function saveClient(form) {
    const color = COLORS[clients.length % COLORS.length]
    const { data, error } = await supabase.from('clients').insert({
      user_id: user.id, ...form, color, archived: false
    }).select().single()
    if (!error) { setClients(c => [...c, data]); setModal(null) }
  }

  async function archiveClient(id, archived) {
    await supabase.from('clients').update({ archived }).eq('id', id)
    setClients(c => c.map(x => x.id === id ? { ...x, archived } : x))
    setModal(null)
  }

  async function deleteClient(id) {
    await supabase.from('clients').delete().eq('id', id)
    await supabase.from('events').delete().eq('client_id', id)
    setClients(c => c.filter(x => x.id !== id))
    setModal(null)
  }

  const visible = clients.filter(c => showArchived || !c.archived)

  return (
    <>
      <div className="topbar">
        <span style={{ fontWeight: 500 }}>Clients</span>
        <label style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', marginLeft: 8 }}>
          <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} style={{ width: 'auto' }} />
          Show archived
        </label>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setModal('add')}>
          + Add client
        </button>
      </div>

      <div className="page-content">
        {loading ? <div className="loading">Loading…</div> : (
          <>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
              {visible.length} {showArchived ? 'total' : 'active'} client{visible.length !== 1 ? 's' : ''}
            </div>
            {visible.map(cl => (
              <div key={cl.id} className="card card-clickable" onClick={() => setModal(cl)}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar" style={{ width: 36, height: 36, background: COLOR_BG[cl.color] || COLOR_BG.teal, color: COLOR_TEXT[cl.color] || COLOR_TEXT.teal }}>
                  {initials(cl.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {cl.name}
                    {cl.archived && <span className="badge badge-gray">archived</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{cl.sessions || '—'} · {cl.location_name || '—'}</div>
                </div>
              </div>
            ))}
            {!visible.length && <div style={{ color: 'var(--text3)', fontSize: 13 }}>No clients yet. Add one above.</div>}
          </>
        )}
      </div>

      {/* Add client modal */}
      {modal === 'add' && (
        <AddClientModal locations={locations} onSave={saveClient} onClose={() => setModal(null)} />
      )}

      {/* Client detail modal */}
      {modal && modal !== 'add' && (
        <ClientDetailModal
          client={modal}
          locations={locations}
          onArchive={v => archiveClient(modal.id, v)}
          onDelete={() => deleteClient(modal.id)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

function AddClientModal({ locations, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', phone: '', sessions: '', location_name: locations[0]?.name || '', notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <Modal onClose={onClose}>
      <h3>Add client</h3>
      <div className="field"><label>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" /></div>
      <div className="field"><label>Phone (optional)</label><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 202 555 0100" /></div>
      <div className="field"><label>Usual schedule</label><input value={form.sessions} onChange={e => set('sessions', e.target.value)} placeholder="e.g. Mon / Wed / Fri" /></div>
      <div className="field">
        <label>Primary location</label>
        <select value={form.location_name} onChange={e => set('location_name', e.target.value)}>
          {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
        </select>
      </div>
      <div className="field"><label>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Goals, preferences, injuries…" /></div>
      <div className="btn-row">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => form.name && onSave(form)}>Add client</button>
      </div>
    </Modal>
  )
}

function ClientDetailModal({ client: cl, locations, onArchive, onDelete, onClose }) {
  const [confirming, setConfirming] = useState(false)
  const loc = locations.find(l => l.name === cl.location_name)
  const bg  = COLOR_BG[cl.color]  || COLOR_BG.teal
  const fg  = COLOR_TEXT[cl.color] || COLOR_TEXT.teal
  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div className="avatar" style={{ width: 42, height: 42, background: bg, color: fg }}>{initials(cl.name)}</div>
        <div>
          <h3 style={{ marginBottom: 2 }}>{cl.name}</h3>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{cl.sessions || 'No schedule set'}</div>
        </div>
      </div>
      <table style={{ width: '100%', fontSize: 13, borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
        <tbody>
          <tr><td style={{ color: 'var(--text2)', padding: '4px 0' }}>Location</td><td style={{ textAlign: 'right' }}>{cl.location_name || '—'}</td></tr>
          <tr><td style={{ color: 'var(--text2)', padding: '4px 0' }}>Travel buffer</td><td style={{ textAlign: 'right' }}>{loc ? `${loc.travel_min} min` : '—'}</td></tr>
          {cl.phone && <tr><td style={{ color: 'var(--text2)', padding: '4px 0' }}>Phone</td><td style={{ textAlign: 'right' }}>{cl.phone}</td></tr>}
          {cl.notes && <tr><td style={{ color: 'var(--text2)', padding: '4px 0' }}>Notes</td><td style={{ textAlign: 'right', maxWidth: 200 }}>{cl.notes}</td></tr>}
        </tbody>
      </table>

      {confirming && (
        <div className="confirm-danger" style={{ marginTop: 14 }}>
          This will permanently delete {cl.name} and all their sessions. Cannot be undone.
        </div>
      )}

      <div className="btn-row">
        {!confirming ? (
          <>
            {!cl.archived
              ? <button className="btn btn-danger" onClick={() => onArchive(true)}>Archive</button>
              : <>
                  <button className="btn" onClick={() => onArchive(false)}>Restore</button>
                  <button className="btn btn-danger" onClick={() => setConfirming(true)}>Delete permanently</button>
                </>
            }
            <button className="btn" onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <button className="btn" onClick={() => setConfirming(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={onDelete}>Yes, delete</button>
          </>
        )}
      </div>
    </Modal>
  )
}
