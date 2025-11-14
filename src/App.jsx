import { useEffect, useMemo, useState } from 'react'

const CATEGORIES = {
  church: { title: 'La Chiesa', subtitle: 'Informazioni e come arrivare' },
  venue: { title: 'La Location del Ricevimento', subtitle: 'Tenuta Leone – Villa per Eventi' },
  hairdresser: { title: 'Parrucchieri', subtitle: 'Consigliati a Montoro e dintorni' },
  barber: { title: 'Barbieri', subtitle: 'Consigliati a Montoro e dintorni' },
  hotel: { title: 'Hotel & B&B', subtitle: 'Dove alloggiare in zona' },
  restaurant: { title: 'Ristoranti & Pizzerie', subtitle: 'Dove mangiare in zona' },
  poi: { title: 'Punti di Interesse', subtitle: 'Cosa visitare nei dintorni' },
}

function getMapLink(address, mapsUrl) {
  if (mapsUrl && mapsUrl.trim().length > 0) return mapsUrl
  if (!address) return ''
  const q = encodeURIComponent(address)
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{title}</h2>
      {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
    </div>
  )
}

function PlaceCard({ place }) {
  const mapLink = getMapLink(place.address, place.maps_url)
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{place.name}</h3>
          {place.address && <p className="text-sm text-gray-600">{place.address}</p>}
          {place.description && <p className="mt-2 text-gray-700 text-sm">{place.description}</p>}
          <div className="flex flex-wrap gap-3 mt-3 text-sm">
            {place.phone && (
              <a href={`tel:${place.phone}`} className="text-blue-600 hover:underline">Chiama</a>
            )}
            {place.website && (
              <a href={place.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Sito web</a>
            )}
            {mapLink && (
              <a href={mapLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Come arrivare</a>
            )}
          </div>
        </div>
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {place.tags.map((t, i) => (
              <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AddPlaceForm({ category, onAdd }) {
  const [form, setForm] = useState({ name: '', address: '', description: '', phone: '', website: '', maps_url: '' })
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onAdd({ category, ...form })
      setForm({ name: '', address: '', description: '', phone: '', website: '', maps_url: '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-gray-200">
      <input name="name" value={form.name} onChange={handleChange} placeholder="Nome" required className="input" />
      <input name="address" value={form.address} onChange={handleChange} placeholder="Indirizzo" className="input" />
      <input name="phone" value={form.phone} onChange={handleChange} placeholder="Telefono" className="input" />
      <input name="website" value={form.website} onChange={handleChange} placeholder="Sito web (https://)" className="input" />
      <input name="maps_url" value={form.maps_url} onChange={handleChange} placeholder="Link Google Maps" className="input" />
      <input name="description" value={form.description} onChange={handleChange} placeholder="Descrizione" className="input sm:col-span-2" />
      <div className="sm:col-span-2 flex justify-end">
        <button disabled={saving} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-60">
          {saving ? 'Salvataggio...' : 'Aggiungi'}
        </button>
      </div>
    </form>
  )
}

function Section({ category, places, onAdd }) {
  const meta = CATEGORIES[category]
  return (
    <section className="py-10">
      <SectionHeader title={meta.title} subtitle={meta.subtitle} />
      <div className="space-y-3">
        {places.length === 0 && (
          <p className="text-gray-600">Ancora nessun elemento. Aggiungi un suggerimento qui sotto.</p>
        )}
        {places.map((p) => (
          <PlaceCard key={p.id} place={p} />
        ))}
      </div>
      {['hairdresser','barber','hotel','restaurant','poi'].includes(category) && (
        <AddPlaceForm category={category} onAdd={onAdd} />
      )}
    </section>
  )
}

export default function App() {
  const baseUrl = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])
  const heroImage = useMemo(() => import.meta.env.VITE_HERO_IMAGE_URL || '', [])
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [allPlaces, setAllPlaces] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [eRes, pRes] = await Promise.all([
          fetch(`${baseUrl}/api/event`),
          fetch(`${baseUrl}/api/places`),
        ])
        if (!eRes.ok) throw new Error('Errore caricamento evento')
        if (!pRes.ok) throw new Error('Errore caricamento luoghi')
        setEvent(await eRes.json())
        setAllPlaces(await pRes.json())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [baseUrl])

  const createPlace = async (payload) => {
    const res = await fetch(`${baseUrl}/api/places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Impossibile salvare')
    const created = await res.json()
    setAllPlaces((prev) => [...prev, created])
  }

  const byCat = (cat) => allPlaces.filter((p) => p.category === cat)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50">
        <p className="text-gray-700">Caricamento…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-rose-50">
        <div className="max-w-md text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <p className="mt-2 text-gray-600">Verifica la connessione al backend.</p>
        </div>
      </div>
    )
  }

  const churchInfo = {
    name: event?.church_name,
    address: event?.church_address,
    description: 'Luogo della cerimonia',
    maps_url: '',
    tags: ['Cerimonia']
  }
  const venueInfo = {
    name: event?.venue_name,
    address: event?.venue_address,
    description: 'Location del ricevimento',
    maps_url: '',
    tags: ['Ricevimento']
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section
        className={`relative overflow-hidden ${heroImage ? 'text-white' : ''}`}
        style={heroImage ? {
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {}}
      >
        {heroImage && (
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        )}
        <div className="relative max-w-6xl mx-auto px-6 py-16 sm:py-24 text-center bg-gradient-to-br from-rose-50/70 via-pink-50/70 to-amber-50/70">
          <h1 className={`text-4xl sm:text-6xl font-bold tracking-tight ${heroImage ? 'text-white drop-shadow' : 'text-gray-800' } mb-4`}>
            {event?.couple_names || 'Il nostro matrimonio'}
          </h1>
          <p className={`text-lg sm:text-2xl ${heroImage ? 'text-white/90 drop-shadow' : 'text-gray-700' }`}>
            10 maggio 2026 • Montoro (AV)
          </p>
          {event?.notes && <p className={`mt-6 max-w-2xl mx-auto ${heroImage ? 'text-white/90 drop-shadow' : 'text-gray-700' }`}>{event.notes}</p>}
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 pb-20">
        {/* Church */}
        <section className="py-10">
          <SectionHeader title={CATEGORIES.church.title} subtitle={CATEGORIES.church.subtitle} />
          <PlaceCard place={churchInfo} />
          <div className="mt-3">
            <a
              href={getMapLink(churchInfo.address, churchInfo.maps_url)}
              target="_blank" rel="noreferrer"
              className="inline-block text-blue-600 hover:underline"
            >
              Apri in Google Maps
            </a>
          </div>
        </section>

        {/* Venue */}
        <section className="py-10">
          <SectionHeader title={CATEGORIES.venue.title} subtitle={CATEGORIES.venue.subtitle} />
          <PlaceCard place={venueInfo} />
          <div className="mt-3">
            <a
              href={getMapLink(venueInfo.address, venueInfo.maps_url)}
              target="_blank" rel="noreferrer"
              className="inline-block text-blue-600 hover:underline"
            >
              Apri in Google Maps
            </a>
          </div>
        </section>

        {/* Hairdressers */}
        <Section category="hairdresser" places={byCat('hairdresser')} onAdd={createPlace} />
        {/* Barbers */}
        <Section category="barber" places={byCat('barber')} onAdd={createPlace} />
        {/* Hotels */}
        <Section category="hotel" places={byCat('hotel')} onAdd={createPlace} />
        {/* Restaurants */}
        <Section category="restaurant" places={byCat('restaurant')} onAdd={createPlace} />
        {/* POI */}
        <Section category="poi" places={byCat('poi')} onAdd={createPlace} />

        <div className="mt-16 text-center text-sm text-gray-500">
          Creato con amore per Brigitte & Salvatore • Personalizzabile in ogni sezione
        </div>
      </main>
    </div>
  )
}

// Tailwind-friendly input class
const style = document.createElement('style')
style.innerHTML = `.input{ @apply w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 }`
if (typeof document !== 'undefined') document.head.appendChild(style)
