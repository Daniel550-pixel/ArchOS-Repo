import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CloudSun,
  Wind,
  Droplets,
  Thermometer,
  Sun,
  Radio,
  Eye,
  ShieldCheck,
  Zap,
  Volume2,
  RefreshCw,
  Compass,
  Layers,
  AlertCircle
} from 'lucide-react';
import { speechService } from '../../services/voice/speechService';

export interface WeatherStation {
  id: string;
  emirate: string;
  location: string;
  temperatureC: number;
  humidityPct: number;
  windSpeedKmh: number;
  windDirection: string;
  uvIndex: number;
  airQualityIndex: number;
  pm25: number;
  dustVisibilityKm: number;
  cloudSeedingReadinessPct: number;
  condition: 'CLEAR' | 'DUST_HAZE' | 'DESERT_THERMAL' | 'SEA_BREEZE';
}

export const WEATHER_STATIONS: WeatherStation[] = [
  {
    id: 'dxb-downtown',
    emirate: 'Dubai',
    location: 'Downtown & Burj Khalifa',
    temperatureC: 38.4,
    humidityPct: 48,
    windSpeedKmh: 14,
    windDirection: 'NNW',
    uvIndex: 9,
    airQualityIndex: 28,
    pm25: 12.4,
    dustVisibilityKm: 10.0,
    cloudSeedingReadinessPct: 15,
    condition: 'CLEAR'
  },
  {
    id: 'auh-corniche',
    emirate: 'Abu Dhabi',
    location: 'Abu Dhabi Corniche & Saadiyat',
    temperatureC: 37.1,
    humidityPct: 54,
    windSpeedKmh: 18,
    windDirection: 'NW',
    uvIndex: 8,
    airQualityIndex: 22,
    pm25: 9.8,
    dustVisibilityKm: 10.0,
    cloudSeedingReadinessPct: 20,
    condition: 'SEA_BREEZE'
  },
  {
    id: 'rak-jais',
    emirate: 'Ras Al Khaimah',
    location: 'Jebel Jais Mountain Peak (1,934m)',
    temperatureC: 27.2,
    humidityPct: 32,
    windSpeedKmh: 28,
    windDirection: 'NE',
    uvIndex: 11,
    airQualityIndex: 14,
    pm25: 4.2,
    dustVisibilityKm: 12.0,
    cloudSeedingReadinessPct: 78,
    condition: 'DESERT_THERMAL'
  },
  {
    id: 'fuj-port',
    emirate: 'Fujairah',
    location: 'Gulf of Oman Maritime Bunkering Port',
    temperatureC: 34.8,
    humidityPct: 68,
    windSpeedKmh: 22,
    windDirection: 'E',
    uvIndex: 7,
    airQualityIndex: 30,
    pm25: 14.1,
    dustVisibilityKm: 9.5,
    cloudSeedingReadinessPct: 62,
    condition: 'SEA_BREEZE'
  },
  {
    id: 'shj-mleiha',
    emirate: 'Sharjah',
    location: 'Mleiha Desert Archaeological Biosphere',
    temperatureC: 41.2,
    humidityPct: 26,
    windSpeedKmh: 19,
    windDirection: 'SE',
    uvIndex: 10,
    airQualityIndex: 45,
    pm25: 22.0,
    dustVisibilityKm: 7.5,
    cloudSeedingReadinessPct: 35,
    condition: 'DUST_HAZE'
  }
];

