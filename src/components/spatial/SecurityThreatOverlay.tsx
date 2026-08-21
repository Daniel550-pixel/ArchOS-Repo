import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Shield, AlertTriangle, Radio, Navigation, Anchor, Plane, Train, Eye, X, Activity, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ThreatNode {
  id: string;
  name: string;
  category: 'MARITIME_CHOKEPOINT' | 'ENERGY_CORRIDOR' | 'CROSS_BORDER_FREIGHT' | 'AIR_CARGO_ARTERY' | 'DEFENSE_PERIMETER';
  x: number; // 0 to 1000 SVG coordinates
  y: number; // 0 to 650 SVG coordinates
  threatLevel: 'NOMINAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  vesselCount: number;
  flowVolume: string; // e.g. "4.2M TEU/yr" or "18.5M bpd"
  status: string;
  patrolAssets: string;
  riskScore: number; // 0 to 100
  recentActivity: string;
  coordinates: string;
}

export interface LogisticsLink {
  id: string;
  sourceId: string;
  targetId: string;
  mode: 'MARITIME' | 'RAIL_FREIGHT' | 'AIR' | 'ENERGY_PIPELINE';
  status: 'ACTIVE' | 'CONGESTED' | 'HIGH_SURVEILLANCE';
  capacityUtilization: number; // 0 to 100%
  speedKnots?: number;
}

export interface SecurityZone {
  id: string;
  name: string;
  type: 'RADAR_CONE' | 'NAVAL_EXCLUSION' | 'CUSTOMS_BUFFER';
  center: [number, number];
  radius: number;
  threatScore: number;
  status: string;
}

