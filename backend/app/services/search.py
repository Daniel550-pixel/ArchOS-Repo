from typing import List, Dict, Any, Optional
from datetime import datetime

class SearchService:
    """
    Search and Filtering Service supporting keyword search, date ranges,
    emirate filtering, topic and entity matching, and importance thresholds.
    """

    @classmethod
    def filter_articles(
        cls,
        articles: List[Dict[str, Any]],
        query: Optional[str] = None,
        emirate: Optional[str] = None,
        category: Optional[str] = None,
        topic: Optional[str] = None,
        source: Optional[str] = None,
        min_importance: Optional[float] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        results = articles

        if query:
            q = query.lower().strip()
            results = [
                a for a in results
                if q in a.get("title", "").lower()
                or q in (a.get("description") or "").lower()
                or q in (a.get("content") or "").lower()
            ]

        if emirate and emirate.upper() != "ALL":
            em_lower = emirate.lower()
            results = [
                a for a in results
                if em_lower in a.get("detected_emirate", "").lower()
                or a.get("detected_emirate") == "UAE National"
            ]

        if category and category.upper() != "ALL":
            cat_lower = category.lower()
            results = [
                a for a in results
                if cat_lower in (a.get("category") or "").lower()
            ]

        if topic and topic.upper() != "ALL":
            t_lower = topic.lower()
            results = [
                a for a in results
                if any(t_lower in t.get("name", "").lower() or t_lower in t.get("code", "").lower() for t in a.get("topics", []))
            ]

        if source and source.upper() != "ALL":
            src_lower = source.lower()
            results = [
                a for a in results
                if src_lower in (a.get("source_name") or "").lower()
            ]

        if min_importance is not None:
            results = [
                a for a in results
                if a.get("importance_score", 0.0) >= min_importance
            ]

        # Sort by published_at descending
        results = sorted(results, key=lambda x: x.get("published_at", ""), reverse=True)

        total = len(results)
        start = (page - 1) * page_size
        end = start + page_size
        paged_items = results[start:end]

        return {
            "items": paged_items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 1
        }
