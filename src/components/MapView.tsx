import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass } from 'lucide-react';
import { formatDistance } from '../utils/geo';

interface MapViewProps {
  centerLat: number;
  centerLng: number;
  centerName: string;
  radiusMeters: number;
  userLat?: number | null;
  userLng?: number | null;
  userAccuracy?: number | null;
  distanceMeters?: number | null;
  isWithinRadius?: boolean;
  onRefreshLocation?: () => void;
  isLoadingLocation?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  centerLat,
  centerLng,
  centerName,
  radiusMeters = 50,
  userLat,
  userLng,
  userAccuracy,
  distanceMeters,
  isWithinRadius,
  onRefreshLocation,
  isLoadingLocation = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const officeCircleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix default marker icon assets for Leaflet in Vite
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 18,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    // Add CartoDB / OSM clean light tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Office custom icon
    const kumonOfficeIcon = L.divIcon({
      className: 'custom-kumon-office-marker',
      html: `
        <div style="
          background-color: #00A0E9;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0,160,233,0.45);
          border: 3px solid white;
          color: white;
          font-weight: bold;
          font-size: 11px;
        ">
          K
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const officeMarker = L.marker([centerLat, centerLng], { icon: kumonOfficeIcon }).addTo(map);
    officeMarker.bindPopup(`
      <div style="font-family: inherit; padding: 4px;">
        <strong style="color: #00A0E9; font-size: 13px;">${centerName}</strong>
        <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">Pusat Titik Presensi</p>
        <span style="display:inline-block; margin-top: 4px; font-size: 10px; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
          Radius Valid: ${radiusMeters} Meter
        </span>
      </div>
    `);

    // Geofence Circle (50m)
    const geofenceCircle = L.circle([centerLat, centerLng], {
      color: '#00A0E9',
      fillColor: '#00A0E9',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '4, 6',
      radius: radiusMeters,
    }).addTo(map);
    officeCircleRef.current = geofenceCircle;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [centerLat, centerLng, centerName, radiusMeters]);

  // Update user marker and accuracy
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLat && userLng) {
      const userPos: [number, number] = [userLat, userLng];

      // Custom User Pulsing Dot
      const userDotIcon = L.divIcon({
        className: 'user-gps-pulse-marker',
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="
              position: absolute;
              inset: 0;
              background-color: ${isWithinRadius ? '#10b981' : '#f59e0b'};
              border-radius: 50%;
              opacity: 0.5;
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              position: relative;
              width: 24px;
              height: 24px;
              background-color: ${isWithinRadius ? '#10b981' : '#f59e0b'};
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userPos);
        userMarkerRef.current.setIcon(userDotIcon);
      } else {
        userMarkerRef.current = L.marker(userPos, { icon: userDotIcon }).addTo(map);
        userMarkerRef.current.bindPopup(`
          <div style="font-family: inherit; font-size: 11px;">
            <strong>Posisi Anda Saat Ini</strong><br/>
            Jarak: ${distanceMeters !== undefined && distanceMeters !== null ? formatDistance(distanceMeters) : '-'}<br/>
            Status: ${isWithinRadius ? '✅ Dalam Radius' : '⚠️ Di Luar Radius'}
          </div>
        `);
      }

      // Accuracy circle
      if (userAccuracy && userAccuracy < 200) {
        if (userAccuracyCircleRef.current) {
          userAccuracyCircleRef.current.setLatLng(userPos);
          userAccuracyCircleRef.current.setRadius(userAccuracy);
        } else {
          userAccuracyCircleRef.current = L.circle(userPos, {
            color: isWithinRadius ? '#10b981' : '#f59e0b',
            fillColor: isWithinRadius ? '#10b981' : '#f59e0b',
            fillOpacity: 0.08,
            weight: 1,
            radius: userAccuracy,
          }).addTo(map);
        }
      }

      // Auto-fit bounds if both are visible
      const bounds = L.latLngBounds([[centerLat, centerLng], userPos]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
    }
  }, [userLat, userLng, userAccuracy, isWithinRadius, distanceMeters, centerLat, centerLng]);

  const recenterKumon = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([centerLat, centerLng], 18, { animate: true });
    }
  };

  const recenterUser = () => {
    if (mapInstanceRef.current && userLat && userLng) {
      mapInstanceRef.current.setView([userLat, userLng], 18, { animate: true });
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="h-64 sm:h-72 w-full z-0" />

      {/* Top Floating HUD Status Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md border border-slate-200/80 pointer-events-auto flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isWithinRadius ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-800 leading-tight">
              {isWithinRadius ? 'Dalam Radius Presensi' : 'Di Luar Radius 50m'}
            </span>
            <span className="text-[10px] text-slate-500">
              {distanceMeters !== null && distanceMeters !== undefined
                ? `Jarak ke Kumon: ${formatDistance(distanceMeters)}`
                : 'Mencari sinyal GPS...'}
            </span>
          </div>
        </div>

        {/* Refresh GPS Button */}
        {onRefreshLocation && (
          <button
            type="button"
            onClick={onRefreshLocation}
            disabled={isLoadingLocation}
            className="bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-md border border-slate-200 hover:bg-slate-50 active:scale-95 transition pointer-events-auto text-[#00A0E9] disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold px-3"
            title="Perbarui Koordinat GPS"
          >
            <Navigation className={`w-4 h-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Update GPS</span>
          </button>
        )}
      </div>

      {/* Bottom Floating Control Buttons */}
      <div className="absolute bottom-3 left-3 z-[400] flex gap-2">
        <button
          type="button"
          onClick={recenterKumon}
          className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow border border-slate-200 text-xs font-medium text-slate-700 hover:text-[#00A0E9] hover:bg-slate-50 transition flex items-center gap-1.5"
        >
          <MapPin className="w-3.5 h-3.5 text-[#00A0E9]" />
          <span>Titik Kumon</span>
        </button>

        {userLat && userLng && (
          <button
            type="button"
            onClick={recenterUser}
            className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow border border-slate-200 text-xs font-medium text-slate-700 hover:text-emerald-600 hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>Posisi Saya</span>
          </button>
        )}
      </div>
    </div>
  );
};
