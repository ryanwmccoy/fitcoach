import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Modal from '../components/Modal'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const [locations, setLocations] = useState([])
  const [modal, setModal]         = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => { load() }, [user])

  async function load() {
    const { data } = await supabase.from('locations').select('*').eq('user_id', user.id).order('created_at')
    setLocations(data || [])
    setLoading(false)
  }

  async function addLocation(form) {
    const { data } = await supabase.from('locations').insert({ user_id: user.id, ...form }).select().single()
    setLocations(l => [...l, data])
    setModal(null)
  }

  async function deleteLocation(id) {
    await supabase.from('locations').delete().eq('id', id)
    setLocations(l => l.filter(x => x.id !== id))
  }

  return (
    <>
      <div className="topbar"><span style={{ fontWeight: 500 }}>Settings</span></div>
      <div className="page-content">
        {loading ? <div className="loading">Loading…</div> : (
          <div style={{ maxWidth: 480 }}>

            {/* Locations */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>Locations</div>
              <button className="btn btn-sm btn-primary" onClick={() => setModal('add-loc')}>+ Add</button>
            </div>
            {locations.map(loc => (
              <div key={loc.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{loc.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{loc.travel_min} min travel buffer</div>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => deleteLocation(loc.id)}>Remove</button>
              </div>
            ))}
            {!locations.length && <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 16 }}>No locations yet.</div>}

            <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 20, marginTop: 20 }}>
              <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 10 }}>Account</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>{user.email}</div>
              <button className="btn btn-danger" onClick={signOut}>Sign out</button>
            </div>
          </div>
        )}
      </div>

      {modal === 'add-loc' && (
        <AddLocationModal onSave={addLocation} onClose={() => setModal(null)} />
      )}
    </>
  )
}

function AddLocationModal({ onSave, onClose }) {
  const [name, setName]   = useState('')
  const [mins, setMins]   = useState(15)
  return (
    <Modal onClose={onClose}>
      <h3>Add location</h3>
      <div className="field"><label>Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Central Park" autoFocus /></div>
      <div className="field"><label>Travel time (minutes)</label><input type="number" value={mins} min={0} max={120} onChange={e => setMins(Number(e.target.value))} /></div>
      <div className="btn-row">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => name && onSave({ name, travel_min: mins })}>Add</button>
      </div>
    </Modal>
  )
}
