from typing import Optional, List

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "UAE News Intelligence Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = Field(default="development")  # development, test, production

    # Secrets & API Keys
    # Secrets are intentionally unset by default. Production startup validation
    # below requires the values that are security-critical.
    NEWS_API_KEY: Optional[str] = Field(default=None)
    UAE_NEWS_API_KEY: Optional[str] = Field(default=None)
    NEWS_API_BASE_URL: str = Field(default="https://newsapi.org/v2")
    NEWS_COUNTRY: str = Field(default="ae")
    NEWS_LANGUAGE: str = Field(default="en")
    NEWS_FETCH_INTERVAL_MINUTES: int = Field(default=15)

    # Database
    # Local development may override this through .env. Production must provide
    # an explicit DATABASE_URL rather than using embedded credentials.
    DATABASE_URL: Optional[str] = Field(default=None)
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # AI Engine
    GEMINI_API_KEY: Optional[str] = Field(default=None)

    # Security & Admin
    # Never ship a usable admin credential in source code.
    ADMIN_API_KEY: Optional[str] = Field(default=None)
    CORS_ORIGINS: List[str] = Field(default_factory=list)

    # Ingestion rate limits & controls
    MAX_ARTICLES_PER_FETCH: int = 50
    REQUEST_TIMEOUT_SECONDS: int = 15

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=True,
    )

    @model_validator(mode="after")
    def validate_security_configuration(self) -> "Settings":
        environment = self.ENVIRONMENT.strip().lower()

        if environment not in {"development", "test", "production"}:
            raise ValueError("ENVIRONMENT must be development, test, or production")

        if environment == "production":
            missing = []

            if not self.ADMIN_API_KEY:
                missing.append("ADMIN_API_KEY")
            if not self.DATABASE_URL:
                missing.append("DATABASE_URL")
            if not self.CORS_ORIGINS:
                missing.append("CORS_ORIGINS")

            if missing:
                raise ValueError(
                    "Production configuration is missing required settings: "
                    + ", ".join(missing)
                )

            if "*" in self.CORS_ORIGINS:
                raise ValueError(
                    "CORS_ORIGINS must not contain '*' in production"
                )

            if self.ADMIN_API_KEY in {
                "",
                "changeme",
                "change-me",
                "secret",
                "sovereign_uae_admin_secret_key",
            }:
                raise ValueError("ADMIN_API_KEY must be a strong non-default secret")

            if "postgres:postgres@" in self.DATABASE_URL:
                raise ValueError(
                    "DATABASE_URL contains the default PostgreSQL credentials"
                )

        return self


settings = Settings()
