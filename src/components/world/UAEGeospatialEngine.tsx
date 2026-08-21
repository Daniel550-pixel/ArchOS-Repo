import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Compass,
  Layers,
  MapPin,
  Eye,
  Maximize2,
  Navigation,
  Sun,
  Moon,
  Mountain,
  Globe,
  Camera,
  RotateCcw,
  Sparkles,
  Plane,
  Truck,
  Activity,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { LandmarkPOI, UAE_LANDMARKS } from './UAE3DWorldModel';

export type MapTileStyle = 'DARK_CYBER' | 'SATELLITE_3D' | 'TERRAIN_TOPO' | 'NIGHT_RADIANCE';

interface UAEGeospatialEngineProps {
  selectedLandmarkId: string;
  onSelectLandmark: (landmark: LandmarkPOI) => void;
  onOpenExperience: () => void;
}

export interface UAEGeoLocation {
  id: string;
  name: string;
  emirate: string;
  category: string;
  coords: [number, number]; // [lng, lat]
  zoom: number;
  pitch: number;
  bearing: number;
  description: string;
  elevationM: number;
}

export const UAE_GEO_LOCATIONS: UAEGeoLocation[] = [
  {
    id: 'burj-khalifa',
    name: 'Burj Khalifa & Downtown',
    emirate: 'Dubai',
    category: 'LANDMARK',
    coords: [55.2744, 25.1972],
    zoom: 15.8,
    pitch: 70,
    bearing: 42,
    description: 'Downtown Dubai central urban core, Burj Lake, and Dubai Mall.',
    elevationM: 828
  },
  {
    id: 'museum-of-future',
    name: 'Museum of the Future & DIFC',
    emirate: 'Dubai',
    category: 'INNOVATION',
    coords: [55.2818, 25.2253],
    zoom: 16.2,
    pitch: 65,
    bearing: 15,
    description: 'Sheikh Zayed Road financial corridor and biometric innovation hub.',
    elevationM: 77
  },
  {
    id: 'palm-jumeirah',
    name: 'Palm Jumeirah & Atlantis',
    emirate: 'Dubai',
    category: 'MARITIME',
    coords: [55.1172, 25.1124],
    zoom: 13.8,
    pitch: 62,
    bearing: 135,
    description: 'Artificial archipelago with fronds, crescent breakwaters, and maritime IoT sensors.',
    elevationM: 14
  },
  {
    id: 'dubai-marina',
    name: 'Dubai Marina & JBR',
    emirate: 'Dubai',
    category: 'DENSE_URBAN',
    coords: [55.1403, 25.0805],
    zoom: 15.2,
    pitch: 68,
    bearing: 55,
    description: 'Ultra-dense canal skyscraper district with smart transit water taxis.',
    elevationM: 45
  },
  {
    id: 'dp-world-jebel-ali',
    name: 'DP World Jebel Ali Port',
    emirate: 'Dubai',
    category: 'LOGISTICS_HUB',
    coords: [55.0272, 24.9857],
    zoom: 13.2,
    pitch: 58,
    bearing: 290,
    description: 'Flagship deepwater port, BoxBay automated high-bay terminal, and freezone.',
    elevationM: 8
  },
  {
    id: 'saadiyat-cultural',
    name: 'Saadiyat Island & Louvre Abu Dhabi',
    emirate: 'Abu Dhabi',
    category: 'CULTURAL',
    coords: [54.3986, 24.5338],
    zoom: 14.5,
    pitch: 55,
    bearing: 340,
    description: 'Abu Dhabi sovereign cultural district with Louvre, Guggenheim, and Zayed National Museum.',
    elevationM: 12
  },
  {
    id: 'abu-dhabi-corniche',
    name: 'Etihad Towers & Abu Dhabi Corniche',
    emirate: 'Abu Dhabi',
    category: 'GOVERNMENT',
    coords: [54.3217, 24.4589],
    zoom: 14.8,
    pitch: 64,
    bearing: 25,
    description: 'Federal capital government quarter, presidential palaces, and coastal corniche.',
    elevationM: 305
  },
  {
    id: 'jebel-jais',
    name: 'Jebel Jais Mountain Peak',
    emirate: 'Ras Al Khaimah',
    category: 'TERRAIN_ELEVATION',
    coords: [56.1519, 25.9525],
    zoom: 12.8,
    pitch: 74,
    bearing: 215,
    description: 'Highest peak in the UAE (1,934m) in the Hajar Mountain Range.',
    elevationM: 1934
  },
  {
    id: 'full-uae',
    name: 'Full UAE Sovereign Territory',
    emirate: 'All Emirates',
    category: 'OVERVIEW',
    coords: [54.8, 24.4],
    zoom: 7.6,
    pitch: 35,
    bearing: 0,
    description: 'Strategic view across all 7 Emirates: Abu Dhabi, Dubai, Sharjah, Ajman, UAQ, RAK, Fujairah.',
    elevationM: 0
  }
];

