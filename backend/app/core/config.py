from typing import Optional, List

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "UAE News Intelligence Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = Field(default="development")

    NEWS_API_KEY: Optional[str] = Field(default=None)
    UAE_NEWS_API_KEY: Optional[str] = Field(default=None)
    NEWS_API_BASE_URL: str = Field(default="https://newsapi.org/v2")
    NEWS_COUNTRY: str = Field(default="ae")
    NEWS_LANGUAGE: str = Field(default="en")
    NEWS_FETCH_INTERVAL_MINUTES: int = Field(default=15)

    DATABASE_URL: Optional[str] = Field(default=None)
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    GEMINI_API_KEY: Optional[str] = Field(default=None)
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None)
    ARCHOS_CLAUDE_MODEL: str = Field(default="claude-sonnet-4-6")
    OX_ALPHA_API_KEY: Optional[str] = Field(default=None)
    OX_ALPHA_BASE_URL: str = Field(default="https://openrouter.ai/api/v1")
    ARCHOS_OX_ALPHA_MODEL: str = Field(default="stealth/ox-alpha")
    OX_ALPHA_TIMEOUT_SECONDS: float = Field(default=45.0)

    ADMIN_API_KEY: Optional[str] = Field(default=None)
    JWT_SECRET: Optional[str] = Field(default=None)
    CORS_ORIGINS: List[str] = Field(default_factory=list)

    WEBAUTHN_RP_NAME: str = "ArchOS"
    WEBAUTHN_RP_ID: str = "localhost"
    WEBAUTHN_ORIGIN: str = "https://localhost"
    ALLOW_INSECURE_AUTH_FALLBACKS: bool = False

    MAX_ARTICLES_PER_FETCH: int = 50
    REQUEST_TIMEOUT_SECONDS: int = 15

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=True)

    @model_validator(mode="after")
    def validate_security_configuration(self) -> "Settings":
        environment = self.ENVIRONMENT.strip().lower()
        if environment not in {"development", "test", "production"}:
            raise ValueError("ENVIRONMENT must be development, test, or production")
        if environment == "production":
            missing = []
            if not self.ADMIN_API_KEY: missing.append("ADMIN_API_KEY")
            if not self.JWT_SECRET: missing.append("JWT_SECRET")
            if not self.DATABASE_URL: missing.append("DATABASE_URL")
            if not self.CORS_ORIGINS: missing.append("CORS_ORIGINS")
            if missing: raise ValueError("Production configuration is missing required settings: " + ", ".join(missing))
            if "*" in self.CORS_ORIGINS: raise ValueError("CORS_ORIGINS must not contain '*' in production")
            if len(self.ADMIN_API_KEY) < 32 or len(self.JWT_SECRET) < 32: raise ValueError("ADMIN_API_KEY and JWT_SECRET must be at least 32 characters")
            if self.ADMIN_API_KEY.lower() in {"changeme", "change-me", "secret"}: raise ValueError("ADMIN_API_KEY must be a strong non-default secret")
            if self.JWT_SECRET.lower() in {"changeme", "change-me", "secret"}: raise ValueError("JWT_SECRET must be a strong non-default secret")
            if "postgres:postgres@" in self.DATABASE_URL: raise ValueError("DATABASE_URL contains the default PostgreSQL credentials")
            if self.ALLOW_INSECURE_AUTH_FALLBACKS: raise ValueError("Insecure authentication fallbacks are forbidden in production")
        return self


settings = Settings()