export const AtmosphericWeatherRadarView: React.FC = () => {
  const [stations, setStations] = useState<WeatherStation[]>(WEATHER_STATIONS);
  const [selectedStationId, setSelectedStationId] = useState<string>('dxb-downtown');
  const [isCloudSeedingActive, setIsCloudSeedingActive] = useState(false);
  const [seedingToast, setSeedingToast] = useState<string | null>(null);

  const activeStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  const handleTriggerCloudSeeding = () => {
    setIsCloudSeedingActive(true);
    setSeedingToast('National Center of Meteorology (NCM) Cloud Seeding Aircraft Dispatched over Hajar Mountain Corridor.');
    speechService.speak('NCM cloud seeding operation triggered across Ras Al Khaimah and Fujairah convective cloud formations.');

    setTimeout(() => {
      setIsCloudSeedingActive(false);
      setSeedingToast('Seeding flare release complete. Projected precipitation index +18% over catchment reservoirs.');
      setTimeout(() => setSeedingToast(null), 5000);
    }, 2500);
  };

  return (
    <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden bg-[#03060d] select-none font-mono-tech">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#00e5ff]/20 bg-[#070c16]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/40 text-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <CloudSun className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#f5f4f0] uppercase tracking-wider">
                UAE ATMOSPHERIC & SANDSTORM RADAR
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40">
                NCM RADAR MATRIX
              </span>
            </div>
            <p className="text-[11px] text-[#8e8d88]">
              Doppler Precipitation Scan · PM2.5 Particulate Tracking · Cloud Seeding Aircraft Readiness
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerCloudSeeding}
            disabled={isCloudSeedingActive}
            className="px-3 py-1.5 rounded-xl bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#f59e0b] border border-[#f59e0b]/50 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Droplets className={`w-3.5 h-3.5 ${isCloudSeedingActive ? 'animate-bounce' : ''}`} />
            <span>DISPATCH NCM CLOUD SEEDING</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Station Selector (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-[#00e5ff]/30 backdrop-blur-xl shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                METEOROLOGICAL SENSORS
              </span>
              <span className="text-[10px] text-[#10b981] font-bold">5 STATIONS ONLINE</span>
            </div>

            <div className="flex flex-col gap-2">
              {stations.map((st) => {
                const isSelected = st.id === selectedStationId;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStationId(st.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-white shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                        : 'bg-[#091220] border-white/5 text-[#8e8d88] hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[200px]">
                        {st.location}
                      </span>
                      <span className="text-xs font-bold text-[#f59e0b]">{st.temperatureC}°C</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8e8d88]">
                      <span>Emirate: {st.emirate}</span>
                      <span className="text-[#10b981] font-bold">AQI {st.airQualityIndex} (Good)</span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-[#8e8d88] border-t border-white/5 pt-1">
                      <span>Wind: {st.windSpeedKmh} km/h ({st.windDirection})</span>
                      <span className="text-[#00e5ff] font-bold">Seeding Readiness: {st.cloudSeedingReadinessPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {seedingToast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-[#f59e0b]/15 border border-[#f59e0b]/50 text-[#f59e0b] text-xs font-bold flex items-center gap-2"
            >
              <Droplets size={16} />
              <span>{seedingToast}</span>
            </motion.div>
          )}
        </div>

        {/* Right Column: Selected Station Telemetry (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-5 rounded-2xl bg-[#060c18]/90 border border-[#f59e0b]/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#f59e0b]/20 pb-3">
              <div>
                <span className="text-[10px] text-[#f59e0b] font-bold uppercase tracking-wider">
                  ATMOSPHERIC STATION TELEMETRY
                </span>
                <h2 className="text-base font-bold text-[#f5f4f0]">{activeStation.location} ({activeStation.emirate})</h2>
              </div>
              <button
                onClick={() => {
                  speechService.speak(
                    `Weather telemetry for ${activeStation.location}. Temperature is ${activeStation.temperatureC} degrees Celsius. Humidity at ${activeStation.humidityPct} percent. Air Quality Index is ${activeStation.airQualityIndex}.`
                  );
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-[#f59e0b]/20 text-[#f59e0b] border border-white/10 transition-all cursor-pointer"
              >
                <Volume2 size={15} />
              </button>
            </div>

            {/* 6 High-Precision Sensor Readings */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <Thermometer className="w-4 h-4 text-[#f59e0b] mb-1" />
                <span className="text-[10px] text-[#8e8d88]">Temperature</span>
                <span className="text-lg font-bold text-[#f59e0b]">{activeStation.temperatureC}°C</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <Droplets className="w-4 h-4 text-[#00e5ff] mb-1" />
                <span className="text-[10px] text-[#8e8d88]">Relative Humidity</span>
                <span className="text-lg font-bold text-[#00e5ff]">{activeStation.humidityPct}%</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <Wind className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-[10px] text-[#8e8d88]">Wind Velocity</span>
                <span className="text-lg font-bold text-emerald-400">{activeStation.windSpeedKmh} km/h</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <Sun className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-[10px] text-[#8e8d88]">UV Solar Radiation</span>
                <span className="text-lg font-bold text-amber-400">UV {activeStation.uvIndex} (Extreme)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <Eye className="w-4 h-4 text-sky-400 mb-1" />
                <span className="text-[10px] text-[#8e8d88]">Optical Visibility</span>
                <span className="text-lg font-bold text-sky-400">{activeStation.dustVisibilityKm} km</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <Radio className="w-4 h-4 text-purple-400 mb-1" />
                <span className="text-[10px] text-[#8e8d88]">Particulate PM2.5</span>
                <span className="text-lg font-bold text-purple-400">{activeStation.pm25} µg/m³</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
