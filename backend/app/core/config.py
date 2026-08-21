from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "UAE News Intelligence Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT") # development, test, production
    
    # Secrets & API Keys (Isolated in Backend)
    NEWS_API_KEY: Optional[str] = Field(default=None, env="NEWS_API_KEY")
    UAE_NEWS_API_KEY: Optional[str] = Field(default=None, env="UAE_NEWS_API_KEY")
    NEWS_API_BASE_URL: str = Field(default="https://newsapi.org/v2", env="NEWS_API_BASE_URL")
    NEWS_COUNTRY: str = Field(default="ae", env="NEWS_COUNTRY")
    NEWS_LANGUAGE: str = Field(default="en", env="NEWS_LANGUAGE")
    NEWS_FETCH_INTERVAL_MINUTES: int = Field(default=15, env="NEWS_FETCH_INTERVAL")
    
    # Database
    DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/uae_intelligence", env="DATABASE_URL")
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # AI Engine (Gemini)
    GEMINI_API_KEY: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    
    # Security & Admin
    ADMIN_API_KEY: str = Field(default="sovereign_uae_admin_secret_key", env="ADMIN_API_KEY")
    CORS_ORIGINS: List[str] = ["*"]
    
    # Ingestion rate limits & controls
    MAX_ARTICLES_PER_FETCH: int = 50
    REQUEST_TIMEOUT_SECONDS: int = 15

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
