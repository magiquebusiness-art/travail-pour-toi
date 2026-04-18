"""
Planificateur de contenu
Génère le calendrier de publication pour 90 jours
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import List, Optional
import random

from app.models import Base, Campaign, ContentItem, SocialPage, ContentType, Platform
from app.config import settings


class Scheduler:
    """Planificateur de contenu pour campagnes"""
    
    def __init__(self):
        self.engine = create_async_engine(settings.database_url)
        self.async_session = sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )
    
    async def init_db(self):
        """Initialise la base de données"""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    async def create_campaign(
        self,
        title: str,
        description: str,
        posts_per_day_reels: int,
        posts_per_day_images: int,
        planning_days: int,
        hashtags: str
    ) -> Campaign:
        """Crée une nouvelle campagne"""
        async with self.async_session() as session:
            campaign = Campaign(
                title=title,
                description=description,
                posts_per_day_reels=posts_per_day_reels,
                posts_per_day_images=posts_per_day_images,
                planning_days=planning_days,
                hashtags=hashtags
            )
            session.add(campaign)
            await session.commit()
            await session.refresh(campaign)
            return campaign
    
    async def add_social_page(
        self,
        campaign_id: int,
        platform: str,
        page_id: str,
        page_name: str,
        access_token: Optional[str] = None
    ) -> SocialPage:
        """Ajoute une page sociale à une campagne"""
        async with self.async_session() as session:
            page = SocialPage(
                campaign_id=campaign_id,
                platform=Platform(platform),
                page_id=page_id,
                page_name=page_name,
                access_token=access_token or settings.facebook_access_token
            )
            session.add(page)
            await session.commit()
            await session.refresh(page)
            return page
    
    def _generate_prompts_from_title(self, title: str, count: int, content_type: str) -> List[str]:
        """Génère des variantes de prompts à partir d'un titre"""
        # Templates pour diversifier le contenu
        image_templates = [
            f"Professional photo of {title}, high quality, vibrant colors",
            f"Artistic representation of {title}, modern style, eye-catching",
            f"Minimalist design featuring {title}, clean aesthetic",
            f"Creative concept art for {title}, trending on social media",
            f"Dynamic composition about {title}, engaging visual",
            f"Stunning imagery of {title}, perfect for Instagram",
            f"Bold and colorful {title} theme, viral potential",
            f"Elegant portrayal of {title}, sophisticated style",
            f"Fun and playful {title} scene, lighthearted mood",
            f"Inspiring visualization of {title}, motivational content"
        ]
        
        video_templates = [
            f"Short video clip showing {title}, dynamic movement, engaging",
            f"Cinematic reel about {title}, smooth transitions, professional",
            f"Trending TikTok style video for {title}, catchy visuals",
            f"Behind the scenes of {title}, authentic moment",
            f"Quick tutorial featuring {title}, informative and fun",
            f"Time-lapse of {title}, mesmerizing effect",
            f"Before and after {title}, transformation video",
            f"Day in the life with {title}, relatable content",
            f"Top moments of {title}, highlight reel",
            f"Creative storytelling about {title}, narrative arc"
        ]
        
        templates = video_templates if content_type == "reel" else image_templates
        
        # Sélectionner et varier les templates
        prompts = []
        for i in range(count):
            template = templates[i % len(templates)]
            # Ajouter une variation
            variations = [
                "",
                " with bright lighting",
                " during golden hour",
                " with modern aesthetics",
                " in urban setting",
                " with natural elements"
            ]
            prompts.append(template + random.choice(variations))
        
        return prompts
    
    async def generate_content_schedule(
        self,
        campaign_id: int,
        reels_titles: List[str],
        images_titles: List[str]
    ) -> dict:
        """
        Génère le planning de contenu pour 90 jours
        reels_titles: liste des titres pour les reels
        images_titles: liste des titres pour les images
        """
        async with self.async_session() as session:
            # Récupérer la campagne
            result = await session.execute(select(Campaign).where(Campaign.id == campaign_id))
            campaign = result.scalar_one_or_none()
            
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")
            
            start_date = datetime.now()
            total_days = campaign.planning_days
            
            reels_per_day = campaign.posts_per_day_reels
            images_per_day = campaign.posts_per_day_images
            
            # Générer les prompts
            reels_prompts = self._generate_prompts_from_title(
                reels_titles[0] if reels_titles else "Amazing content",
                len(reels_titles) or (reels_per_day * total_days),
                "reel"
            )
            
            images_prompts = self._generate_prompts_from_title(
                images_titles[0] if images_titles else "Beautiful image",
                len(images_titles) or (images_per_day * total_days),
                "image"
            )
            
            created_items = []
            
            # Créer les items Reels
            for day in range(total_days):
                for post_num in range(reels_per_day):
                    idx = (day * reels_per_day + post_num) % len(reels_prompts)
                    
                    # Calculer l'horaire de publication (réparti dans la journée)
                    hour = 9 + (post_num * 4)  # 9h, 13h, 17h
                    scheduled_time = start_date + timedelta(days=day, hours=hour)
                    
                    title = reels_titles[idx % len(reels_titles)] if reels_titles else f"Reel Day {day+1} #{post_num+1}"
                    
                    content_item = ContentItem(
                        campaign_id=campaign_id,
                        content_type=ContentType.REEL,
                        title=title,
                        prompt=reels_prompts[idx],
                        caption=f"{title}\n\n{self._format_caption(campaign.hashtags)}",
                        scheduled_date=scheduled_time
                    )
                    session.add(content_item)
                    created_items.append(content_item)
            
            # Créer les items Images
            for day in range(total_days):
                for post_num in range(images_per_day):
                    idx = (day * images_per_day + post_num) % len(images_prompts)
                    
                    # Décaler les images par rapport aux reels
                    hour = 11 + (post_num * 4)  # 11h, 15h, 19h
                    scheduled_time = start_date + timedelta(days=day, hours=hour)
                    
                    title = images_titles[idx % len(images_titles)] if images_titles else f"Image Day {day+1} #{post_num+1}"
                    
                    content_item = ContentItem(
                        campaign_id=campaign_id,
                        content_type=ContentType.IMAGE,
                        title=title,
                        prompt=images_prompts[idx],
                        caption=f"{title}\n\n{self._format_caption(campaign.hashtags)}",
                        scheduled_date=scheduled_time
                    )
                    session.add(content_item)
                    created_items.append(content_item)
            
            await session.commit()
            
            return {
                "campaign_id": campaign_id,
                "total_items": len(created_items),
                "reels_count": total_days * reels_per_day,
                "images_count": total_days * images_per_day,
                "days": total_days
            }
    
    def _format_caption(self, hashtags: str) -> str:
        """Formate les hashtags pour la légende"""
        if not hashtags:
            return ""
        
        # Séparer les hashtags par des virgules ou espaces
        tags = [tag.strip() for tag in hashtags.replace(",", " ").split()]
        # Ajouter le # si manquant
        formatted_tags = [tag if tag.startswith("#") else f"#{tag}" for tag in tags[:3]]
        return " ".join(formatted_tags)
    
    async def get_pending_content(self, limit: int = 10) -> List[ContentItem]:
        """Récupère le contenu en attente de publication"""
        async with self.async_session() as session:
            result = await session.execute(
                select(ContentItem)
                .where(ContentItem.is_published == False)
                .where(ContentItem.scheduled_date <= datetime.now())
                .order_by(ContentItem.scheduled_date)
                .limit(limit)
            )
            return list(result.scalars().all())
    
    async def mark_as_published(self, content_item_id: int):
        """Marque un contenu comme publié"""
        async with self.async_session() as session:
            result = await session.execute(
                select(ContentItem).where(ContentItem.id == content_item_id)
            )
            item = result.scalar_one_or_none()
            
            if item:
                item.is_published = True
                item.published_at = datetime.now()
                await session.commit()
    
    async def get_campaign_stats(self, campaign_id: int) -> dict:
        """Obtient les statistiques d'une campagne"""
        async with self.async_session() as session:
            # Récupérer la campagne
            result = await session.execute(
                select(Campaign).where(Campaign.id == campaign_id)
            )
            campaign = result.scalar_one_or_none()
            
            if not campaign:
                return {"error": "Campagne non trouvée"}
            
            # Récupérer les items de contenu
            result = await session.execute(
                select(ContentItem).where(ContentItem.campaign_id == campaign_id)
            )
            items = result.scalars().all()
            
            # Récupérer les pages connectées
            result = await session.execute(
                select(SocialPage).where(SocialPage.campaign_id == campaign_id)
            )
            pages = result.scalars().all()
            
            total = len(items)
            published = sum(1 for item in items if item.is_published)
            pending = total - published
            
            reels = sum(1 for item in items if item.content_type == ContentType.REEL)
            images = sum(1 for item in items if item.content_type == ContentType.IMAGE)
            
            # Formater les pages pour la réponse
            pages_data = [
                {
                    "id": page.id,
                    "platform": page.platform.value,
                    "page_id": page.page_id,
                    "page_name": page.page_name,
                    "is_active": page.is_active
                }
                for page in pages
            ]
            
            return {
                "total": total,
                "published": published,
                "pending": pending,
                "reels": reels,
                "images": images,
                "progress": round((published / total * 100) if total > 0 else 0, 2),
                "pages": pages_data,
                "campaign_title": campaign.title,
                "posts_per_day_reels": campaign.posts_per_day_reels,
                "posts_per_day_images": campaign.posts_per_day_images
            }
