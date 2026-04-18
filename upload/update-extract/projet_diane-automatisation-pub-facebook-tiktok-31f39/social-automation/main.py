"""
API FastAPI pour l'automatisation sociale
Endpoints pour gérer les campagnes, le contenu et les publications
"""
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.config import settings
from app.scheduler import Scheduler
from app.autopublisher import AutoPublisher
from app.models import ContentType, Platform

# Initialisation
app = FastAPI(
    title="Social Media Automation API",
    description="API pour automatiser la génération et publication de contenu sur Facebook et TikTok",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instances globales
scheduler = Scheduler()
auto_publisher = AutoPublisher()


# === Pydantic Models ===

class CampaignCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    posts_per_day_reels: int = 3
    posts_per_day_images: int = 3
    planning_days: int = 90
    hashtags: str  # 3 hashtags séparés par des virgules


class SocialPageAdd(BaseModel):
    platform: str  # "facebook" ou "tiktok"
    page_id: str
    page_name: str
    access_token: Optional[str] = None


class ContentScheduleCreate(BaseModel):
    reels_titles: List[str]
    images_titles: List[str]


class PromptGenerate(BaseModel):
    prompt: str
    content_type: str  # "image" ou "reel"
    title: str


# === Events ===

@app.on_event("startup")
async def startup_event():
    """Initialisation au démarrage"""
    await scheduler.init_db()
    await auto_publisher.start()
    print("🚀 Application démarrée avec succès!")


@app.on_event("shutdown")
async def shutdown_event():
    """Nettoyage à l'arrêt"""
    await auto_publisher.stop()


# === Endpoints ===

@app.get("/")
async def root():
    """Endpoint de bienvenue"""
    return {
        "message": "Bienvenue sur l'API d'Automatisation Sociale",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.post("/campaigns/", tags=["Campagnes"])
async def create_campaign(campaign: CampaignCreate):
    """Créer une nouvelle campagne de 90 jours"""
    try:
        new_campaign = await scheduler.create_campaign(
            title=campaign.title,
            description=campaign.description,
            posts_per_day_reels=campaign.posts_per_day_reels,
            posts_per_day_images=campaign.posts_per_day_images,
            planning_days=campaign.planning_days,
            hashtags=campaign.hashtags
        )
        
        return {
            "success": True,
            "campaign_id": new_campaign.id,
            "title": new_campaign.title,
            "planning_days": new_campaign.planning_days,
            "posts_per_day_reels": new_campaign.posts_per_day_reels,
            "posts_per_day_images": new_campaign.posts_per_day_images
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/campaigns/{campaign_id}/pages/", tags=["Campagnes"])
async def add_social_page(campaign_id: int, page: SocialPageAdd):
    """Ajouter une page sociale à une campagne"""
    try:
        new_page = await scheduler.add_social_page(
            campaign_id=campaign_id,
            platform=page.platform,
            page_id=page.page_id,
            page_name=page.page_name,
            access_token=page.access_token
        )
        
        return {
            "success": True,
            "page_id": new_page.id,
            "platform": new_page.platform.value,
            "page_name": new_page.page_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/campaigns/{campaign_id}/schedule/", tags=["Planification"])
async def generate_schedule(campaign_id: int, content: ContentScheduleCreate):
    """
    Générer le planning de contenu pour 90 jours
    
    Fournissez les titres pour les Reels et Images,
    le système générera automatiquement les prompts et planifiera les publications
    """
    try:
        result = await scheduler.generate_content_schedule(
            campaign_id=campaign_id,
            reels_titles=content.reels_titles,
            images_titles=content.images_titles
        )
        
        # Planifier les tâches de publication automatique
        await auto_publisher.schedule_campaign(campaign_id)
        
        return {
            "success": True,
            "message": f"Planning généré avec succès!",
            "details": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/campaigns/{campaign_id}/stats/", tags=["Campagnes"])
async def get_campaign_stats(campaign_id: int):
    """Obtenir les statistiques d'une campagne"""
    try:
        stats = await scheduler.get_campaign_stats(campaign_id)
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/", tags=["Génération IA"])
async def generate_content(data: PromptGenerate):
    """
    Générer du contenu à la demande (test)
    
    Utilise Pollinations AI pour les images (gratuit)
    Utilise Wan API pour les vidéos
    """
    from app.generator import AIGenerator
    
    generator = AIGenerator()
    
    try:
        if data.content_type == "image":
            filepath = await generator.generate_image(data.prompt, 0, data.title)
        elif data.content_type == "reel":
            filepath = await generator.generate_video(data.prompt, 0, data.title)
        else:
            raise HTTPException(status_code=400, detail="Type de contenu non supporté")
        
        if filepath:
            return {
                "success": True,
                "filepath": filepath,
                "message": "Contenu généré avec succès"
            }
        else:
            raise HTTPException(status_code=500, detail="Échec de génération")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/publish/{content_item_id}/", tags=["Publication"])
async def publish_now(content_item_id: int):
    """
    Publier immédiatement un contenu (pour test)
    
    Génère et publie le contenu sans attendre la date planifiée
    """
    try:
        results = await auto_publisher.publish_now(content_item_id)
        
        return {
            "success": True,
            "publications": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/content/pending/", tags=["Contenu"])
async def get_pending_content(limit: int = 10):
    """Récupérer le contenu en attente de publication"""
    try:
        items = await scheduler.get_pending_content(limit)
        
        return {
            "success": True,
            "count": len(items),
            "items": [
                {
                    "id": item.id,
                    "title": item.title,
                    "content_type": item.content_type.value,
                    "scheduled_date": item.scheduled_date.isoformat(),
                    "is_published": item.is_published
                }
                for item in items
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health/")
async def health_check():
    """Vérifier l'état de l'API"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


# Pour exécuter avec: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