const THREAT_NODES: ThreatNode[] = [
  {
    id: 'hormuz-strait',
    name: 'Strait of Hormuz Chokepoint',
    category: 'MARITIME_CHOKEPOINT',
    x: 740,
    y: 90,
    threatLevel: 'ELEVATED',
    vesselCount: 142,
    flowVolume: '20.5M bpd Oil Flow',
    status: 'High Electronic Surveillance Active',
    patrolAssets: 'UAE Coast Guard & Combined Maritime Task Force 152',
    riskScore: 42,
    recentActivity: 'Naval escort protocol active for ULCC crude carriers.',
    coordinates: '26°34′N 56°15′E'
  },
  {
    id: 'jebel-ali-port',
    name: 'Jebel Ali Megaport Logistics Node',
    category: 'CROSS_BORDER_FREIGHT',
    x: 430,
    y: 430,
    threatLevel: 'NOMINAL',
    vesselCount: 78,
    flowVolume: '14.8M TEU Transshipment',
    status: 'Automated Cyber-Inspection Clearance Active',
    patrolAssets: 'Dubai Customs Smart Gate Radar & Maritime Security Command',
    riskScore: 12,
    recentActivity: 'Container throughput operating at 98.4% efficiency.',
    coordinates: '25°00′N 55°03′E'
  },
  {
    id: 'fujairah-bunker',
    name: 'Fujairah Strategic Offshore Anchorage',
    category: 'ENERGY_CORRIDOR',
    x: 820,
    y: 280,
    threatLevel: 'NOMINAL',
    vesselCount: 116,
    flowVolume: 'Second Largest Global Bunkering Hub',
    status: 'ADCOP Pipeline Direct Crude Bypass Operational',
    patrolAssets: 'Fujairah Port Maritime Patrol & Eastern Defense Command',
    riskScore: 18,
    recentActivity: 'VLCC loading directly via Gulf of Oman deepwater SPM berths.',
    coordinates: '25°10′N 56°21′E'
  },
  {
    id: 'khalifa-port',
    name: 'Khalifa Port Multi-Modal Terminal',
    category: 'CROSS_BORDER_FREIGHT',
    x: 290,
    y: 560,
    threatLevel: 'NOMINAL',
    vesselCount: 45,
    flowVolume: '8.2M TEU Automated Capacity',
    status: 'Etihad Rail Stage 2 Trackside Terminal Synchronized',
    patrolAssets: 'Abu Dhabi Critical Infrastructure & Coastal Authority',
    riskScore: 14,
    recentActivity: 'Direct rail freight dispatched to Saudi border terminal.',
    coordinates: '24°48′N 54°40′E'
  },
  {
    id: 'dwc-al-maktoum',
    name: 'DWC Al Maktoum Global Air Corridor',
    category: 'AIR_CARGO_ARTERY',
    x: 460,
    y: 480,
    threatLevel: 'NOMINAL',
    vesselCount: 64, // flights
    flowVolume: '3.1M Tonnes Air Cargo/yr',
    status: 'Intercontinental Sky Corridor Green',
    patrolAssets: 'UAE Air Defense Early Warning Command',
    riskScore: 8,
    recentActivity: 'Multi-modal sea-to-air bonded transit clearance in under 3 hours.',
    coordinates: '24°53′N 55°10′E'
  },
  {
    id: 'ghuweifat-border',
    name: 'Ghuweifat Land Freight Port',
    category: 'CROSS_BORDER_FREIGHT',
    x: 120,
    y: 600,
    threatLevel: 'NOMINAL',
    vesselCount: 380, // trucks/day
    flowVolume: 'GCC Cross-Border Land Logistics',
    status: 'Customs e-Pass Interoperability Synchronized',
    patrolAssets: 'Federal Authority for Identity, Citizenship & Port Security',
    riskScore: 22,
    recentActivity: 'Heavy freight customs clearance queue at 4.2 mins average.',
    coordinates: '24°07′N 51°37′E'
  },
  {
    id: 'barakah-energy',
    name: 'Barakah Nuclear & Clean Energy Grid',
    category: 'DEFENSE_PERIMETER',
    x: 180,
    y: 580,
    threatLevel: 'NOMINAL',
    vesselCount: 0,
    flowVolume: '5.6 GW Baseload Zero-Carbon Power',
    status: 'Level-4 Sovereign Defense Umbrella Active',
    patrolAssets: 'National Guard Coastal & Air Defense Array',
    riskScore: 10,
    recentActivity: 'All 4 APR-1400 reactors operating at 100% nominal baseload output.',
    coordinates: '23°58′N 52°15′E'
  }
];

const LOGISTICS_LINKS: LogisticsLink[] = [
  { id: 'link-1', sourceId: 'hormuz-strait', targetId: 'fujairah-bunker', mode: 'MARITIME', status: 'HIGH_SURVEILLANCE', capacityUtilization: 88, speedKnots: 16 },
  { id: 'link-2', sourceId: 'hormuz-strait', targetId: 'jebel-ali-port', mode: 'MARITIME', status: 'ACTIVE', capacityUtilization: 94, speedKnots: 18 },
  { id: 'link-3', sourceId: 'jebel-ali-port', targetId: 'khalifa-port', mode: 'MARITIME', status: 'ACTIVE', capacityUtilization: 72, speedKnots: 14 },
  { id: 'link-4', sourceId: 'jebel-ali-port', targetId: 'dwc-al-maktoum', mode: 'AIR', status: 'ACTIVE', capacityUtilization: 91 },
  { id: 'link-5', sourceId: 'khalifa-port', targetId: 'ghuweifat-border', mode: 'RAIL_FREIGHT', status: 'ACTIVE', capacityUtilization: 83 },
  { id: 'link-6', sourceId: 'fujairah-bunker', targetId: 'jebel-ali-port', mode: 'ENERGY_PIPELINE', status: 'ACTIVE', capacityUtilization: 79 },
  { id: 'link-7', sourceId: 'barakah-energy', targetId: 'khalifa-port', mode: 'ENERGY_PIPELINE', status: 'ACTIVE', capacityUtilization: 96 }
];

