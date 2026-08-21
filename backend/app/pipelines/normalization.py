import hashlib
import re
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
from typing import Tuple

def canonicalize_url(url: str) -> str:
    """
    Remove tracking query parameters (utm_*, fbclid, etc.) and standardize URLs.
    """
    if not url:
        return ""
    try:
        parsed = urlparse(url.strip())
        # Filter query params
        tracked_params = {"utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "ref"}
        query_pairs = [(k, v) for k, v in parse_qsl(parsed.query) if k.lower() not in tracked_params]
        clean_query = urlencode(query_pairs)
        
        # Standardize scheme and netloc to lowercase, strip trailing slash
        path = parsed.path.rstrip("/")
        clean_url = urlunparse((
            parsed.scheme.lower() or "https",
            parsed.netloc.lower(),
            path,
            parsed.params,
            clean_query,
            "" # strip fragment
        ))
        return clean_url
    except Exception:
        return url.strip()

def compute_content_hash(title: str, content: str = "", canonical_url: str = "") -> str:
    """
    Compute cryptographic SHA-256 hash for robust deduplication.
    Normalizes whitespace and casing before hashing.
    """
    normalized_title = re.sub(r'\s+', ' ', (title or "").lower().strip())
    # Take first 300 chars of normalized content
    normalized_content = re.sub(r'\s+', ' ', (content or "").lower().strip())[:300]
    normalized_url = canonical_url.lower().strip()
    
    hash_input = f"{normalized_title}|{normalized_content}|{normalized_url}"
    return hashlib.sha256(hash_input.encode('utf-8')).hexdigest()

def clean_text(text: str) -> str:
    """
    Strip HTML tags, extraneous whitespace, and clean encoding artifacts.
    """
    if not text:
        return ""
    # Strip HTML tags
    cleaned = re.sub(r'<[^>]+>', ' ', text)
    # Normalize multiple whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned
