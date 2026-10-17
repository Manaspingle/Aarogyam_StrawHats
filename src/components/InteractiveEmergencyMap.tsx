import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, Badge, Button } from '@/components/ui';
import { MapPin, Navigation, Phone, AlertTriangle, Building2, Filter, Loader2 } from 'lucide-react';
import type { Hospital, EmergencyRequest } from '@/types';

interface EmergencyMapProps {
  hospitals: Hospital[];
  emergencies?: EmergencyRequest[];
  title?: string;
}

const KNOWN_COORDS: Record<string, [number, number]> = {
  mumbai: [19.076, 72.8777],
  pune: [18.5204, 73.8567],
  nagpur: [21.1458, 79.0882],
  nashik: [19.9975, 73.7898],
  aurangabad: [19.8762, 75.3433],
  thane: [19.2183, 72.9781],
};

// Fix default Leaflet icon paths in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export function InteractiveEmergencyMap({ hospitals, emergencies = [], title = 'Interactive Hospital & Emergency Map' }: EmergencyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersGroup = useRef<L.LayerGroup | null>(null);

  const [filter, setFilter] = useState<'all' | 'emergencies'>('all');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [19.076, 72.8777],
      zoom: 8,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    markersGroup.current = L.layerGroup().addTo(map);
    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!leafletMap.current || !markersGroup.current) return;

    markersGroup.current.clearLayers();

    const emergencyHospIds = new Set(
      emergencies.filter((e) => e.status === 'active').map((e) => e.requesting_hospital_id)
    );

    const displayHospitals = filter === 'emergencies'
      ? hospitals.filter((h) => emergencyHospIds.has(h.id))
      : hospitals;

    displayHospitals.forEach((hosp) => {
      const cityKey = (hosp.city || '').toLowerCase().trim();
      const coords = hosp.lat && hosp.lng
        ? [hosp.lat, hosp.lng] as [number, number]
        : (KNOWN_COORDS[cityKey] || [19.076, 72.8777]);

      const isEmergency = emergencyHospIds.has(hosp.id);

      const markerHtml = `
        <div style="
          background: ${isEmergency ? '#dc2626' : '#00605F'};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 14px;
          font-weight: bold;
        ">
          ${isEmergency ? '🚨' : '🏥'}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-hosp-marker',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(coords, { icon: customIcon });

      const popupContent = `
        <div style="font-family: inherit; padding: 4px; min-width: 200px;">
          <h4 style="margin: 0 0 4px; font-weight: 800; font-size: 14px; color: #00605F;">
            ${hosp.hospital_name || hosp.name || 'Medical Center'}
          </h4>
          <p style="margin: 0 0 6px; font-size: 11px; color: #64748b;">
            📍 ${hosp.address || hosp.city}
          </p>
          ${hosp.phone ? `<p style="margin: 0 0 6px; font-size: 11px; font-weight: bold; color: #dc2626;">📞 ${hosp.phone}</p>` : ''}
          ${isEmergency ? `<div style="background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; margin-bottom: 6px;">🚨 Active Emergency Request</div>` : ''}
          <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hosp.hospital_name || hosp.name || hosp.city)}" target="_blank" style="display: inline-block; background: #00605F; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: bold; text-decoration: none;">
            Get Directions ↗
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => setSelectedHospital(hosp));
      marker.addTo(markersGroup.current!);
    });

    if (displayHospitals.length > 0 && leafletMap.current) {
      const bounds = L.latLngBounds(
        displayHospitals.map((h) => {
          const cityKey = (h.city || '').toLowerCase().trim();
          return (h.lat && h.lng ? [h.lat, h.lng] : KNOWN_COORDS[cityKey] || [19.076, 72.8777]) as [number, number];
        })
      );
      leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [hospitals, emergencies, filter]);

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-teal" />
            {title}
          </h3>
          <p className="text-xs text-slate-500">
            Real-time GPS proximity of verified medical facilities across Maharashtra
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-brand-teal text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Hospitals ({hospitals.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('emergencies')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'emergencies'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            🚨 Active SOS ({emergencies.filter((e) => e.status === 'active').length})
          </button>
        </div>
      </div>

      <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
        <div ref={mapRef} className="h-full w-full z-10" />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-teal" /> Verified Hospital
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 ml-3" /> Critical Emergency Request Active
        </span>
        <span>Click any pin to view facility contacts and GPS directions</span>
      </div>
    </Card>
  );
}
