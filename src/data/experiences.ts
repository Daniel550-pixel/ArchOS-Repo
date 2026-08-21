import { ExperienceCard } from '../types';

export const EXPERIENCES: ExperienceCard[] = [
  {
    id: 'kinetic-gt',
    index: '01',
    title: 'Kinetic GT',
    tagline: 'Precision, unbound',
    category: 'HYPER-EV AERODYNAMICS',
    classification: 'EXPERIMENTAL AUTOMOTIVE',
    summary: 'A bespoke carbon-fiber electric hypercar expanding along its longitudinal thrust axis into floating structural and mechanical tiers.',
    specs: [
      { label: 'POWERTRAIN', value: '1,920 HP Quad-Motor' },
      { label: 'ACCELERATION', value: '0–100 km/h in 1.74s' },
      { label: 'ARCHITECTURE', value: '800V Solid-State Cell' },
      { label: 'MONOCOQUE', value: 'Pre-Preg Carbon Fiber' }
    ],
    videoSrc: '/assets/kinetic-gt.mp4',
    prompt: 'Cinematic 3D product render video of a futuristic high-performance electric hypercar expanding into a floating exploded view in mid-air. Static camera locked in perspective. 0s: fully assembled sleek carbon-fiber vehicle. 1s–10s: carbon body panels, aerodynamic wing, titanium suspension, electric motor drives, lithium battery pack, and custom wheels smoothly separate into parallel floating layers along the central axis. Dark slate background, soft studio rim lighting, 60fps, ultra-clean industrial design visualization, photorealistic, 4K, no text, no camera motion.',
    accentColor: '#d4ff00',
    layers: [
      {
        id: 'layer-1',
        index: '01',
        name: 'Aerodynamic Monocoque & Active Wing',
        description: 'Autoclaved dry carbon shell with dual venturi tunnels and active DRS trailing edge.',
        material: 'T1000G Carbon Fiber / Titanium Weave',
        relativeDepth: 0.95,
        offsetAxis: 'y'
      },
      {
        id: 'layer-2',
        index: '02',
        name: 'Multilink Pushrod Suspension & Rotors',
        description: 'Billet 3D-printed titanium wishbones with 420mm carbon-silicon carbide brake discs.',
        material: 'Ti-6Al-4V Grade 5 Titanium & C/SiC',
        relativeDepth: 0.72,
        offsetAxis: 'x'
      },
      {
        id: 'layer-3',
        index: '03',
        name: 'Dual Axial-Flux Inverter Motors',
        description: 'Silicon carbide twin inverters delivering 24,000 RPM peak rotor velocity.',
        material: 'Neodymium N52H / Copper Hairpin Stator',
        relativeDepth: 0.48,
        offsetAxis: 'z'
      },
      {
        id: 'layer-4',
        index: '04',
        name: 'Structural Solid-State Battery Enclosure',
        description: '120 kWh structural battery pack serving as torsionally rigid floor plane.',
        material: 'Anodized 7075-T6 Billet Aluminum',
        relativeDepth: 0.25,
        offsetAxis: 'y'
      },
      {
        id: 'layer-5',
        index: '05',
        name: 'Forged Magnesium Aero Wheels & Slicks',
        description: 'Turbofan carbon aero blades paired with bespoke micro-grooved racing compound.',
        material: 'Forged Magnesium AZ91D / Synthetic Rubber',
        relativeDepth: 0.08,
        offsetAxis: 'x'
      }
    ]
  },
  {
    id: 'orbital-habitat',
    index: '02',
    title: 'Orbital Habitat',
    tagline: 'Architecture without gravity',
    category: 'DEEP-SPACE URBANISM',
    classification: 'ROTATIONAL CENTRIFUGE',
    summary: 'A 220-meter modular torus habitat separating outward into power wings, pressurized living rings, life-support conduits, and docking hubs.',
    specs: [
      { label: 'DIAMETER', value: '220m Centrifuge Torus' },
      { label: 'GRAVITATIONAL SIM', value: '0.92G at 2.8 RPM' },
      { label: 'OCCUPANCY', value: '1,450 Long-Duration' },
      { label: 'POWER YIELD', value: '4.8 MW Solar Array' }
    ],
    videoSrc: '/assets/orbital-habitat.mp4',
    prompt: 'Ultra-realistic 3D architectural visualization of a modular ring-shaped space habitat expanding into an exploded view layout. Static camera locked in position. 0s: fully sealed metallic space station ring. 1s–10s: solar array wings, docking bays, pressurized habitat pods, life support conduits, and central hub separate vertically into floating layers with precise spacing. Volumetric dark void background, soft earth-glow rim lighting, Octane render, 60fps, 4K, no camera movement.',
    accentColor: '#d4ff00',
    layers: [
      {
        id: 'layer-1',
        index: '01',
        name: 'Photovoltaic Solar Array Wings',
        description: 'Ultra-lightweight perovskite dual-sided solar collectors with continuous sun-tracking gimbals.',
        material: 'Multi-Junction Perovskite / Polyimide Film',
        relativeDepth: 0.96,
        offsetAxis: 'z'
      },
      {
        id: 'layer-2',
        index: '02',
        name: 'Pressurized Living Pods & Biospheres',
        description: 'Triple-hulled micrometeoroid shielding containing modular residential habitat quarters.',
        material: 'Nextel / Kevlar / Al-Li 2195 Alloy',
        relativeDepth: 0.74,
        offsetAxis: 'y'
      },
      {
        id: 'layer-3',
        index: '03',
        name: 'ECLSS Closed-Loop Environmental Spine',
        description: 'Micro-algae bioreactors and closed-loop oxygen/water regeneration fluid manifolds.',
        material: 'Sintered Titanium & Fluoropolymer Conduits',
        relativeDepth: 0.50,
        offsetAxis: 'x'
      },
      {
        id: 'layer-4',
        index: '04',
        name: 'Reaction Control Core & Momentum Wheels',
        description: 'Magnetic levitation counter-rotating gyroscopic flywheel hub ensuring attitude equilibrium.',
        material: 'Superconducting YBCO / Tungsten Mass Rims',
        relativeDepth: 0.28,
        offsetAxis: 'y'
      },
      {
        id: 'layer-5',
        index: '05',
        name: 'Zero-G Intermodal Docking Port',
        description: 'Universal androgynous capture ring for interstellar shuttles and automated cargo drones.',
        material: 'Hardened Maraging Steel / Ceramic Sealants',
        relativeDepth: 0.05,
        offsetAxis: 'z'
      }
    ]
  },
  {
    id: 'botanical-clock',
    index: '03',
    title: 'Botanical Clock',
    tagline: 'Time, taken apart',
    category: 'CHRONOMETRIC HOROLOGY',
    classification: 'LIVING MICRO-SYSTEM',
    summary: 'A mechanical sculptural masterwork fusing high-complication horology with an internal self-regulating moss terrarium.',
    specs: [
      { label: 'ESCAPEMENT', value: 'Triple-Axis Tourbillon' },
      { label: 'FREQUENCY', value: '21,600 VPH (3 Hz)' },
      { label: 'POWER RESERVE', value: '168 Hours (7 Days)' },
      { label: 'BIOME', value: 'Hermetic Living Bryophyte' }
    ],
    videoSrc: '/assets/botanical-clock.mp4',
    prompt: 'High-end 3D product film of a sculptural mechanical timepiece with living botanical elements disassembling into layers. Static locked camera. 0s: complete timepiece with brass casing and glass dome. 1s–10s: hand-carved brass gears, Tourbillon escapement cage, balance wheel, frosted glass face, and internal moss terrarium separate outwards with floating spacing. Dark charcoal matte background, warm soft key light, hyper-detailed mechanical aesthetic, 60fps, 4K, static camera.',
    accentColor: '#d4ff00',
    layers: [
      {
        id: 'layer-1',
        index: '01',
        name: 'Antiqued Brass Casing & Sapphire Dome',
        description: 'Hand-patinated maritime brass bezel framing a double-domed anti-reflective sapphire crystal.',
        material: 'Aged CuZn39Pb3 Brass / Corundum Sapphire',
        relativeDepth: 0.94,
        offsetAxis: 'z'
      },
      {
        id: 'layer-2',
        index: '02',
        name: 'Skeletonized Dial & Thermal-Blued Hands',
        description: 'Micro-milled frosted dial ring with openwork apertures revealing train wheel engagement.',
        material: 'Hand-Grained German Silver & Flame-Blued Steel',
        relativeDepth: 0.70,
        offsetAxis: 'y'
      },
      {
        id: 'layer-3',
        index: '03',
        name: 'Triple-Axis Tourbillon Cage & Balance',
        description: 'Ultra-lightweight carriage rotating across three spherical planes every 60/120/180 seconds.',
        material: 'Grade 5 Titanium & Glucydur Balance Wheel',
        relativeDepth: 0.48,
        offsetAxis: 'x'
      },
      {
        id: 'layer-4',
        index: '04',
        name: 'Hermetic Living Bryophyte Terrarium',
        description: 'Micro-capillary hydration network sustaining living Dicranum scoparium alpine moss.',
        material: 'Borosilicate Glass & Sintered Ceramic Mesh',
        relativeDepth: 0.26,
        offsetAxis: 'y'
      },
      {
        id: 'layer-5',
        index: '05',
        name: 'Mainplate with 38 Synthetic Ruby Bearings',
        description: 'Cotes de Geneve decorated baseplate with olive-domed jewel chatons secured by heat-treated screws.',
        material: 'Rhodium-Plated Brass & Synthetic Corundum Rubies',
        relativeDepth: 0.06,
        offsetAxis: 'z'
      }
    ]
  },
  {
    id: 'analogue-sound-machine',
    index: '04',
    title: 'Analogue Sound Machine',
    tagline: 'The anatomy of sound',
    category: 'AUDIOPHILE ACOUSTICS',
    classification: 'THERMIONIC VALVE SYSTEM',
    summary: 'A precision-engineered direct-heated vacuum tube turntable and acoustic synthesizer isolating mechanical resonance in mid-air.',
    specs: [
      { label: 'AMPLIFICATION', value: 'Dual 300B Triode Tubes' },
      { label: 'PLATTER MASS', value: '14.2 kg Solid Billet' },
      { label: 'ISOLATION', value: 'Sub-Zero Magnetic Air' },
      { label: 'SIGNAL-TO-NOISE', value: '> 108 dB Precision' }
    ],
    videoSrc: '/assets/analogue-sound-machine.mp4',
    prompt: 'Precision 3D exploded view animation of a high-end audiophile vacuum tube synthesizer and turntable. Static camera locked on 85mm lens. 0s: pristine assembled matte-black and brass turntable. 1s–10s: glowing vacuum tubes, tonearm assembly, heavy brass platter, PCB circuit board, custom knobs, and acoustic dampening base separate into floating layers. Dark slate background, subtle warm audio glow, photorealistic, 60fps, 4K, no camera motion.',
    accentColor: '#d4ff00',
    layers: [
      {
        id: 'layer-1',
        index: '01',
        name: '300B Direct-Heated Vacuum Triodes',
        description: 'Hand-blown glass thermionic tubes with glowing thoriated tungsten filaments producing pure harmonic warmth.',
        material: 'Borosilicate Glass / Nickel Anode / Ceramic Base',
        relativeDepth: 0.95,
        offsetAxis: 'y'
      },
      {
        id: 'layer-2',
        index: '02',
        name: 'Carbon Gimbal Tonearm & Boron Cartridge',
        description: 'Nine-inch continuous-weave armtube with micro-ridge diamond stylus tracking at 1.85g.',
        material: 'Cross-Ply Carbon / Solid Boron / OFC Silver Wire',
        relativeDepth: 0.72,
        offsetAxis: 'x'
      },
      {
        id: 'layer-3',
        index: '03',
        name: 'Mass-Loaded Brass Platter & Mag-Lev Spindle',
        description: 'Precision dynamically balanced flywheel floating on a frictionless magnetic repulsion field.',
        material: 'High-Density CZ121 Brass / Neodymium Repulsion',
        relativeDepth: 0.49,
        offsetAxis: 'z'
      },
      {
        id: 'layer-4',
        index: '04',
        name: 'Point-to-Point Hand-Wired Valve Preamp PCB',
        description: 'Pure copper busbars with audiophile silver-foil capacitors for zero phase distortion.',
        material: 'Gold-Plated FR4 & Polypropylene Capacitors',
        relativeDepth: 0.27,
        offsetAxis: 'y'
      },
      {
        id: 'layer-5',
        index: '05',
        name: 'Viscoelastic Sorbothane & Granite Base',
        description: 'Constrained layer dampening plinth decoupling turntable from seismic floor vibrations.',
        material: 'Absolute Black Granite & 70-Duro Sorbothane',
        relativeDepth: 0.05,
        offsetAxis: 'z'
      }
    ]
  },
  {
    id: 'future-city-block',
    index: '05',
    title: 'Future City Block',
    tagline: 'A city in layers',
    category: 'BIOPHILIC URBANISM',
    classification: 'CARBON-NEGATIVE TOWER',
    summary: 'A 680-meter sustainable skyscraper and urban district lifting upwards into autonomous ecological, transit, and structural strata.',
    specs: [
      { label: 'HEIGHT', value: '680m / 164 Floors' },
      { label: 'ENERGY BALANCE', value: '+142% Net-Positive' },
      { label: 'BIOSPHERE', value: '45,000m² Skygardens' },
      { label: 'TRANSIT', value: 'Maglev Sub-Basement Hub' }
    ],
    videoSrc: '/assets/future-city-block.mp4',
    prompt: 'Architectural cross-section exploded view animation of an ultra-modern sustainable skyscraper and urban city block. Static camera locked. 0s: complete futuristic skyscraper standing in a dark architectural void. 1s–10s: subterranean transit levels, steel structural core, modular apartment units, vertical forest skygardens, and solar roof canopy lift upward and separate into floating architectural tiers. Minimal dark background, soft volumetric fog, 60fps, 4K, static camera.',
    accentColor: '#d4ff00',
    layers: [
      {
        id: 'layer-1',
        index: '01',
        name: 'Aerodynamic Photovoltaic Canopy',
        description: 'Kinetic wind-harvesting roof structure with integrated building-integrated solar glass panels.',
        material: 'Electrochromic Smart Glass / BIPV Cells',
        relativeDepth: 0.95,
        offsetAxis: 'y'
      },
      {
        id: 'layer-2',
        index: '02',
        name: 'Stepped Skygardens & Biophilic Terraces',
        description: 'Continuous vertical forest canopy filtering ambient particulate matter and managing rainwater runoff.',
        material: 'Engineered Soil Substrate / Endemic Flora',
        relativeDepth: 0.73,
        offsetAxis: 'x'
      },
      {
        id: 'layer-3',
        index: '03',
        name: 'Modular Cross-Laminated Timber Pods',
        description: 'Prefabricated carbon-sequestering modular living envelopes slotted into primary outrigger frames.',
        material: 'European Spruce CLT & Mycelium Insulation',
        relativeDepth: 0.50,
        offsetAxis: 'z'
      },
      {
        id: 'layer-4',
        index: '04',
        name: 'Ultra-High Yield Steel Structural Core',
        description: 'Tubular mega-column concrete composite core housing vertical maglev transit elevator shafts.',
        material: 'High-Strength Q690D Steel / Geopolymer Concrete',
        relativeDepth: 0.28,
        offsetAxis: 'y'
      },
      {
        id: 'layer-5',
        index: '05',
        name: 'Subterranean Hyperloop & Automated Vaults',
        description: 'Four subterranean basements housing autonomous freight distribution and high-speed maglev lines.',
        material: 'Shotcrete & Post-Tensioned Foundation Raft',
        relativeDepth: 0.05,
        offsetAxis: 'z'
      }
    ]
  }
];