const SECURITY_ZONES: SecurityZone[] = [
  {
    id: 'zone-hormuz',
    name: 'Strait of Hormuz Maritime Patrol Sector',
    type: 'NAVAL_EXCLUSION',
    center: [740, 90],
    radius: 70,
    threatScore: 42,
    status: 'Active Naval Patrol Corridor'
  },
  {
    id: 'zone-barakah',
    name: 'Barakah Protected Security Envelope',
    type: 'RADAR_CONE',
    center: [180, 580],
    radius: 55,
    threatScore: 10,
    status: 'Air & Maritime Exclusion Perimeter'
  },
  {
    id: 'zone-jebel-ali',
    name: 'Jebel Ali Integrated Defense Grid',
    type: 'CUSTOMS_BUFFER',
    center: [430, 430],
    radius: 60,
    threatScore: 12,
    status: 'Automated Port Security Shield'
  }
];

interface SecurityThreatOverlayProps {
  isVisible: boolean;
  onClose?: () => void;
  onSelectNode?: (node: ThreatNode) => void;
}

export const SecurityThreatOverlay: React.FC<SecurityThreatOverlayProps> = ({
  isVisible,
  onClose,
  onSelectNode
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<ThreatNode | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'MARITIME' | 'FREIGHT' | 'DEFENSE'>('ALL');
  const [radarSweepAngle, setRadarSweepAngle] = useState(0);

  // Radar sweep animation
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setRadarSweepAngle((prev) => (prev + 3) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [isVisible]);

  // D3 Render Engine
  useEffect(() => {
    if (!svgRef.current || !isVisible) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 1000;
    const height = 650;

    // Filter nodes according to selected mode
    const filteredNodes = THREAT_NODES.filter((node) => {
      if (filterMode === 'ALL') return true;
      if (filterMode === 'MARITIME') return node.category === 'MARITIME_CHOKEPOINT' || node.category === 'ENERGY_CORRIDOR';
      if (filterMode === 'FREIGHT') return node.category === 'CROSS_BORDER_FREIGHT' || node.category === 'AIR_CARGO_ARTERY';
      if (filterMode === 'DEFENSE') return node.category === 'DEFENSE_PERIMETER' || node.threatLevel !== 'NOMINAL';
      return true;
    });

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

    const filteredLinks = LOGISTICS_LINKS.filter(
      (link) => filteredNodeIds.has(link.sourceId) && filteredNodeIds.has(link.targetId)
    );

    // Defs & Gradients
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'd3-glow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Layer 1: Security Buffer Zones (Radial exclusion perimeters)
    const zonesGroup = svg.append('g').attr('class', 'security-zones');
    SECURITY_ZONES.forEach((zone) => {
      const zoneColor = zone.threatScore > 30 ? '#f59e0b' : '#00e5ff';

      // Concentric pulsed zone circle
      zonesGroup
        .append('circle')
        .attr('cx', zone.center[0])
        .attr('cy', zone.center[1])
        .attr('r', zone.radius)
        .attr('fill', zoneColor)
        .attr('fill-opacity', 0.06)
        .attr('stroke', zoneColor)
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '4 3')
        .attr('stroke-opacity', 0.5);

      // Radar scanner arc inside zone
      const arcGenerator = d3
        .arc()
        .innerRadius(0)
        .outerRadius(zone.radius)
        .startAngle(((radarSweepAngle - 30) * Math.PI) / 180)
        .endAngle((radarSweepAngle * Math.PI) / 180);

      zonesGroup
        .append('path')
        .attr('transform', `translate(${zone.center[0]}, ${zone.center[1]})`)
        .attr('d', arcGenerator as any)
        .attr('fill', zoneColor)
        .attr('fill-opacity', 0.15)
        .attr('pointer-events', 'none');
    });

    // Layer 2: Animated Logistics Link Pathways
    const linksGroup = svg.append('g').attr('class', 'logistics-links');

    filteredLinks.forEach((link) => {
      const source = THREAT_NODES.find((n) => n.id === link.sourceId);
      const target = THREAT_NODES.find((n) => n.id === link.targetId);
      if (!source || !target) return;

      const linkColor =
        link.status === 'HIGH_SURVEILLANCE'
          ? '#f59e0b'
          : link.mode === 'MARITIME'
          ? '#00e5ff'
          : link.mode === 'RAIL_FREIGHT'
          ? '#d4ff00'
          : '#a855f7';

      // Curved Bezier Path
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;

      // Base glowing halo line
      linksGroup
        .append('path')
        .attr('d', `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`)
        .attr('fill', 'none')
        .attr('stroke', linkColor)
        .attr('stroke-width', 3.5)
        .attr('stroke-opacity', 0.25)
        .attr('filter', 'url(#d3-glow)');

      // Active animated telemetry dashed line
      linksGroup
        .append('path')
        .attr('d', `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`)
        .attr('fill', 'none')
        .attr('stroke', linkColor)
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', link.status === 'HIGH_SURVEILLANCE' ? '6 3' : '4 4')
        .attr('stroke-opacity', 0.85)
        .attr('class', 'animate-pulse');
    });

    // Layer 3: Dynamic Security & Logistics Nodes
    const nodesGroup = svg.append('g').attr('class', 'threat-nodes');

    filteredNodes.forEach((node) => {
      const isSelected = selectedNode?.id === node.id;
      const nodeColor =
        node.threatLevel === 'ELEVATED'
          ? '#f59e0b'
          : node.threatLevel === 'HIGH' || node.threatLevel === 'CRITICAL'
          ? '#ef4444'
          : '#00e5ff';

      const nodeG = nodesGroup
        .append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .attr('cursor', 'pointer')
        .on('click', () => {
          setSelectedNode(node);
          onSelectNode?.(node);
        });

      // Outer Pulsing Ripple
      nodeG
        .append('circle')
        .attr('r', isSelected ? 22 : 16)
        .attr('fill', 'none')
        .attr('stroke', nodeColor)
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.4)
        .attr('stroke-dasharray', '3 2');

      // Inner Solid Core
      nodeG
        .append('circle')
        .attr('r', isSelected ? 9 : 7)
        .attr('fill', nodeColor)
        .attr('stroke', '#05080e')
        .attr('stroke-width', 2)
        .attr('filter', 'url(#d3-glow)');

      // Micro Beacon Center
      nodeG.append('circle').attr('r', 2.5).attr('fill', '#ffffff');

      // Node Label Badge
      const labelG = nodeG.append('g').attr('transform', 'translate(0, 18)');

      const textElement = labelG
        .append('text')
        .text(node.name)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', isSelected ? 'bold' : 'normal')
        .attr('fill', isSelected ? '#00e5ff' : '#f5f4f0');

      // Add vessel count pill if active
      if (node.vesselCount > 0) {
        labelG
          .append('text')
          .text(`${node.vesselCount} ACTIVE UNITS · ${node.threatLevel}`)
          .attr('y', 12)
          .attr('text-anchor', 'middle')
          .attr('font-size', '8px')
          .attr('font-family', 'monospace')
          .attr('fill', nodeColor);
      }
    });
  }, [isVisible, filterMode, selectedNode, radarSweepAngle, onSelectNode]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between overflow-hidden">
      {/* SVG Container for D3 Canvas */}
      <svg
        ref={svgRef}
        viewBox="0 0 1000 650"
        className="w-full h-full absolute inset-0 pointer-events-auto select-none"
      />

      {/* Top Overlay HUD Control Strip */}
      <div className="relative z-30 p-4 flex items-center justify-between pointer-events-auto">
        {/* Left: Title & Live Status */}
        <div className="flex items-center gap-2.5 bg-[#070c16]/90 border border-[#00e5ff]/40 rounded-xl px-3.5 py-2 backdrop-blur-md shadow-xl font-mono-tech">
          <div className="w-2.5 h-2.5 rounded-full bg-[#d4ff00] animate-ping" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span className="font-bold text-xs tracking-wider text-[#f5f4f0] uppercase">
                GLOBAL SECURITY & CROSS-BORDER LOGISTICS
              </span>
            </div>
            <span className="text-[10px] text-[#8e8d88]">
              Live D3 Spatial Matrix · Strait of Hormuz & GCC Trade Corridors
            </span>
          </div>
        </div>

        {/* Right Filter Chips & Close Button */}
        <div className="flex items-center gap-2 bg-[#070c16]/90 border border-white/10 rounded-xl p-1.5 backdrop-blur-md shadow-xl font-mono-tech text-xs pointer-events-auto">
          {(['ALL', 'MARITIME', 'FREIGHT', 'DEFENSE'] as const).map((mode) => {
            const isSelected = filterMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-2.5 py-1 rounded-lg transition-all text-[10px] font-semibold tracking-wider ${
                  isSelected
                    ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_#00e5ff]'
                    : 'text-[#8e8d88] hover:text-[#f5f4f0] hover:bg-white/5'
                }`}
              >
                {mode}
              </button>
            );
          })}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#8e8d88] hover:text-[#f5f4f0] hover:bg-white/10 transition-colors ml-1"
              title="Close Overlay"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selected Node Details Drawer / Inspector Card */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-6 left-6 z-30 w-88 sm:w-96 rounded-xl border border-[#00e5ff]/40 bg-[#070c16]/95 backdrop-blur-xl shadow-2xl p-4 font-mono-tech text-xs pointer-events-auto select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#00e5ff]/20 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#00e5ff] animate-pulse" />
                <span className="font-bold text-sm text-[#f5f4f0] uppercase tracking-wide truncate max-w-[240px]">
                  {selectedNode.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 text-[#8e8d88] hover:text-[#f5f4f0] rounded hover:bg-white/5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 rounded bg-[#09101c] border border-white/5 flex flex-col">
                <span className="text-[10px] text-[#8e8d88]">THREAT LEVEL</span>
                <span
                  className={`font-bold text-xs ${
                    selectedNode.threatLevel === 'ELEVATED'
                      ? 'text-[#f59e0b]'
                      : selectedNode.threatLevel === 'HIGH'
                      ? 'text-[#ef4444]'
                      : 'text-[#10b981]'
                  }`}
                >
                  {selectedNode.threatLevel} (Risk {selectedNode.riskScore}/100)
                </span>
              </div>
              <div className="p-2 rounded bg-[#09101c] border border-white/5 flex flex-col">
                <span className="text-[10px] text-[#8e8d88]">ACTIVE TRACKS</span>
                <span className="font-bold text-xs text-[#00e5ff]">
                  {selectedNode.vesselCount} UNITS IN SECTOR
                </span>
              </div>
            </div>

            {/* Flow & Operational Status */}
            <div className="space-y-1.5 mb-3 text-[11px]">
              <div className="flex justify-between text-[#8e8d88]">
                <span>Throughput:</span>
                <span className="text-[#f5f4f0] font-semibold">{selectedNode.flowVolume}</span>
              </div>
              <div className="flex justify-between text-[#8e8d88]">
                <span>Patrol Force:</span>
                <span className="text-[#f5f4f0] truncate max-w-[190px] text-right font-medium">
                  {selectedNode.patrolAssets}
                </span>
              </div>
              <div className="flex justify-between text-[#8e8d88]">
                <span>Coordinates:</span>
                <span className="text-[#00e5ff] font-mono">{selectedNode.coordinates}</span>
              </div>
            </div>

            {/* Live Activity Log */}
            <div className="p-2.5 rounded bg-[#05080e] border border-[#00e5ff]/20 text-[10px] text-[#8e8d88] leading-relaxed">
              <span className="text-[#00e5ff] font-bold">INTELLIGENCE LOG: </span>
              {selectedNode.recentActivity}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
