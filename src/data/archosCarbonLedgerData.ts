import { CarbonLedgerRecord } from '../types/archosExpansion';

export const UAE_CARBON_LEDGERS: Record<string, CarbonLedgerRecord> = {
  'tower-b4471': {
    buildingId: 'tower-b4471',
    buildingName: 'Tower B-4471 Downtown Dubai',
    emirate: 'Dubai',
    embodied: {
      totalTonnes: 92400,
      concreteAndCementTonnes: 54200,
      structuralSteelTonnes: 26800,
      facadeAndGlazingTonnes: 6400,
      finishesAndMepTonnes: 3200,
      transportationTonnes: 1800,
      materialsCostAed: 640000000
    },
    operational: {
      totalTonnesYtd: 2740,
      realTimeKgPerHour: 480,
      gridElectricityTonnes: 1620,
      districtCoolingTonnes: 940,
      waterDesalinationTonnes: 120,
      wasteDisposalTonnes: 60,
      cleanEnergyOffsetTonnes: 520
    },
    budget: {
      totalLifetimeAllocatedTonnes: 250000,
      spentTonnes: 95140, // embodied + ytd
      remainingTonnes: 154860,
      percentSpent: 38.1,
      annualBudgetTonnes: 4600,
      annualSpentTonnes: 2740,
      forecastExceedanceYear: 2064,
      complianceStatus: 'ON_TRACK'
    },
    tradeableCredits: [
      {
        id: 'credit-dxb-2026-01',
        creditBatchNumber: 'DXB-C-9842-2026',
        issuedTonnes: 1420,
        tradeableTonnes: 1420,
        unitPriceAed: 115,
        totalValueAed: 163300,
        verificationStandard: 'GOLD_STANDARD',
        issuanceDate: '2026-06-30',
        status: 'ACTIVE_LISTED'
      },
      {
        id: 'credit-dxb-2025-04',
        creditBatchNumber: 'DXB-C-7719-2025',
        issuedTonnes: 1850,
        tradeableTonnes: 0,
        unitPriceAed: 108,
        totalValueAed: 199800,
        verificationStandard: 'UAE_NATIONAL_REGISTRY',
        issuanceDate: '2025-12-31',
        status: 'TRADED'
      }
    ],
    offsetRegistry: [
      {
        id: 'offset-mangrove-uaq',
        projectName: 'Umm Al Quwain Blue Carbon Mangrove Restoration',
        projectType: 'MANGROVE_BLUE_CARBON',
        location: 'Umm Al Quwain Mangrove Reserve',
        tonnesOffset: 1200,
        costPerTonneAed: 95,
        verificationHash: '0x7e8f192b6a90847f8921cd680a719d3f5481a54b',
        timestamp: '2026-04-12 11:20 GST'
      },
      {
        id: 'offset-solar-aldhafra',
        projectName: 'Al Dhafra 2GW Solar Power Clean Dispatch',
        projectType: 'SOLAR_PARK_AL_DHAFRA',
        location: 'Abu Dhabi Western Region',
        tonnesOffset: 2400,
        costPerTonneAed: 45,
        verificationHash: '0x992b1a8f90c427eb318f67104d55ea761298c421',
        timestamp: '2026-01-18 09:14 GST'
      }
    ],
    realTimeDesignDeltaCost: {
      decisionDescription: 'Replace standard double glazing with Triple-Silver Electrochromic Glazing on South-West Facade',
      carbonSavingsTonnes: 420,
      capexDeltaAed: 2400000,
      paybackMonths: 34
    }
  },
  'masdar-eco-hub': {
    buildingId: 'masdar-eco-hub',
    buildingName: 'Masdar City Eco-Nexus',
    emirate: 'Abu Dhabi',
    embodied: {
      totalTonnes: 23040,
      concreteAndCementTonnes: 9200,
      structuralSteelTonnes: 4600,
      facadeAndGlazingTonnes: 3800,
      finishesAndMepTonnes: 3640,
      transportationTonnes: 1800,
      materialsCostAed: 280000000
    },
    operational: {
      totalTonnesYtd: -420, // Net negative
      realTimeKgPerHour: -48,
      gridElectricityTonnes: 0,
      districtCoolingTonnes: 120,
      waterDesalinationTonnes: 40,
      wasteDisposalTonnes: 20,
      cleanEnergyOffsetTonnes: 600
    },
    budget: {
      totalLifetimeAllocatedTonnes: 100000,
      spentTonnes: 22620,
      remainingTonnes: 77380,
      percentSpent: 22.6,
      annualBudgetTonnes: 0, // Net zero target
      annualSpentTonnes: -420,
      forecastExceedanceYear: null,
      complianceStatus: 'NET_NEGATIVE'
    },
    tradeableCredits: [
      {
        id: 'credit-masdar-2026-01',
        creditBatchNumber: 'AUH-C-8812-2026',
        issuedTonnes: 3840,
        tradeableTonnes: 3840,
        unitPriceAed: 130,
        totalValueAed: 499200,
        verificationStandard: 'GOLD_STANDARD',
        issuanceDate: '2026-07-15',
        status: 'ACTIVE_LISTED'
      }
    ],
    offsetRegistry: [
      {
        id: 'offset-dac-ruwais',
        projectName: 'ADNOC / Masdar Ruwais Direct Air Capture Pilot',
        projectType: 'DIRECT_AIR_CAPTURE',
        location: 'Al Ruwais Industrial Hub',
        tonnesOffset: 1500,
        costPerTonneAed: 280,
        verificationHash: '0x3344ddff1122aacc99887766554433221100aabb',
        timestamp: '2026-03-01 14:40 GST'
      }
    ],
    realTimeDesignDeltaCost: {
      decisionDescription: 'Integrate BIPV Solar Pergola & Vanadium Flow Battery microgrid',
      carbonSavingsTonnes: 880,
      capexDeltaAed: 4800000,
      paybackMonths: 48
    }
  }
};
