import ZAI from 'z-ai-web-dev-sdk';
import * as fs from 'fs';

async function generateLogo() {
  console.log('🎨 Génération du logo AffiliationPro...');
  
  const zai = await ZAI.create();
  
  const response = await zai.images.generations.create({
    prompt: 'Minimalist premium logo for AffiliationPro brand. Clean modern design with elegant purple and gold stars. Dark background. Professional tech company logo. Vector style, clean lines, sophisticated, sparkle stars only',
    size: '1024x1024'
  });
  
  const buffer = Buffer.from(response.data[0].base64, 'base64');
  fs.writeFileSync('/home/z/ai-saas-builder/public/logo.png', buffer);
  console.log('✅ Logo saved to /home/z/ai-saas-builder/public/logo.png');
}

generateLogo().catch(console.error);
