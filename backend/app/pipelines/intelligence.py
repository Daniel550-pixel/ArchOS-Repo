import re
import uuid
from datetime import datetime
from typing import Dict, List, Any, Tuple, Optional
from app.pipelines.taxonomy import UAE_TOPIC_TAXONOMY

# Canonical UAE Entity Registry
CANONICAL_ENTITIES = [
    # Government Entities & Authorities
    {"id": "ENT_AIDA", "name": "Federal AI & Data Authority (AIDA)", "canonical": "Federal AI and Data Authority", "type": "government_entity", "sector": "GOVERNMENT", "emirate": "Abu Dhabi", "aliases": ["AIDA", "Federal AI Authority", "UAE AI Council"]},
    {"id": "ENT_DGE", "name": "Department of Government Enablement", "canonical": "Abu Dhabi Department of Government Enablement", "type": "government_entity", "sector": "GOVERNMENT", "emirate": "Abu Dhabi", "aliases": ["DGE", "TAMM", "Abu Dhabi Digital Authority"]},
    {"id": "ENT_ENEC", "name": "Emirates Nuclear Energy Corporation", "canonical": "Emirates Nuclear Energy Corporation", "type": "government_entity", "sector": "ENERGY", "emirate": "Abu Dhabi", "aliases": ["ENEC", "Nawah Energy", "Barakah One Company"]},
    {"id": "ENT_DET", "name": "Dubai Economy & Tourism", "canonical": "Department of Economy and Tourism", "type": "government_entity", "sector": "ECONOMY", "emirate": "Dubai", "aliases": ["DET", "Dubai Economy", "Dubai Tourism", "D33 Office"]},
    {"id": "ENT_RTA", "name": "Roads and Transport Authority", "canonical": "Roads and Transport Authority Dubai", "type": "government_entity", "sector": "TRANSPORT", "emirate": "Dubai", "aliases": ["RTA", "Dubai RTA", "Dubai Metro"]},
    {"id": "ENT_CBUAE", "name": "Central Bank of the UAE", "canonical": "Central Bank of the United Arab Emirates", "type": "government_entity", "sector": "ECONOMY", "emirate": "Abu Dhabi", "aliases": ["CBUAE", "UAE Central Bank"]},
    
    # Companies & Sovereign Wealth
    {"id": "ENT_ADNOC", "name": "ADNOC Group", "canonical": "Abu Dhabi National Oil Company", "type": "company", "sector": "ENERGY", "emirate": "Abu Dhabi", "aliases": ["ADNOC", "Abu Dhabi National Oil Co"]},
    {"id": "ENT_DP_WORLD", "name": "DP World", "canonical": "DP World Global Logistics", "type": "company", "sector": "LOGISTICS", "emirate": "Dubai", "aliases": ["DP World", "Dubai Ports World", "JAFZA"]},
    {"id": "ENT_G42", "name": "G42", "canonical": "Group 42 Holding Ltd", "type": "company", "sector": "TECHNOLOGY", "emirate": "Abu Dhabi", "aliases": ["G42", "Core42", "Presight", "Inception"]},
    {"id": "ENT_MUBADALA", "name": "Mubadala Investment Company", "canonical": "Mubadala Investment Company PJSC", "type": "company", "sector": "FINANCE", "emirate": "Abu Dhabi", "aliases": ["Mubadala", "Mubadala Capital"]},
    {"id": "ENT_ADQ", "name": "ADQ Holding", "canonical": "Abu Dhabi Developmental Holding Company PJSC", "type": "company", "sector": "FINANCE", "emirate": "Abu Dhabi", "aliases": ["ADQ", "ADQ Holding"]},
    {"id": "ENT_EMAAR", "name": "Emaar Properties", "canonical": "Emaar Properties PJSC", "type": "company", "sector": "REAL_ESTATE", "emirate": "Dubai", "aliases": ["Emaar", "Emaar Development"]},
    {"id": "ENT_ALDAR", "name": "Aldar Properties", "canonical": "Aldar Properties PJSC", "type": "company", "sector": "REAL_ESTATE", "emirate": "Abu Dhabi", "aliases": ["Aldar"]},
    {"id": "ENT_MASDAR", "name": "Masdar Clean Energy", "canonical": "Abu Dhabi Future Energy Company", "type": "company", "sector": "ENERGY", "emirate": "Abu Dhabi", "aliases": ["Masdar", "Masdar City"]},
    {"id": "ENT_EDGE", "name": "EDGE Group", "canonical": "EDGE Group PJSC", "type": "company", "sector": "DEFENSE", "emirate": "Abu Dhabi", "aliases": ["EDGE", "EDGE Group"]},

    # Infrastructure & Mega Projects
    {"id": "ENT_ETIHAD_RAIL", "name": "Etihad Rail", "canonical": "Etihad Rail National Network", "type": "infrastructure", "sector": "LOGISTICS", "emirate": "UAE National", "aliases": ["Etihad Rail", "National Railway Network", "UAE Rail"]},
    {"id": "ENT_BARAKAH", "name": "Barakah Nuclear Power Plant", "canonical": "Barakah Nuclear Energy Facility", "type": "infrastructure", "sector": "ENERGY", "emirate": "Abu Dhabi", "aliases": ["Barakah", "Barakah Plant", "Barakah Nuclear"]},
    {"id": "ENT_JEBEL_ALI", "name": "Jebel Ali Port", "canonical": "Jebel Ali Port Terminal", "type": "infrastructure", "sector": "LOGISTICS", "emirate": "Dubai", "aliases": ["Jebel Ali", "Port of Jebel Ali", "JAFZA Terminal"]},
    {"id": "ENT_KHALIFA_PORT", "name": "Khalifa Port", "canonical": "Khalifa Port Deepwater Hub", "type": "infrastructure", "sector": "LOGISTICS", "emirate": "Abu Dhabi", "aliases": ["Khalifa Port", "KP Terminal", "KEZAD Port"]},
    {"id": "ENT_FUJAIRAH_PORT", "name": "Port of Fujairah", "canonical": "Port of Fujairah Strategic Bunkering Hub", "type": "infrastructure", "sector": "ENERGY", "emirate": "Fujairah", "aliases": ["Port of Fujairah", "Fujairah Oil Terminal", "FOIZ"]},
    {"id": "ENT_DXB", "name": "Dubai International Airport (DXB)", "canonical": "Dubai International Airport", "type": "infrastructure", "sector": "AVIATION", "emirate": "Dubai", "aliases": ["DXB", "Dubai Airport", "Dubai International"]},
    {"id": "ENT_AUH", "name": "Zayed International Airport (AUH)", "canonical": "Zayed International Airport Abu Dhabi", "type": "infrastructure", "sector": "AVIATION", "emirate": "Abu Dhabi", "aliases": ["AUH", "Zayed International", "Abu Dhabi Airport"]},
    
    # Technology / Projects
    {"id": "ENT_FALCON", "name": "Falcon LLM", "canonical": "Falcon Foundation Model Series", "type": "technology", "sector": "TECHNOLOGY", "emirate": "Abu Dhabi", "aliases": ["Falcon LLM", "Falcon 180B", "TII Falcon"]}
]

