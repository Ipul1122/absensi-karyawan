import { useEffect, useRef } from 'react'
import L from 'leaflet'

interface AttendanceMapProps {
  lat: string
  lng: string
  title: string
}

export default function AttendanceMap({ lat, lng, title }: AttendanceMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    if (isNaN(latitude) || isNaN(longitude)) return

    // Fix default marker icon path issue in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const map = L.map(containerRef.current).setView([latitude, longitude], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(title)
      .openPopup()

    mapRef.current = map

    // Fix dimensions on render
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      clearTimeout(timer)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [lat, lng, title])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-[180px] rounded-xl border border-slate-800/80 overflow-hidden" 
    />
  )
}
