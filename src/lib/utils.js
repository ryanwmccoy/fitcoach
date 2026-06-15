export const DAYS      = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
export const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
export const HOURS     = Array.from({ length: 14 }, (_, i) => i + 7)

export const COLORS = ['teal','purple','coral','amber']
export const COLOR_BG   = { teal:'#E1F5EE', purple:'#EEEDFE', coral:'#FAECE7', amber:'#FAEEDA' }
export const COLOR_TEXT = { teal:'#085041', purple:'#3C3489', coral:'#712B13', amber:'#633806' }

export const SMALL_GROUP_CAPACITY = 4

export const TYPE_LABEL = {
  fixed:           'Group class',
  personal:        'Personal training',
  'personal-time': 'Personal time',
  travel:          'Travel',
  'small-group':   'Small group',
}

export const TYPE_BADGE = {
  fixed:           'badge-purple',
  personal:        'badge-teal',
  'personal-time': 'badge-coral',
  travel:          'badge-amber',
  'small-group':   'badge-pink',
}

export function fmtH(h) {
  const hh = Math.floor(h)
  const mm = h % 1 === 0.5 ? '30' : '00'
  if (hh < 12) return `${hh}:${mm}am`
  if (hh === 12) return `12:${mm}pm`
  return `${hh - 12}:${mm}pm`
}

export function fmtDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getWeekDates(offset = 0) {
  const now = new Date()
  const dow = now.getDay()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - dow + i + offset * 7)
    return d
  })
}

export function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// Score an open slot (higher = better recommendation)
export function scoreSlot(h) {
  let score = 100
  if (h < 8 || h > 17) score -= 20
  if (h >= 12 && h < 13) score -= 10
  return score
}

// Find open 1:1 slots for a client given existing events
export function findSlots(events, locationTravelMin, dur) {
  const tb = (locationTravelMin || 0) / 60
  const slots = []
  for (let day = 1; day <= 5; day++) {
    for (let h = 7; h <= 20 - dur; h += 0.5) {
      const end = h + dur
      const bs = h - tb
      const be = end + tb
      const conflict = events.some(ev => {
        if (ev.day !== day) return false
        const ee   = ev.start_hour + ev.dur
        const ebs  = ev.start_hour - tb
        const ebe  = ee + tb
        return !(be <= ebs || bs >= ebe)
      })
      if (!conflict) slots.push({ day, h, dur, score: scoreSlot(h), tb })
    }
  }
  return slots.sort((a, b) => b.score - a.score)
}
