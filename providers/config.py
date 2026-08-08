# providers/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    CHANNEL_SECRET: str
    CHANNEL_ID: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()