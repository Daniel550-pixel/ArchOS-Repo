"""
Dubai Pulse / Dubai Data adapter.
Production path: register at the Dubai Pulse developer portal, obtain
client_id/secret, and set dataset slugs issued to your tenant.
Without credentials the adapter degrades gracefully to open data
(World Bank / Open-Meteo / OSM) so the system never hard-fails.
"""
import os, httpx

class DubaiPulseClient:
    def __init__(self):
        self.client_id = os.getenv("PULSE_CLIENT_ID")
        self.client_secret = os.getenv("PULSE_CLIENT_SECRET")
        self.base = os.getenv("PULSE_BASE_URL", "https://api.dubaipulse.gov.ae")
        self._token = None

    @property
    def enabled(self): return bool(self.client_id and self.client_secret)

    async def token(self) -> str:
        if self._token: return self._token
        async with httpx.AsyncClient() as c:
            r = await c.post(f"{self.base}/oauth2/token", data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            })
            r.raise_for_status()
            self._token = r.json()["access_token"]
            return self._token

    async def dataset(self, slug: str, limit=100):
        tok = await self.token()
        async with httpx.AsyncClient() as c:
            r = await c.get(f"{self.base}/v1/datasets/{slug}/records",
                            headers={"Authorization": f"Bearer {tok}"},
                            params={"limit": limit})
            r.raise_for_status()
            return r.json()

async def open_data_fallback(topic: str):
    """Honest fallback when Pulse creds are absent."""
    if topic == "macro":
        async with httpx.AsyncClient() as c:
            r = await c.get("https://api.worldbank.org/v2/country/AE/indicator/NY.GDP.MKTP.CD?format=json&date=2022:2023")
            return {"source": "worldbank", "data": r.json()}
    if topic == "climate":
        async with httpx.AsyncClient() as c:
            r = await c.get("https://api.open-meteo.com/v1/forecast?latitude=25.2048&longitude=55.2708&current=temperature_2m,wind_speed_10m")
            return {"source": "open-meteo", "data": r.json()}
    return {"source": "none", "data": None}

pulse = DubaiPulseClient()