# Canonical UAE Locations & Geocoding Coordinates
CANONICAL_LOCATIONS = [
    {"id": "LOC_ABU_DHABI", "name": "Abu Dhabi", "canonical": "Abu Dhabi City", "lat": 24.4539, "lng": 54.3773, "emirate": "Abu Dhabi", "type": "CITY"},
    {"id": "LOC_DUBAI", "name": "Dubai", "canonical": "Dubai City", "lat": 25.2048, "lng": 55.2708, "emirate": "Dubai", "type": "CITY"},
    {"id": "LOC_SHARJAH", "name": "Sharjah", "canonical": "Sharjah City", "lat": 25.3463, "lng": 55.4209, "emirate": "Sharjah", "type": "CITY"},
    {"id": "LOC_FUJAIRAH", "name": "Fujairah", "canonical": "Fujairah City", "lat": 25.1288, "lng": 56.3265, "emirate": "Fujairah", "type": "CITY"},
    {"id": "LOC_RAK", "name": "Ras Al Khaimah", "canonical": "Ras Al Khaimah City", "lat": 25.7895, "lng": 55.9432, "emirate": "Ras Al Khaimah", "type": "CITY"},
    {"id": "LOC_AJMAN", "name": "Ajman", "canonical": "Ajman City", "lat": 25.4052, "lng": 55.5136, "emirate": "Ajman", "type": "CITY"},
    {"id": "LOC_UAQ", "name": "Umm Al Quwain", "canonical": "Umm Al Quwain City", "lat": 25.5647, "lng": 55.5552, "emirate": "Umm Al Quwain", "type": "CITY"},
    {"id": "LOC_BARAKAH", "name": "Barakah Nuclear Site", "canonical": "Barakah Al Dhafra", "lat": 23.9678, "lng": 52.2789, "emirate": "Abu Dhabi", "type": "ENERGY_FACILITY"},
    {"id": "LOC_JEBEL_ALI", "name": "Jebel Ali Free Zone & Port", "canonical": "Jebel Ali Port", "lat": 25.0112, "lng": 55.0617, "emirate": "Dubai", "type": "PORT"},
    {"id": "LOC_KHALIFA_PORT", "name": "Khalifa Port Logistics Hub", "canonical": "Khalifa Port Taweelah", "lat": 24.8105, "lng": 54.7291, "emirate": "Abu Dhabi", "type": "PORT"},
    {"id": "LOC_FUJAIRAH_PORT", "name": "Port of Fujairah Bunkering Hub", "canonical": "Port of Fujairah", "lat": 25.1783, "lng": 56.3639, "emirate": "Fujairah", "type": "PORT"},
    {"id": "LOC_DIFC", "name": "Dubai International Financial Centre", "canonical": "DIFC Dubai", "lat": 25.2105, "lng": 55.2818, "emirate": "Dubai", "type": "DISTRICT"},
    {"id": "LOC_ADGM", "name": "Abu Dhabi Global Market", "canonical": "ADGM Al Maryah Island", "lat": 24.5008, "lng": 54.3883, "emirate": "Abu Dhabi", "type": "DISTRICT"}
]

