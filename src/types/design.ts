export interface DesignParameters {
  footprintWidth: number; // meters
  footprintDepth: number; // meters
  floorCount: number;
  floorHeight: number; // meters
  orientation: number; // degrees (0-360)
  structuralSystem: 'steel' | 'concrete' | 'composite' | 'timber';
  facadeType: 'curtain_wall' | 'precast' | 'masonry' | 'green_wall';
}

export interface BIMComponent {
  id: string;
  category: 'STRUCTURAL' | 'MEP' | 'ARCHITECTURAL' | 'ENVELOPE';
  name: string;
  quantity: number;
  unit: string;
  carbonFootprint: number; // kgCO2e
}

export interface BIMModel {
  id: string;
  totalGFA: number; // Gross Floor Area (m2)
  totalHeight: number; // meters
  estimatedEmbodiedCarbon: number; // tons CO2e
  components: BIMComponent[];
  generatedAt: string;
}
