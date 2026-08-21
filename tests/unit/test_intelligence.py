import pytest
from app.pipelines.intelligence import IntelligencePipeline

def test_uae_relevance_filter():
    assert IntelligencePipeline.is_uae_relevant("Barakah Plant achieves grid synchronization in Abu Dhabi") is True
    assert IntelligencePipeline.is_uae_relevant("Local bakery in London wins award") is False

def test_emirate_detection():
    assert IntelligencePipeline.detect_emirate("Al Dhafra solar development in Abu Dhabi") == "Abu Dhabi"
    assert IntelligencePipeline.detect_emirate("DP World expands Jebel Ali port terminal in Dubai") == "Dubai"
    assert IntelligencePipeline.detect_emirate("Port of Fujairah crude bunkering expansion") == "Fujairah"

def test_canonical_entity_extraction():
    sample_text = "The Federal AI & Data Authority (AIDA) and Etihad Rail announced a strategic partnership with ADNOC in Abu Dhabi."
    entities = IntelligencePipeline.extract_entities(sample_text)
    
    entity_ids = [e["entity_id"] for e in entities]
    assert "ENT_AIDA" in entity_ids
    assert "ENT_ETIHAD_RAIL" in entity_ids
    assert "ENT_ADNOC" in entity_ids
    
    aida_ent = next(e for e in entities if e["entity_id"] == "ENT_AIDA")
    assert aida_ent["entity_type"] == "government_entity"
    assert aida_ent["canonical_name"] == "Federal AI and Data Authority"

def test_location_resolution():
    sample_text = "New container berths inaugurated at Jebel Ali Port and Barakah Nuclear Site."
    locations = IntelligencePipeline.extract_locations(sample_text)
    
    loc_ids = [loc["location_id"] for loc in locations]
    assert "LOC_JEBEL_ALI" in loc_ids
    assert "LOC_BARAKAH" in loc_ids
    
    barakah = next(l for l in locations if l["location_id"] == "LOC_BARAKAH")
    assert barakah["latitude"] == 23.9678
    assert barakah["longitude"] == 52.2789
    assert barakah["resolution_status"] == "RESOLVED"

def test_explainable_importance_scoring():
    title = "Cabinet Decree: UAE Federal AI Authority Mandates 50% Agentic AI Operations Across National Infrastructure"
    desc = "AED 10 Billion sovereign budget allocated under DGE and AIDA supervision."
    
    entities = IntelligencePipeline.extract_entities(f"{title} {desc}")
    topics = IntelligencePipeline.classify_topics(f"{title} {desc}")
    
    score, factors = IntelligencePipeline.calculate_importance(title, desc, entities, topics)
    assert score >= 75.0
    assert "government_sovereign_involvement" in factors
    assert "critical_infrastructure_scope" in factors
    assert "economic_magnitude" in factors

def test_confidence_scoring():
    conf_wam, reason_wam = IntelligencePipeline.calculate_confidence("Emirates News Agency (WAM)", True, True)
    assert conf_wam >= 0.95
    assert "Official UAE government" in reason_wam
