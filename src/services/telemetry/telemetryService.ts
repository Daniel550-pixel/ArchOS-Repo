import { useArchOSStore, SensorReading } from '../../store/archosStore';

export type { SensorReading };

const BASE_SENSORS: Omit<SensorReading, 'history'>[] = [
  { id: 'strain-162', label: 'Core Strain', value: 142.4, unit: 'MPa', status: 'nominal' },
  { id: 'accel-spire', label: 'Spire Acceleration', value: 0.012, unit: 'm/s²', status: 'nominal' },
  { id: 'hvac-ch3', label: 'Chiller ΔT', value: 4.8, unit: '°C', status: 'warning' },
  { id: 'energy-main', label: 'Power Draw', value: 8.4, unit: 'MW', status: 'nominal' },
  { id: 'carbon-op', label: 'Carbon Rate', value: 4120, unit: 't/yr', status: 'nominal' },
];

class TelemetryService {
  private interval: number | null = null;

  start() {
    if (this.interval) return;
    // Seed history buffer
    const sensors: SensorReading[] = BASE_SENSORS.map((s) => ({
      ...s,
      history: Array.from({ length: 20 }, () => +(s.value * (0.98 + Math.random() * 0.04)).toFixed(3)),
    }));
    useArchOSStore.getState().setSensors(sensors);

    this.interval = window.setInterval(() => {
      const current = useArchOSStore.getState().sensors;
      if (!current || current.length === 0) return;

      const next = current.map((s) => {
        const drift = s.value * (Math.random() - 0.5) * 0.03;
        const newValue = +(s.value + drift).toFixed(3);
        const history = [...s.history.slice(-19), newValue];
        const status: 'nominal' | 'warning' | 'critical' =
          s.id === 'hvac-ch3' && newValue > 4.5
            ? 'warning'
            : newValue > s.value * 1.08
            ? 'warning'
            : 'nominal';
        return { ...s, value: newValue, history, status };
      });
      useArchOSStore.getState().setSensors(next);
    }, 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const telemetryService = new TelemetryService();
