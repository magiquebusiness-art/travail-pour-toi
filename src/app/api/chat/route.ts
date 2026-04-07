export const runtime = 'edge'
// Alias route pour compatibilité avec nyxia-closer.js
// Redirige vers /api/nyxia-chat
import { POST as nyxiaChatPost } from '@/app/api/nyxia-chat/route'

export { nyxiaChatPost as POST }
