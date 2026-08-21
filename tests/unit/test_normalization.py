import pytest
from app.pipelines.normalization import canonicalize_url, compute_content_hash, clean_text

def test_canonicalize_url():
    url_with_tracking = "https://www.wam.ae/en/article/12345?utm_source=twitter&utm_medium=social&fbclid=abcde&ref=feed#anchor"
    clean = canonicalize_url(url_with_tracking)
    assert "utm_source" not in clean
    assert "fbclid" not in clean
    assert "https://www.wam.ae/en/article/12345" == clean

def test_compute_content_hash_idempotence():
    title = "Barakah Nuclear Plant Dispatches 5.6 GW Power"
    desc = "All 4 APR-1400 units are now commercially active."
    url = "https://enec.gov.ae/barakah"
    
    hash1 = compute_content_hash(title, desc, url)
    hash2 = compute_content_hash(title, desc, url)
    assert hash1 == hash2
    assert len(hash1) == 64

def test_compute_content_hash_whitespace_insensitive():
    h1 = compute_content_hash("Barakah Nuclear Plant", "Content here", "https://enec.gov.ae")
    h2 = compute_content_hash("  BARAKAH   NUCLEAR PLANT  ", "content here", "https://enec.gov.ae")
    assert h1 == h2

def test_clean_text():
    raw_html = "<p>Abu Dhabi — <b>AIDA</b> announces <i>50% agentic transition</i>.</p>"
    cleaned = clean_text(raw_html)
    assert cleaned == "Abu Dhabi — AIDA announces 50% agentic transition."