const MAP_STYLES: Record<MapTileStyle, { name: string; url: string; description: string; icon: any }> = {
  DARK_CYBER: {
    name: 'Cyber Obsidian 3D',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    description: 'High-contrast dark obsidian basemap with glowing neon vectors',
    icon: Moon
  },
  SATELLITE_3D: {
    name: 'Satellite Photoreal',
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    description: 'High-resolution satellite imagery with terrain texture overlay',
    icon: Globe
  },
  TERRAIN_TOPO: {
    name: 'Topographic Hajar DEM',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    description: 'Digital Elevation Model showcasing UAE mountain topography and coastlines',
    icon: Mountain
  },
  NIGHT_RADIANCE: {
    name: 'Night Radiance',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    description: 'Urban nighttime light luminescence and energy grid consumption',
    icon: Sun
  }
};

export const UAEGeospatialEngine: React.FC<UAEGeospatialEngineProps> = ({
  selectedLandmarkId,
  onSelectLandmark,
  onOpenExperience
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [currentStyle, setCurrentStyle] = useState<MapTileStyle>('DARK_CYBER');
  const [activeLocation, setActiveLocation] = useState<UAEGeoLocation>(UAE_GEO_LOCATIONS[0]);
  const [isRotating, setIsRotating] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(70);
  const [currentBearing, setCurrentBearing] = useState(42);
  const [currentZoom, setCurrentZoom] = useState(15.8);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize MapLibre GL 3D Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[currentStyle].url,
      center: activeLocation.coords,
      zoom: activeLocation.zoom,
      pitch: activeLocation.pitch,
      bearing: activeLocation.bearing,
      maxPitch: 85
    });

    map.on('load', () => {
      // Add 3D Extruded Buildings Layer if vector source available
      try {
        const layers = map.getStyle().layers;
        let labelLayerId = '';
        if (layers) {
          for (let i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout && (layers[i].layout as any)['text-field']) {
              labelLayerId = layers[i].id;
              break;
            }
          }
        }

        // Add 3D Building Footprints
        if (!map.getLayer('3d-buildings')) {
          map.addLayer(
            {
              id: '3d-buildings',
              source: 'carto',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 13,
              paint: {
                'fill-extrusion-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'height'],
                  0,
                  '#071626',
                  50,
                  '#0b2b48',
                  150,
                  '#00e5ff',
                  300,
                  '#38bdf8'
                ],
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  13,
                  0,
                  13.05,
                  ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  13,
                  0,
                  13.05,
                  ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.85
              }
            },
            labelLayerId || undefined
          );
        }

        // Sheikh Zayed Road & Metro Line 3D Ribbon
        if (!map.getSource('szr-corridor')) {
          map.addSource('szr-corridor', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: { name: 'Sheikh Zayed Road E11' },
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      [55.12, 25.06],
                      [55.18, 25.12],
                      [55.24, 25.17],
                      [55.2744, 25.1972],
                      [55.2818, 25.2253],
                      [55.33, 25.26],
                      [55.39, 25.31]
                    ]
                  }
                },
                {
                  type: 'Feature',
                  properties: { name: 'Dubai Metro Red/Blue Line' },
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      [55.118, 25.061],
                      [55.178, 25.121],
                      [55.238, 25.171],
                      [55.272, 25.198],
                      [55.280, 25.226],
                      [55.328, 25.261],
                      [55.388, 25.311]
                    ]
                  }
                }
              ]
            }
          });

          map.addLayer({
            id: 'szr-line-glow',
            type: 'line',
            source: 'szr-corridor',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#00e5ff',
              'line-width': 4,
              'line-opacity': 0.85
            }
          });

          map.addLayer({
            id: 'metro-line-dash',
            type: 'line',
            source: 'szr-corridor',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#f59e0b',
              'line-width': 2.5,
              'line-dasharray': [2, 2],
              'line-opacity': 0.95
            }
          });
        }
      } catch (err) {
        console.warn('Geospatial 3D vector layer note:', err);
      }
    });

    // Update real-time camera stats
    map.on('rotate', () => {
      setCurrentBearing(Math.round(map.getBearing()));
      setCurrentPitch(Math.round(map.getPitch()));
    });
    map.on('pitch', () => {
      setCurrentPitch(Math.round(map.getPitch()));
    });
    map.on('zoom', () => {
      setCurrentZoom(parseFloat(map.getZoom().toFixed(1)));
    });

    // Add Interactive 3D HTML Markers for UAE Locations
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    UAE_GEO_LOCATIONS.forEach((loc) => {
      const el = document.createElement('div');
      el.className = 'custom-3d-marker';
      el.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(6, 12, 24, 0.92);
          border: 1px solid #00e5ff;
          border-radius: 20px;
          color: #00e5ff;
          font-family: monospace;
          font-size: 10px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.4);
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        ">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #00e5ff; display: inline-block;"></span>
          <span>${loc.name}</span>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        flyToLocation(loc);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(loc.coords)
        .addTo(map);

      markersRef.current.push(marker);
    });

    mapRef.current = map;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      map.remove();
    };
  }, [currentStyle]);

  // Smooth Fly-To function
  const flyToLocation = (loc: UAEGeoLocation) => {
    setActiveLocation(loc);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: loc.coords,
        zoom: loc.zoom,
        pitch: loc.pitch,
        bearing: loc.bearing,
        speed: 1.2,
        curve: 1.4,
        essential: true
      });
    }

    // Match with landmark POI if existing
    const matched = UAE_LANDMARKS.find((lm) => lm.id === loc.id);
    if (matched) {
      onSelectLandmark(matched);
    }
  };

  // 360 Continuous Orbital Rotation
  useEffect(() => {
    if (!isRotating || !mapRef.current) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const rotateCamera = () => {
      if (mapRef.current) {
        const currentB = mapRef.current.getBearing();
        mapRef.current.setBearing((currentB + 0.25) % 360);
      }
      animationFrameRef.current = requestAnimationFrame(rotateCamera);
    };

    animationFrameRef.current = requestAnimationFrame(rotateCamera);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRotating]);

  return (
    <div className="relative w-full h-full bg-[#03060d] overflow-hidden select-none font-mono-tech flex">
      {/* MAPLIBRE GL CONTAINER */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* TOP LEFT GEOSPATIAL TELEMETRY HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto max-w-sm">
        {/* Main Location Status Badge */}
        <div className="p-3 rounded-xl bg-[#060c18]/90 border border-[#00e5ff]/40 backdrop-blur-xl shadow-2xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#00e5ff] animate-spin" style={{ animationDuration: '12s' }} />
              <span className="font-bold text-xs text-[#f5f4f0] uppercase tracking-wider">
                3D GEOSPATIAL ENGINE
              </span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold border border-[#10b981]/30">
              MAPLIBRE 3D GIS
            </span>
          </div>

          <div className="text-sm font-bold text-[#00e5ff] flex items-center gap-1.5">
            <MapPin size={14} />
            <span>{activeLocation.name}</span>
          </div>

          <p className="text-[10px] text-[#8e8d88] leading-tight">
            {activeLocation.description}
          </p>

          <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-white/10 text-[9px]">
            <div className="bg-white/5 p-1 rounded">
              <span className="text-[#8e8d88]">Elevation:</span>
              <div className="font-bold text-white">+{activeLocation.elevationM}m</div>
            </div>
            <div className="bg-white/5 p-1 rounded">
              <span className="text-[#8e8d88]">Pitch / Tilt:</span>
              <div className="font-bold text-[#00e5ff]">{currentPitch}°</div>
            </div>
            <div className="bg-white/5 p-1 rounded">
              <span className="text-[#8e8d88]">Azimuth:</span>
              <div className="font-bold text-[#f59e0b]">{currentBearing}°</div>
            </div>
          </div>
        </div>

        {/* Quick UAE Destination Targets */}
        <div className="p-2 rounded-xl bg-[#060c18]/85 border border-white/10 backdrop-blur-xl flex flex-col gap-1 shadow-xl">
          <span className="text-[9px] text-[#8e8d88] font-bold uppercase tracking-wider px-1">
            GEOSPATIAL FLYTO TARGETS
          </span>
          <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto custom-scrollbar pr-0.5">
            {UAE_GEO_LOCATIONS.map((loc) => {
              const isSelected = activeLocation.id === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => flyToLocation(loc)}
                  className={`p-1.5 rounded text-[9px] font-semibold text-left transition-all truncate border ${
                    isSelected
                      ? 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]'
                      : 'bg-[#091220] text-[#8e8d88] border-white/5 hover:text-white hover:border-white/20'
                  }`}
                >
                  {loc.name.split('&')[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TOP RIGHT MAP STYLE SHADER SWITCHER */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="p-2.5 rounded-xl bg-[#060c18]/90 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-1.5">
          <span className="text-[9px] text-[#8e8d88] font-bold uppercase tracking-wider">
            GIS TILE SHADER
          </span>
          <div className="flex flex-col gap-1">
            {(Object.keys(MAP_STYLES) as MapTileStyle[]).map((key) => {
              const style = MAP_STYLES[key];
              const Icon = style.icon;
              const isSelected = currentStyle === key;
              return (
                <button
                  key={key}
                  onClick={() => setCurrentStyle(key)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                    isSelected
                      ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                      : 'bg-[#091220] border-white/5 text-[#8e8d88] hover:text-white hover:border-white/20'
                  }`}
                >
                  <Icon size={12} />
                  <span>{style.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orbit Camera Rotation & Pitch Controls */}
        <div className="p-2 rounded-xl bg-[#060c18]/90 border border-white/10 backdrop-blur-xl shadow-xl flex items-center justify-between gap-1.5">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`flex-1 py-1 px-2 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
              isRotating
                ? 'bg-[#ec4899]/20 border-[#ec4899] text-[#ec4899] shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                : 'bg-[#091220] border-white/10 text-[#8e8d88] hover:text-white'
            }`}
          >
            <RotateCcw size={12} className={isRotating ? 'animate-spin' : ''} />
            <span>{isRotating ? 'STOP ORBIT' : '360° ORBIT'}</span>
          </button>

          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.easeTo({ pitch: 75, bearing: 45 });
              }
            }}
            className="p-1.5 rounded bg-[#091220] border border-white/10 text-[#8e8d88] hover:text-[#00e5ff]"
            title="Max 3D Perspective Tilt"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* BOTTOM CENTER ACTION BAR */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#060c18]/95 border border-[#00e5ff]/40 px-4 py-2 rounded-2xl backdrop-blur-xl shadow-2xl pointer-events-auto">
        <div className="flex items-center gap-2 text-xs font-bold text-[#00e5ff]">
          <Sparkles size={14} />
          <span>UAE 3D TWIN ACTIVE</span>
        </div>

        <div className="h-4 w-px bg-white/20" />

        <span className="text-[11px] text-[#8e8d88]">
          Zoom: <strong className="text-zinc-200">{currentZoom}x</strong>
        </span>

        <button
          onClick={onOpenExperience}
          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#00e5ff] to-[#10b981] text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer hover:scale-105 transition-all"
        >
          <span>INSPECT 3D BIM MODEL</span>
          <Eye size={13} />
        </button>
      </div>
    </div>
  );
};
