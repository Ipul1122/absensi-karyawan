import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import { Loader2, MapPin } from 'lucide-react'

interface LokasiKantorProps {
  officeLatitude: string
  setOfficeLatitude: (v: string) => void
  officeLongitude: string
  setOfficeLongitude: (v: string) => void
  officeRadius: number
  setOfficeRadius: (v: number) => void
  savingOffice: boolean
  handleOfficeSettingSubmit: (e: React.FormEvent) => void
}

export default function LokasiKantor({
  officeLatitude,
  setOfficeLatitude,
  officeLongitude,
  setOfficeLongitude,
  officeRadius,
  setOfficeRadius,
  savingOffice,
  handleOfficeSettingSubmit,
}: LokasiKantorProps) {
  const configMapRef = useRef<HTMLDivElement | null>(null)
  const configMapInstance = useRef<L.Map | null>(null)
  const configMarkerRef = useRef<L.Marker | null>(null)
  const configCircleRef = useRef<L.Circle | null>(null)

  // Initialize and update Office Settings Config Map
  useEffect(() => {
    if (!configMapRef.current) return

    const lat = parseFloat(officeLatitude)
    const lng = parseFloat(officeLongitude)
    if (isNaN(lat) || isNaN(lng)) return

    // Fix default marker icon path issue in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    // Setup map instance if not exists
    if (!configMapInstance.current) {
      const map = L.map(configMapRef.current).setView([lat, lng], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map)

      configMapInstance.current = map

      // Map click handler to relocate office
      map.on('click', (e) => {
        setOfficeLatitude(e.latlng.lat.toFixed(6))
        setOfficeLongitude(e.latlng.lng.toFixed(6))
      })
    }

    const map = configMapInstance.current

    // Update/Create config marker
    if (configMarkerRef.current) {
      configMarkerRef.current.setLatLng([lat, lng])
    } else {
      configMarkerRef.current = L.marker([lat, lng], { draggable: true })
        .addTo(map)
        .bindPopup('Lokasi Kantor (Seret pin atau klik peta untuk memindahkan)')
        .openPopup()

      configMarkerRef.current.on('dragend', (e) => {
        const latLng = e.target.getLatLng()
        setOfficeLatitude(latLng.lat.toFixed(6))
        setOfficeLongitude(latLng.lng.toFixed(6))
      })
    }

    // Update/Create config radius circle
    if (configCircleRef.current) {
      configCircleRef.current.setLatLng([lat, lng])
      configCircleRef.current.setRadius(officeRadius)
    } else {
      configCircleRef.current = L.circle([lat, lng], {
        color: '#6366f1',
        fillColor: '#818cf8',
        fillOpacity: 0.15,
        radius: officeRadius
      }).addTo(map)
    }

    map.setView([lat, lng])

    // Workaround to draw Leaflet correctly on render
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      clearTimeout(timer)
    }
  }, [officeLatitude, officeLongitude, officeRadius])

  // Cleanup config map on unmount
  useEffect(() => {
    return () => {
      if (configMapInstance.current) {
        configMapInstance.current.remove()
        configMapInstance.current = null
        configMarkerRef.current = null
        configCircleRef.current = null
      }
    }
  }, [])

  return (
    <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6 animate-fade-in">
      <div className="border-b border-slate-800/60 pb-3">
        <h3 className="text-lg font-bold text-slate-200 font-quicksand">Konfigurasi Lokasi Absensi Kantor</h3>
        <p className="text-xs text-slate-400 font-quicksand mt-1">
          Tentukan koordinat pusat lokasi kantor Anda dan radius jangkauan absensi bagi karyawan (dalam meter).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Config */}
        <div className="lg:col-span-4 space-y-4">
          <form onSubmit={handleOfficeSettingSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">
                Latitude Kantor
              </label>
              <input
                type="text"
                required
                placeholder="-6.2088"
                value={officeLatitude}
                onChange={(e) => setOfficeLatitude(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">
                Longitude Kantor
              </label>
              <input
                type="text"
                required
                placeholder="106.8456"
                value={officeLongitude}
                onChange={(e) => setOfficeLongitude(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">
                Radius Jangkauan (Meter)
              </label>
              <input
                type="number"
                required
                min="5"
                max="10000"
                placeholder="100"
                value={officeRadius}
                onChange={(e) => setOfficeRadius(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingOffice}
                className="w-full px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {savingOffice ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Lokasi & Radius'
                )}
              </button>
            </div>
          </form>

          <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-2 text-[11px] text-slate-400 leading-normal">
            <p className="font-bold text-indigo-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Petunjuk Penggunaan Peta:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Klik di bagian mana pun pada peta untuk memindahkan lokasi pin kantor secara instan.</li>
              <li>Or, seret (drag) pin untuk menyempurnakan posisi koordinat.</li>
              <li>Sesuaikan jangkauan radius dengan memasukkan nilai meter (misal: 100).</li>
            </ul>
          </div>
        </div>

        {/* Map Config View */}
        <div className="lg:col-span-8 space-y-2">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-quicksand">
            Visualisasi Peta Lokasi Kantor & Radius Batas Absen
          </label>
          <div className="relative w-full h-[400px] rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div 
              ref={configMapRef} 
              id="office-map-config" 
              className="w-full h-full z-10" 
            />
          </div>
        </div>
      </div>
    </section>
  )
}
