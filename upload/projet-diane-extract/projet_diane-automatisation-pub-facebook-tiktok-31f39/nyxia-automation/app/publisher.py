"""
Gestionnaire de publications pour réseaux sociaux
- Facebook (Graph API)
- TikTok (API)
"""
import httpx
from datetime import datetime
from typing import Optional, List
from app.config import settings
import os


class SocialPublisher:
    """Publie du contenu sur les réseaux sociaux"""
    
    def __init__(self):
        self.facebook_token = settings.facebook_access_token
        self.tiktok_token = settings.tiktok_access_token
    
    async def publish_to_facebook(
        self,
        page_id: str,
        content_path: str,
        caption: str,
        content_type: str = "image"
    ) -> Optional[str]:
        """
        Publie sur Facebook Page
        Retourne l'ID du post ou None en cas d'échec
        """
        try:
            access_token = self.facebook_token
            
            if content_type == "image":
                # Publication image
                url = f"https://graph.facebook.com/{page_id}/photos"
                
                async with httpx.AsyncClient() as client:
                    with open(content_path, 'rb') as f:
                        files = {'source': f}
                        data = {
                            'caption': caption,
                            'access_token': access_token
                        }
                        response = await client.post(url, files=files, data=data)
                    
                    response.raise_for_status()
                    result = response.json()
                    return result.get('id')
            
            elif content_type == "video":
                # Publication vidéo (Reel)
                url = f"https://graph.facebook.com/{page_id}/videos"
                
                async with httpx.AsyncClient() as client:
                    with open(content_path, 'rb') as f:
                        files = {'source': f}
                        data = {
                            'description': caption,
                            'access_token': access_token,
                            'published': 'true'
                        }
                        response = await client.post(url, files=files, data=data)
                    
                    response.raise_for_status()
                    result = response.json()
                    return result.get('id')
            
            return None
            
        except Exception as e:
            print(f"Erreur publication Facebook: {e}")
            return None
    
    async def publish_to_tiktok(
        self,
        content_path: str,
        caption: str,
        privacy_level: str = "PUBLIC_TO_EVERYONE"
    ) -> Optional[str]:
        """
        Publie sur TikTok
        Retourne l'ID du post ou None en cas d'échec
        Note: L'API TikTok nécessite un flux OAuth plus complexe
        """
        try:
            # Initialisation du upload
            init_url = "https://open.tiktokapis.com/v2/post/publish/video/init/"
            
            headers = {
                "Authorization": f"Bearer {self.tiktok_token}",
                "Content-Type": "application/json; charset=UTF-8"
            }
            
            file_size = os.path.getsize(content_path)
            
            payload = {
                "post_info": {
                    "title": caption[:150],  # Limite TikTok
                    "privacy_level": privacy_level,
                    "disable_duet": False,
                    "disable_comment": False,
                    "disable_stitch": False
                },
                "source_info": {
                    "source": "FILE_UPLOAD",
                    "video_size": file_size,
                    "chunk_size": file_size,
                    "total_chunk_count": 1
                }
            }
            
            async with httpx.AsyncClient() as client:
                # Init upload
                response = await client.post(init_url, json=payload, headers=headers)
                response.raise_for_status()
                init_data = response.json()
                
                upload_url = init_data.get("data", {}).get("upload_url")
                video_id = init_data.get("data", {}).get("video_id")
                
                if not upload_url or not video_id:
                    raise Exception("URL d'upload non reçue")
                
                # Upload du fichier
                with open(content_path, 'rb') as f:
                    video_data = f.read()
                
                upload_headers = {
                    "Authorization": f"Bearer {self.tiktok_token}",
                    "Content-Type": "video/mp4"
                }
                
                upload_response = await client.put(upload_url, content=video_data, headers=upload_headers)
                upload_response.raise_for_status()
                
                # Finaliser l'upload
                final_url = "https://open.tiktokapis.com/v2/post/publish/video/final/"
                final_payload = {"video_id": video_id}
                
                final_response = await client.post(final_url, json=final_payload, headers=headers)
                final_response.raise_for_status()
                
                return video_id
            
        except Exception as e:
            print(f"Erreur publication TikTok: {e}")
            return None
    
    async def publish_content(
        self,
        platform: str,
        page_id: str,
        content_path: str,
        caption: str,
        content_type: str
    ) -> dict:
        """
        Publie du contenu sur la plateforme spécifiée
        Retourne un dict avec status et post_id
        """
        if platform == "facebook":
            post_id = await self.publish_to_facebook(page_id, content_path, caption, content_type)
        elif platform == "tiktok":
            post_id = await self.publish_to_tiktok(content_path, caption)
        else:
            return {"status": "failed", "post_id": None, "error": "Plateforme non supportée"}
        
        return {
            "status": "published" if post_id else "failed",
            "post_id": post_id,
            "error": None if post_id else "Échec de publication"
        }