class IntelligencePipeline:
    """
    Production-grade intelligence extraction pipeline.
    Executes entity resolution, topic classification, location grounding,
    explainable importance calculation, confidence scoring, and event generation.
    """

    @classmethod
    def is_uae_relevant(cls, title: str, content: str = "") -> bool:
        full_text = f"{title} {content}".lower()
        uae_markers = [
            "uae", "united arab emirates", "dubai", "abu dhabi", "sharjah", "fujairah",
            "ras al khaimah", "ajman", "umm al quwain", "etihad", "emirati", "wam.ae", "dirham", "aed"
        ]
        return any(marker in full_text for marker in uae_markers)

    @classmethod
    def detect_emirate(cls, text: str) -> str:
        t_lower = text.lower()
        if "abu dhabi" in t_lower or "al dhafra" in t_lower or "al ain" in t_lower:
            return "Abu Dhabi"
        elif "dubai" in t_lower or "jebel ali" in t_lower or "deira" in t_lower or "difc" in t_lower:
            return "Dubai"
        elif "sharjah" in t_lower or "khorfakkan" in t_lower:
            return "Sharjah"
        elif "fujairah" in t_lower or "dibba" in t_lower:
            return "Fujairah"
        elif "ras al khaimah" in t_lower or "rak" in t_lower:
            return "Ras Al Khaimah"
        elif "ajman" in t_lower:
            return "Ajman"
        elif "umm al quwain" in t_lower or "uaq" in t_lower:
            return "Umm Al Quwain"
        return "UAE National"

    @classmethod
    def extract_entities(cls, text: str) -> List[Dict[str, Any]]:
        text_lower = text.lower()
        extracted: List[Dict[str, Any]] = []

        for entity in CANONICAL_ENTITIES:
            # Check main name and aliases
            matched = False
            matches_count = 0
            
            names_to_check = [entity["name"].lower(), entity["canonical"].lower()] + [a.lower() for a in entity.get("aliases", [])]
            for alias in names_to_check:
                pattern = r'\b' + re.escape(alias) + r'\b'
                found = len(re.findall(pattern, text_lower))
                if found > 0:
                    matched = True
                    matches_count += found

            if matched:
                extracted.append({
                    "entity_id": entity["id"],
                    "name": entity["name"],
                    "canonical_name": entity["canonical"],
                    "entity_type": entity["type"],
                    "sector": entity.get("sector"),
                    "emirate": entity.get("emirate"),
                    "confidence": 0.96,
                    "aliases": entity.get("aliases", []),
                    "mention_count": matches_count or 1
                })

        return extracted

    @classmethod
    def extract_locations(cls, text: str) -> List[Dict[str, Any]]:
        text_lower = text.lower()
        locations: List[Dict[str, Any]] = []

        for loc in CANONICAL_LOCATIONS:
            if loc["name"].lower() in text_lower or loc["canonical"].lower() in text_lower:
                locations.append({
                    "location_id": loc["id"],
                    "name": loc["name"],
                    "canonical_name": loc["canonical"],
                    "latitude": loc["lat"],
                    "longitude": loc["lng"],
                    "emirate": loc["emirate"],
                    "location_type": loc["type"],
                    "resolution_status": "RESOLVED",
                    "confidence": 0.98
                })

        return locations

    @classmethod
    def classify_topics(cls, text: str) -> List[Dict[str, Any]]:
        text_lower = text.lower()
        matched_topics: List[Dict[str, Any]] = []

        for topic in UAE_TOPIC_TAXONOMY:
            score = 0
            for kw in topic["keywords"]:
                if kw in text_lower:
                    score += 1
            if score > 0:
                confidence = min(0.65 + (score * 0.1), 0.98)
                matched_topics.append({
                    "topic_id": f"TOPIC_{topic['code']}",
                    "code": topic["code"],
                    "name": topic["name"],
                    "category_group": topic["category_group"],
                    "confidence": round(confidence, 2)
                })

        # Default fallback topic if none matched
        if not matched_topics:
            matched_topics.append({
                "topic_id": "TOPIC_ECON_MACRO",
                "code": "ECON_MACRO",
                "name": "Macroeconomics & D33",
                "category_group": "ECONOMY",
                "confidence": 0.70
            })

        # Sort by confidence
        matched_topics.sort(key=lambda x: x["confidence"], reverse=True)
        return matched_topics[:4]

    @classmethod
    def calculate_importance(
        cls, 
        title: str, 
        content: str, 
        entities: List[Dict[str, Any]], 
        topics: List[Dict[str, Any]]
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Explainable 0-100 Importance scoring based on verified dimensions:
        - Government / sovereign involvement
        - Economic magnitude
        - Critical infrastructure scope
        - National novelty / urgency
        """
        text = f"{title} {content}".lower()
        factors: Dict[str, float] = {}

        # 1. Government / Sovereign Involvement (0 - 30 pts)
        gov_keywords = ["decree", "cabinet", "ministry", "aida", "president", "ruler", "crown prince", "sovereign", "federal"]
        gov_hits = sum(1 for kw in gov_keywords if kw in text)
        has_gov_entity = any(e["entity_type"] == "government_entity" for e in entities)
        gov_score = min(gov_hits * 6 + (15 if has_gov_entity else 0), 30.0)
        factors["government_sovereign_involvement"] = round(gov_score, 1)

        # 2. Critical Infrastructure Impact (0 - 25 pts)
        infra_keywords = ["nuclear", "rail", "port", "grid", "pipeline", "airport", "freight", "bunkering", "power plant", "baseload"]
        infra_hits = sum(1 for kw in infra_keywords if kw in text)
        has_infra_entity = any(e["entity_type"] == "infrastructure" for e in entities)
        infra_score = min(infra_hits * 5 + (12 if has_infra_entity else 0), 25.0)
        factors["critical_infrastructure_scope"] = round(infra_score, 1)

        # 3. Economic & Financial Magnitude (0 - 25 pts)
        econ_keywords = ["billion", "trillion", "million", "gdp", "fdi", "investment", "trade", "d33", "cepa"]
        econ_hits = sum(1 for kw in econ_keywords if kw in text)
        econ_score = min(econ_hits * 6 + (10 if "billion" in text or "trillion" in text else 0), 25.0)
        factors["economic_magnitude"] = round(econ_score, 1)

        # 4. Scope and Multi-Emirate Span (0 - 20 pts)
        multi_emirate = ("abu dhabi" in text and "dubai" in text) or "national" in text or "nationwide" in text
        span_score = 18.0 if multi_emirate else 10.0
        factors["geographic_scope"] = round(span_score, 1)

        total_importance = min(max(sum(factors.values()), 15.0), 98.5)
        factors["total_calculated_score"] = round(total_importance, 1)

        return round(total_importance, 1), factors

    @classmethod
    def calculate_confidence(cls, source_name: str, has_entities: bool, has_locations: bool) -> Tuple[float, str]:
        """
        Calculates confidence score (0.0 to 1.0) and reasoning separate from importance.
        """
        score = 0.85
        reasons = ["Parsed via verified news schema"]

        if any(trusted in source_name.lower() for trusted in ["wam", "emirates news agency", "enec", "tamm", "etihad rail"]):
            score += 0.12
            reasons.append("Official UAE government/sovereign news agency source")
        
        if has_entities:
            score += 0.03
            reasons.append("Cross-referenced with UAE Canonical Entity Registry")
            
        if has_locations:
            score += 0.02
            reasons.append("Grounded in verified geospatial coordinates")

        final_score = min(round(score, 2), 0.99)
        return final_score, "; ".join(reasons)

    @classmethod
    def detect_event_candidate(
        cls, 
        title: str, 
        description: str, 
        emirate: str, 
        importance_score: float, 
        importance_factors: Dict[str, Any],
        confidence_score: float,
        topics: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Detects if an article represents a significant national event suitable for clustering.
        """
        if importance_score < 45.0:
            return None

        # Determine event type
        t_lower = title.lower()
        if "rail" in t_lower or "port" in t_lower or "nuclear" in t_lower or "capacity" in t_lower or "grid" in t_lower:
            event_type = "Infrastructure Milestone & Grid Dispatch"
        elif "ai" in t_lower or "aida" in t_lower or "mandate" in t_lower or "cloud" in t_lower:
            event_type = "Sovereign AI & Policy Directive"
        elif "trade" in t_lower or "d33" in t_lower or "billion" in t_lower or "cepa" in t_lower:
            event_type = "Strategic Economic & Trade Agreement"
        elif "manufacturing" in t_lower or "hub" in t_lower or "park" in t_lower:
            event_type = "Industrial Innovation & R&D Expansion"
        else:
            event_type = "National Strategic Announcement"

        return {
            "event_id": f"EVT_{uuid.uuid4().hex[:12].upper()}",
            "event_type": event_type,
            "title": title,
            "description": description or title,
            "emirate": emirate,
            "importance_score": importance_score,
            "importance_factors": importance_factors,
            "confidence_score": confidence_score,
            "confidence_reason": "Generated from multi-factor structured intelligence pipeline",
            "status": "ACTIVE"
        }
