from typing import Dict, List, Any

UAE_TOPIC_TAXONOMY: List[Dict[str, Any]] = [
    # GOVERNMENT & POLITICS
    {"code": "GOV_POLICY", "name": "Government Policy & Regulation", "category_group": "GOVERNMENT", "keywords": ["decree", "cabinet", "ministry", "minister", "legislation", "mandate", "regulations", "federal", "authority", "law"]},
    {"code": "GOV_DIGITAL", "name": "Digital Government & AIDA", "category_group": "GOVERNMENT", "keywords": ["tamm", "aida", "digital government", "sovereign cloud", "e-government", "smart dubai", "digital transformation", "ai governance"]},
    {"code": "INTL_RELATIONS", "name": "International Relations & Treaties", "category_group": "GOVERNMENT", "keywords": ["diplomatic", "bilateral", "treaty", "cepa", "ambassador", "foreign affairs", "strategic pact", "un"]},
    {"code": "DEFENSE_SECURITY", "name": "Defense & National Security", "category_group": "GOVERNMENT", "keywords": ["armed forces", "defense", "edge group", "sovereign defense", "security", "guard", "border"]},
    
    # ECONOMY, TRADE & FINANCE
    {"code": "ECON_MACRO", "name": "Macroeconomics & D33", "category_group": "ECONOMY", "keywords": ["gdp", "inflation", "d33", "economic growth", "non-oil", "sovereign wealth", "central bank", "adq", "mubadala", "adrec"]},
    {"code": "FIN_MARKETS", "name": "Financial Markets & Banking", "category_group": "ECONOMY", "keywords": ["adx", "dfm", "difc", "adgm", "banking", "first abu dhabi bank", "emirates nbd", "liquidity", "bonds", "sukuk"]},
    {"code": "TRADE_LOGISTICS", "name": "Foreign Trade & Customs", "category_group": "ECONOMY", "keywords": ["customs", "export", "import", "trade corridor", "re-export", "cepa", "free zone", "jafza", "dafza"]},
    {"code": "INVEST_FDI", "name": "Foreign Direct Investment (FDI)", "category_group": "ECONOMY", "keywords": ["fdi", "venture capital", "inward investment", "investor", "merger", "acquisition", "private equity"]},

    # INFRASTRUCTURE & TRANSPORT
    {"code": "INFRA_RAIL", "name": "Railways & Etihad Rail", "category_group": "INFRASTRUCTURE", "keywords": ["etihad rail", "railway", "train", "freight train", "passenger rail", "track", "rail terminal"]},
    {"code": "INFRA_PORTS", "name": "Maritime & Ports", "category_group": "INFRASTRUCTURE", "keywords": ["port", "jebel ali", "khalifa port", "port of fujairah", "dp world", "ad ports", "maritime", "bunkering", "shipping", "berth", "teu"]},
    {"code": "INFRA_AVIATION", "name": "Aviation & Airports", "category_group": "INFRASTRUCTURE", "keywords": ["emirates", "etihad airways", "flydubai", "dxb", "al maktoum international", "dxc", "auh", "zayed international", "aviation", "runway", "air traffic"]},
    {"code": "INFRA_ROADS", "name": "Roads & Urban Mobility", "category_group": "INFRASTRUCTURE", "keywords": ["rta", "itc", "highway", "traffic", "metro", "bus", "autonomous vehicle", "toll", "salik"]},

    # REAL ESTATE, ARCHITECTURE & CONSTRUCTION
    {"code": "REAL_ESTATE", "name": "Real Estate & Housing", "category_group": "REAL_ESTATE", "keywords": ["property", "real estate", "emaar", "aldar", "nakheel", "damac", "residential", "villa", "apartment", "rental", "plot", "zoning"]},
    {"code": "CONSTRUCTION", "name": "Construction & Architecture", "category_group": "REAL_ESTATE", "keywords": ["construction", "architect", "contractor", "tower", "building", "infrastructure project", "3d printing", "masterplan"]},

    # ENERGY, UTILITIES & ENVIRONMENT
    {"code": "ENERGY_NUCLEAR", "name": "Nuclear Energy & Barakah", "category_group": "ENERGY", "keywords": ["barakah", "nuclear", "enec", "nawah", "baseload", "reactor", "apr-1400", "clean electricity"]},
    {"code": "ENERGY_OIL_GAS", "name": "Oil, Gas & Petrochemicals", "category_group": "ENERGY", "keywords": ["adnoc", "enoc", "crude", "oil", "gas", "lng", "refinery", "habshan", "ruwais", "petrochemical"]},
    {"code": "ENERGY_RENEWABLES", "name": "Renewables & Solar", "category_group": "ENERGY", "keywords": ["masdar", "solar", "al dhafra solar", "mohammed bin rashid solar park", "dewa", "taqa", "green hydrogen", "wind"]},
    {"code": "ENV_CLIMATE", "name": "Environment, Water & Climate", "category_group": "ENERGY", "keywords": ["cop28", "climate", "net zero", "desalination", "water security", "mangrove", "carbon footprint"]},

    # TECHNOLOGY & INNOVATION
    {"code": "TECH_AI", "name": "Artificial Intelligence & Robotics", "category_group": "TECHNOLOGY", "keywords": ["ai", "artificial intelligence", "g42", "technology innovation institute", "tii", "falcon", "agentic", "machine learning", "robotics"]},
    {"code": "TECH_CYBER", "name": "Cybersecurity & Sovereign Cloud", "category_group": "TECHNOLOGY", "keywords": ["cybersecurity", "cyber", "data privacy", "sovereign cloud", "encryption", "khazna", "cpi", "threat intelligence"]},
    {"code": "TECH_SPACE", "name": "Space & Advanced Science", "category_group": "TECHNOLOGY", "keywords": ["space agency", "mbrsc", "satellite", "hope probe", "lunar", "astronaut", "space mission"]},
    
    # SOCIETY, HEALTHCARE & TOURISM
    {"code": "HEALTHCARE", "name": "Healthcare & Life Sciences", "category_group": "SOCIETY", "keywords": ["dha", "doh", "purehealth", "hospital", "pharma", "clinical", "medical"]},
    {"code": "EDUCATION", "name": "Education & Universities", "category_group": "SOCIETY", "keywords": ["university", "mbzuai", "school", "education", "k-12", "curriculum", "research"]},
    {"code": "TOURISM_CULTURE", "name": "Tourism, Culture & Major Events", "category_group": "SOCIETY", "keywords": ["tourism", "louvre abu dhabi", "museum of the future", "culture", "hospitality", "hotel", "exhibition", "gitex", "adipec"]}
]
