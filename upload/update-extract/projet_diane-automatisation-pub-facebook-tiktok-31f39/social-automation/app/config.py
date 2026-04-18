"""
Configuration de l'application
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Wan API
    wan_api_key: str = ""
    wan_api_url: str = "https://api.wan.video/v1"
    
    # Pollinations AI
    pollinations_api_url: str = "https://image.pollinations.ai/prompt"
    
    # Facebook Graph API
    facebook_app_id: str = ""
    facebook_app_secret: str = ""
    facebook_access_token: str = ""
    
    # TikTok API
    tiktok_client_key: str = ""
    tiktok_client_secret: str = ""
    tiktok_access_token: str = ""
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./data/automation.db"
    
    # Application
    secret_key: str = "change-me-in-production"
    debug: bool = True
    
    # Default parameters
    default_posts_per_day_reels: int = 3
    default_posts_per_day_images: int = 3
    planning_days: int = 90
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
