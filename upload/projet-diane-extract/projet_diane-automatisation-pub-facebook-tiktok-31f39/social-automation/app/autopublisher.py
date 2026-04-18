"""
Tâche planifiée pour publier automatiquement le contenu
Utilise APScheduler pour exécuter les publications aux heures programmées
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from datetime import datetime
from typing import Optional
import asyncio

from app.scheduler import Scheduler
from app.generator import AIGenerator
from app.publisher import SocialPublisher
from app.models import ContentType, Platform


class AutoPublisher:
    """Gère la publication automatique planifiée"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.content_scheduler = Scheduler()
        self.generator = AIGenerator()
        self.publisher = SocialPublisher()
        self.running = False
    
    async def start(self):
        """Démarre le planificateur"""
        if not self.running:
            self.scheduler.start()
            self.running = True
            print("✅ Planificateur de publications démarré")
    
    async def stop(self):
        """Arrête le planificateur"""
        if self.running:
            self.scheduler.shutdown()
            self.running = False
            print("⏹️ Planificateur de publications arrêté")
    
    async def schedule_content_generation(
        self,
        content_item_id: int,
        campaign_id: int,
        content_type: str,
        prompt: str,
        title: str,
        scheduled_time: datetime
    ):
        """Planifie la génération et publication d'un contenu"""
        
        async def generate_and_publish():
            try:
                print(f"🎨 Génération du contenu: {title}")
                
                # Générer le contenu
                if content_type == "image":
                    filepath = await self.generator.generate_image(prompt, campaign_id, title)
                    content_type_pub = "image"
                else:
                    filepath = await self.generator.generate_video(prompt, campaign_id, title)
                    content_type_pub = "video"
                
                if not filepath:
                    print(f"❌ Échec de génération pour: {title}")
                    return
                
                print(f"✅ Contenu généré: {filepath}")
                
                # Récupérer les pages sociales pour cette campagne
                async with self.content_scheduler.async_session() as session:
                    from sqlalchemy import select
                    from app.models import SocialPage
                    
                    result = await session.execute(
                        select(SocialPage).where(SocialPage.campaign_id == campaign_id)
                    )
                    pages = result.scalars().all()
                
                # Publier sur chaque page
                for page in pages:
                    print(f"📤 Publication sur {page.platform.value} - {page.page_name}")
                    
                    result = await self.publisher.publish_content(
                        platform=page.platform.value,
                        page_id=page.page_id,
                        content_path=filepath,
                        caption=f"{title}",  # La caption complète est dans ContentItem
                        content_type=content_type_pub
                    )
                    
                    if result["status"] == "published":
                        print(f"✅ Publié avec succès: {result['post_id']}")
                    else:
                        print(f"❌ Échec publication: {result.get('error')}")
                
                # Marquer comme publié
                await self.content_scheduler.mark_as_published(content_item_id)
                print(f"📝 Contenu marqué comme publié: {title}")
                
            except Exception as e:
                print(f"❌ Erreur dans generate_and_publish: {e}")
        
        # Ajouter la tâche au scheduler
        self.scheduler.add_job(
            generate_and_publish,
            trigger='date',
            run_date=scheduled_time,
            id=f"content_{content_item_id}",
            name=f"Generate & Publish: {title}"
        )
        
        print(f"📅 Tâche planifiée pour {scheduled_time}: {title}")
    
    async def schedule_campaign(self, campaign_id: int):
        """
        Planifie tous les contenus d'une campagne
        Appelé après la création du planning de contenu
        """
        async with self.content_scheduler.async_session() as session:
            from sqlalchemy import select
            from app.models import ContentItem
            
            result = await session.execute(
                select(ContentItem)
                .where(ContentItem.campaign_id == campaign_id)
                .order_by(ContentItem.scheduled_date)
            )
            content_items = result.scalars().all()
        
        for item in content_items:
            await self.schedule_content_generation(
                content_item_id=item.id,
                campaign_id=campaign_id,
                content_type=item.content_type.value,
                prompt=item.prompt,
                title=item.title,
                scheduled_time=item.scheduled_date
            )
        
        print(f"📅 {len(content_items)} tâches planifiées pour la campagne {campaign_id}")
    
    async def publish_now(self, content_item_id: int):
        """Publie immédiatement un contenu (pour test ou publication manuelle)"""
        async with self.content_scheduler.async_session() as session:
            from sqlalchemy import select
            from app.models import ContentItem, SocialPage
            
            # Récupérer le content item
            result = await session.execute(
                select(ContentItem).where(ContentItem.id == content_item_id)
            )
            item = result.scalar_one_or_none()
            
            if not item:
                raise ValueError(f"ContentItem {content_item_id} not found")
            
            # Récupérer les pages
            result = await session.execute(
                select(SocialPage).where(SocialPage.campaign_id == item.campaign_id)
            )
            pages = result.scalars().all()
        
        # Générer le contenu
        if item.content_type == ContentType.IMAGE:
            filepath = await self.generator.generate_image(item.prompt, item.campaign_id, item.title)
            content_type_pub = "image"
        else:
            filepath = await self.generator.generate_video(item.prompt, item.campaign_id, item.title)
            content_type_pub = "video"
        
        if not filepath:
            raise Exception("Échec de génération du contenu")
        
        # Publier sur chaque page
        results = []
        for page in pages:
            result = await self.publisher.publish_content(
                platform=page.platform.value,
                page_id=page.page_id,
                content_path=filepath,
                caption=item.caption or item.title,
                content_type=content_type_pub
            )
            results.append({
                "platform": page.platform.value,
                "page_name": page.page_name,
                "status": result["status"],
                "post_id": result["post_id"]
            })
        
        # Marquer comme publié
        await self.content_scheduler.mark_as_published(content_item_id)
        
        return results
