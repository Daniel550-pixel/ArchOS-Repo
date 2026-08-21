import React, { useEffect, useRef, useState } from 'react';
import { GlassPanel } from '../layout/GlassPanel';
import { Network, GitMerge, Sparkles, RefreshCw, Layers } from 'lucide-react';
import * as d3 from 'd3';
import { generalIntelligence, ConceptNode } from '../../services/agi/generalIntelligence';
import { speechService } from '../../services/voice/speechService';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  domain: string;
  abstraction_level: number;
  connections: string[];
}

export const ConceptGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [concepts, setConcepts] = useState<ConceptNode[]>(generalIntelligence.getConcepts());
  const [isForming, setIsForming] = useState(false);

  const graphData: GraphNode[] = [
    { id: 'c1', name: 'Topological Fluidic Flow', domain: 'Physical Networks', abstraction_level: 4, connections: ['c2', 'c3'] },
    { id: 'c2', name: 'Decentralized Homeostasis', domain: 'Cybernetics', abstraction_level: 5, connections: ['c1', 'c4'] },
    { id: 'c3', name: 'Continuous Spatial Fidelity', domain: 'Geospatial Vision', abstraction_level: 4, connections: ['c1', 'c5'] },
    { id: 'c4', name: 'Post-Quantum Resilience', domain: 'Quantum Security', abstraction_level: 5, connections: ['c2', 'c6'] },
    { id: 'c5', name: 'eVTOL Dynamic Corridors', domain: 'Aero Transport', abstraction_level: 3, connections: ['c3', 'c6'] },
    { id: 'c6', name: 'Universal AGI Synthesis', domain: 'Meta Intelligence', abstraction_level: 5, connections: ['c4', 'c5', 'c1'] },
  ];

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 450;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Links data
    const linksData = graphData.flatMap((c) =>
      c.connections.map((target) => ({ source: c.id, target }))
    );

    // D3 Force Simulation
    const simulation = d3.forceSimulation<GraphNode>(graphData)
      .force('link', d3.forceLink(linksData).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-450))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(45));

    // Draw Links
    const link = g.append('g')
      .selectAll('line')
      .data(linksData)
      .enter()
      .append('line')
      .attr('stroke', '#00e5ff')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4, 2');

    // Draw Node Groups
    const node = g.append('g')
      .selectAll('g')
      .data(graphData)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Outer Glow Ring
    node.append('circle')
      .attr('r', (d) => 14 + d.abstraction_level * 4)
      .attr('fill', (d) => (d.abstraction_level === 5 ? '#a855f7' : '#00e5ff'))
      .attr('fill-opacity', 0.15)
      .attr('stroke', (d) => (d.abstraction_level === 5 ? '#a855f7' : '#00e5ff'))
      .attr('stroke-width', 1.5);

    // Inner Core Circle
    node.append('circle')
      .attr('r', (d) => 6 + d.abstraction_level * 2)
      .attr('fill', (d) => (d.abstraction_level === 5 ? '#d4ff00' : '#00e5ff'))
      .attr('fill-opacity', 0.8)
      .attr('filter', 'drop-shadow(0 0 6px rgba(0,229,255,0.8))');

    // Node Labels
    node.append('text')
      .text((d) => d.name)
      .attr('x', 0)
      .attr('y', (d) => 22 + d.abstraction_level * 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', 'bold');

    // Abstraction LOD badge text
    node.append('text')
      .text((d) => `LOD ${d.abstraction_level}`)
      .attr('x', 0)
      .attr('y', (d) => 33 + d.abstraction_level * 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#00e5ff')
      .attr('font-size', '8px')
      .attr('font-family', 'JetBrains Mono, monospace');

    // Simulation Tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, []);

  const handleSynthesizeConcept = async () => {
    setIsForming(true);
    try {
      const nc = await generalIntelligence.formConcept(
        [
          { title: 'Barakah Nuclear High-Voltage Desalination', description: 'Thermal-kinetic coupling without grid latency', domain: 'Energy & Water' },
          { title: 'Dubai Skyway 3D Vertiport Routing', description: 'Dynamic altitude buffer reservation matrix', domain: 'Aerospace' }
        ],
        'Sovereign Infrastructure Invariants'
      );
      setConcepts(generalIntelligence.getConcepts());
      setSelectedNode(nc);
      speechService.speak(`Synthesized new abstract concept: ${nc.name}`);
    } finally {
      setIsForming(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full w-full font-mono-tech select-none">
      {/* Interactive Concept Graph Viewport */}
      <div className="col-span-12 lg:col-span-8 flex flex-col h-full">
        <GlassPanel
          title="CONCEPT KNOWLEDGE GRAPH (D3 TENSOR MESH)"
          icon={<Network size={16} />}
          badge={`${graphData.length} ACTIVE NODES`}
          badgeColor="cyan"
          actions={
            <button
              onClick={handleSynthesizeConcept}
              disabled={isForming}
              className="px-2.5 py-1 rounded-lg bg-[#ec4899]/20 hover:bg-[#ec4899]/30 text-[#ec4899] border border-[#ec4899]/40 text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3 h-3 ${isForming ? 'animate-spin' : ''}`} />
              <span>{isForming ? 'SYNTHESIZING...' : 'FORM NEW CONCEPT'}</span>
            </button>
          }
          className="h-full"
        >
          <div ref={containerRef} className="relative w-full flex-1 rounded-xl overflow-hidden border border-[#00e5ff]/20 bg-[#02050e]">
            {/* Background grid canvas overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: 'radial-gradient(#00e5ff 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />
            <svg ref={svgRef} className="w-full h-full" />

            <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 border border-white/10 text-[9px] text-zinc-400">
              Drag nodes to rearrange · Scroll to zoom
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Transfer Learning Stats & Active Concepts */}
      <div className="col-span-12 lg:col-span-4 flex flex-col h-full">
        <GlassPanel
          title="TRANSFER LEARNING & ABSTRACTION"
          icon={<GitMerge size={16} />}
          badge="ZERO-SHOT"
          badgeColor="gold"
          className="h-full"
        >
          <div className="space-y-3.5 overflow-y-auto max-h-[calc(100%-1rem)] pr-1">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-center">
                <div className="text-[10px] text-zinc-400">Cross-Domain Mappings</div>
                <div className="text-xl text-[#00e5ff] font-bold">342</div>
                <div className="text-[9px] text-[#10b981] mt-0.5">+18 this session</div>
              </div>

              <div className="p-3 rounded-xl bg-[#d4ff00]/10 border border-[#d4ff00]/30 text-center">
                <div className="text-[10px] text-zinc-400">Zero-Shot Accuracy</div>
                <div className="text-xl text-[#d4ff00] font-bold">94.2%</div>
                <div className="text-[9px] text-[#10b981] mt-0.5">+4.1% transfer gain</div>
              </div>
            </div>

            {/* Active Cross-Domain Vectors */}
            <div>
              <h5 className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2">
                ACTIVE DOMAIN TRANSFERS
              </h5>
              <div className="space-y-2">
                {[
                  { name: 'Maritime Ports → Skyway Drone Corridors', pct: 93, color: 'bg-[#00e5ff]' },
                  { name: 'Nuclear Base-load → Desalination Shunting', pct: 96, color: 'bg-[#10b981]' },
                  { name: 'Continuous Spatial Twin → 8K RTX Voxel', pct: 98, color: 'bg-[#a855f7]' },
                  { name: 'Kyber Lattice → Inter-Emirate Telemetry', pct: 99, color: 'bg-[#d4ff00]' }
                ].map((tf, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-white font-bold truncate">{tf.name}</span>
                      <span className="text-[#00e5ff] font-bold">{tf.pct}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${tf.color}`} style={{ width: `${tf.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected or Sample Concept Details */}
            {selectedNode && (
              <div className="p-3 rounded-xl bg-[#ec4899]/10 border border-[#ec4899]/30 flex flex-col gap-1 text-xs">
                <div className="text-[10px] text-[#ec4899] font-bold uppercase">Latest Synthesized Invariant:</div>
                <div className="text-white font-bold">{selectedNode.name}</div>
                <p className="text-[10px] text-zinc-300">{selectedNode.semantic_description}</p>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};
