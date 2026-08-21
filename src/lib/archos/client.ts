const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export interface GroundScanLayer {
  id: string;
  type: string;
  name: string;
  confidence: number;
}

export async function fetchGroundScanLayers(locationId: string): Promise<GroundScanLayer[]> {
  try {
    const res = await fetch(`${API_BASE}/discover/layers/${locationId}`);
    if (!res.ok) {
      // Graceful fallback for offline / containerized development
      return [
        { id: 'layer-1', type: 'TERRAIN', name: 'Elevation Mesh', confidence: 0.98 },
        { id: 'layer-2', type: 'INFRASTRUCTURE', name: 'DEWA Power Grid', confidence: 0.95 },
        { id: 'layer-3', type: 'CONSTRAINTS', name: 'RTA Setback Zones', confidence: 1.0 },
      ];
    }
    return res.json();
  } catch (error) {
    console.warn('Backend connection fallback to local twin layers:', error);
    return [
      { id: 'layer-1', type: 'TERRAIN', name: 'Elevation Mesh', confidence: 0.98 },
      { id: 'layer-2', type: 'INFRASTRUCTURE', name: 'DEWA Power Grid', confidence: 0.95 },
      { id: 'layer-3', type: 'CONSTRAINTS', name: 'RTA Setback Zones', confidence: 1.0 },
    ];
  }
}
