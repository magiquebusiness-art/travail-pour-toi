"""
Modèles de base de données
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()


class ContentType(enum.Enum):
    REEL = "reel"
    IMAGE = "image"


class Platform(enum.Enum):
    FACEBOOK = "facebook"
    TIKTOK = "tiktok"
    BOTH = "both"


class Campaign(Base):
    """Campagne de contenu pour 90 jours"""
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    posts_per_day_reels = Column(Integer, default=3)
    posts_per_day_images = Column(Integer, default=3)
    planning_days = Column(Integer, default=90)
    hashtags = Column(String(500))  # 3 hashtags séparés par des virgules
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relations
    content_items = relationship("ContentItem", back_populates="campaign", cascade="all, delete-orphan")
    pages = relationship("SocialPage", back_populates="campaign", cascade="all, delete-orphan")


class ContentItem(Base):
    """Contenu généré (Reel ou Image)"""
    __tablename__ = "content_items"
    
    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    content_type = Column(Enum(ContentType), nullable=False)
    title = Column(String(255), nullable=False)
    prompt = Column(Text, nullable=False)  # Prompt pour IA
    caption = Column(Text)  # Texte de publication
    generated_file_path = Column(String(500))  # Chemin du fichier généré
    scheduled_date = Column(DateTime, nullable=False)
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relation
    campaign = relationship("Campaign", back_populates="content_items")
    publications = relationship("Publication", back_populates="content_item", cascade="all, delete-orphan")


class SocialPage(Base):
    """Pages sociales connectées"""
    __tablename__ = "social_pages"
    
    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    platform = Column(Enum(Platform), nullable=False)
    page_id = Column(String(255), nullable=False)  # ID de la page Facebook ou TikTok
    page_name = Column(String(255))
    access_token = Column(String(500))  # Token spécifique à la page
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relation
    campaign = relationship("Campaign", back_populates="pages")
    publications = relationship("Publication", back_populates="page", cascade="all, delete-orphan")


class Publication(Base):
    """Publications effectuées"""
    __tablename__ = "publications"
    
    id = Column(Integer, primary_key=True)
    content_item_id = Column(Integer, ForeignKey("content_items.id"), nullable=False)
    page_id = Column(Integer, ForeignKey("social_pages.id"), nullable=False)
    platform_post_id = Column(String(255))  # ID du post sur la plateforme
    status = Column(String(50), default="pending")  # pending, published, failed
    error_message = Column(Text)
    published_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    content_item = relationship("ContentItem", back_populates="publications")
    page = relationship("SocialPage", back_populates="publications")
