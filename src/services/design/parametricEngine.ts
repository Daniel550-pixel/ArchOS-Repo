import { DesignParameters, BIMModel, BIMComponent } from '../../types/design';

// Simulates the BIM Agent generating a procedural model
export function generateBIMModel(params: DesignParameters): BIMModel {
  const totalHeight = params.floorCount * params.floorHeight;
  const totalGFA = params.footprintWidth * params.footprintDepth * params.floorCount;
  
  // Mock carbon calculation factors (kgCO2e per m2)
  const structureFactor = params.structuralSystem === 'steel' ? 120 : params.structuralSystem === 'timber' ? 40 : 90;
  const facadeFactor = params.facadeType === 'curtain_wall' ? 80 : params.facadeType === 'green_wall' ? 30 : 60;
  
  const embodiedCarbon = ((totalGFA * structureFactor) + (totalGFA * facadeFactor)) / 1000; // tons

  const components: BIMComponent[] = [
    { id: 'c1', category: 'STRUCTURAL', name: 'Reinforced Concrete Columns', quantity: Math.ceil(totalGFA / 50), unit: 'units', carbonFootprint: totalGFA * 45 },
    { id: 'c2', category: 'STRUCTURAL', name: 'Post-Tensioned Slabs', quantity: params.floorCount, unit: 'floors', carbonFootprint: totalGFA * 30 },
    { id: 'c3', category: 'ENVELOPE', name: `${params.facadeType.replace('_', ' ')} Panels`, quantity: Math.ceil((params.footprintWidth + params.footprintDepth) * 2 * totalHeight / 4), unit: 'panels', carbonFootprint: totalGFA * facadeFactor },
    { id: 'c4', category: 'MEP', name: 'VAV Air Handling Units', quantity: Math.ceil(params.floorCount / 2), unit: 'units', carbonFootprint: params.floorCount * 1200 },
    { id: 'c5', category: 'MEP', name: 'Chiller Plant (Centrifugal)', quantity: 1, unit: 'system', carbonFootprint: 45000 },
  ];

  return {
    id: `bim-${Date.now()}`,
    totalGFA,
    totalHeight,
    estimatedEmbodiedCarbon: +embodiedCarbon.toFixed(2),
    components,
    generatedAt: new Date().toISOString(),
  };
}
