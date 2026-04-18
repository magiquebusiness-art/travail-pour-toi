"""
Générateur de contenu IA
- Wan API pour les vidéos
- Pollinations AI pour les images
"""
import httpx
import aiofiles
from datetime import datetime
from typing import Optional, List
from app.config import settings
import os


class AIGenerator:
    """Générateur de contenu IA"""
    
    def __init__(self):
        self.wan_api_key = settings.wan_api_key
        self.wan_api_url = settings.wan_api_url
        self.pollinations_url = settings.pollinations_api_url
        
    async def generate_image(self, prompt: str, campaign_id: int, title: str) -> Optional[str]:
        """
        Génère une image avec Pollinations AI (gratuit)
        Retourne le chemin du fichier sauvegardé
        """
        try:
            # Construire l'URL Pollinations
            encoded_prompt = prompt.replace(" ", "%20")
            image_url = f"{self.pollinations_url}/{encoded_prompt}"
            
            # Télécharger l'image
            async with httpx.AsyncClient() as client:
                response = await client.get(image_url, timeout=60.0)
                response.raise_for_status()
                
                # Sauvegarder l'image
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"campaign_{campaign_id}_{title.replace(' ', '_')}_{timestamp}.jpg"
                filepath = f"static/images/{filename}"
                
                # Créer le dossier si nécessaire
                os.makedirs("static/images", exist_ok=True)
                
                async with aiofiles.open(filepath, 'wb') as f:
                    await f.write(response.content)
                
                return filepath
                
        except Exception as e:
            print(f"Erreur génération image: {e}")
            return None
    
    async def generate_video(self, prompt: str, campaign_id: int, title: str) -> Optional[str]:
        """
        Génère une vidéo avec Wan API
        Retourne le chemin du fichier sauvegardé
        """
        try:
            headers = {
                "Authorization": f"Bearer {self.wan_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "prompt": prompt,
                "duration": 15,  # secondes
                "resolution": "1080x1920",  # Format Reel/TikTok
                "fps": 30
            }
            
            async with httpx.AsyncClient() as client:
                # Soumettre la requête de génération
                response = await client.post(
                    f"{self.wan_api_url}/generate",
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                task_id = data.get("task_id")
                if not task_id:
                    raise Exception("Pas de task_id dans la réponse")
                
                # Polling pour attendre la fin de la génération
                video_url = await self._wait_for_video(task_id, headers)
                
                if video_url:
                    # Télécharger la vidéo
                    video_response = await client.get(video_url, timeout=120.0)
                    video_response.raise_for_status()
                    
                    # Sauvegarder la vidéo
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"campaign_{campaign_id}_{title.replace(' ', '_')}_{timestamp}.mp4"
                    filepath = f"static/videos/{filename}"
                    
                    os.makedirs("static/videos", exist_ok=True)
                    
                    async with aiofiles.open(filepath, 'wb') as f:
                        await f.write(video_response.content)
                    
                    return filepath
            
            return None
            
        except Exception as e:
            print(f"Erreur génération vidéo: {e}")
            return None
    
    async def _wait_for_video(self, task_id: str, headers: dict, max_attempts: int = 60) -> Optional[str]:
        """Attendre que la vidéo soit prête"""
        async with httpx.AsyncClient() as client:
            for attempt in range(max_attempts):
                response = await client.get(
                    f"{self.wan_api_url}/status/{task_id}",
                    headers=headers,
                    timeout=10.0
                )
                data = response.json()
                
                status = data.get("status")
                
                if status == "completed":
                    return data.get("video_url")
                elif status == "failed":
                    raise Exception("Échec de la génération vidéo")
                
                # Attendre 5 secondes avant le prochain check
                import asyncio
                await asyncio.sleep(5)
        
        raise TimeoutError("Timeout génération vidéo")
    
    async def generate_content_batch(
        self,
        content_type: str,
        prompts: List[str],
        campaign_id: int,
        titles: List[str]
    ) -> List[dict]:
        """
        Génère un lot de contenu
        Retourne une liste de résultats avec chemins
        """
        results = []
        
        for prompt, title in zip(prompts, titles):
            if content_type == "image":
                filepath = await self.generate_image(prompt, campaign_id, title)
            else:  # reel/video
                filepath = await self.generate_video(prompt, campaign_id, title)
            
            results.append({
                "prompt": prompt,
                "title": title,
                "filepath": filepath,
                "success": filepath is not None
            })
        
        return results
