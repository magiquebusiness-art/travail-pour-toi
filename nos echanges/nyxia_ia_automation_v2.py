# -*- coding: utf-8 -*-
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak,
                                 Table, TableStyle)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Fonts ──
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')

# ── Palette ──
ACCENT       = colors.HexColor('#278fb1')
ACCENT2      = colors.HexColor('#1a6d8a')
TEXT_PRIMARY  = colors.HexColor('#1c1e1f')
TEXT_MUTED    = colors.HexColor('#6d7379')
BG_SURFACE   = colors.HexColor('#d5d9de')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

OUTPUT = '/home/z/my-project/download/NyXia_IA_Automation.pdf'

doc = SimpleDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=2.0*cm, rightMargin=2.0*cm,
    topMargin=2.5*cm, bottomMargin=2.5*cm,
)
W = A4[0] - 4.0*cm  # available width

# ── Styles ──
s_title   = ParagraphStyle('Title', fontName='Times New Roman', fontSize=30, leading=38, textColor=ACCENT, alignment=TA_CENTER, spaceAfter=4)
s_subtitle= ParagraphStyle('Subtitle', fontName='Calibri', fontSize=14, leading=20, textColor=TEXT_MUTED, alignment=TA_CENTER, spaceAfter=6)
s_meta    = ParagraphStyle('Meta', fontName='Calibri', fontSize=11, leading=16, textColor=TEXT_MUTED, alignment=TA_CENTER)
s_h1      = ParagraphStyle('H1', fontName='Times New Roman', fontSize=18, leading=24, textColor=ACCENT, spaceBefore=18, spaceAfter=10)
s_h2      = ParagraphStyle('H2', fontName='Times New Roman', fontSize=14, leading=20, textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=8)
s_h3      = ParagraphStyle('H3', fontName='Times New Roman', fontSize=12, leading=17, textColor=ACCENT2, spaceBefore=10, spaceAfter=6)
s_body    = ParagraphStyle('Body', fontName='Calibri', fontSize=10.5, leading=17, textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=6)
s_bullet  = ParagraphStyle('Bullet', parent=s_body, leftIndent=20, bulletIndent=8, spaceBefore=2, spaceAfter=2)
s_th      = ParagraphStyle('TH', fontName='Times New Roman', fontSize=10, leading=14, textColor=colors.white, alignment=TA_CENTER)
s_td      = ParagraphStyle('TD', fontName='Calibri', fontSize=10, leading=14, textColor=TEXT_PRIMARY, alignment=TA_CENTER)
s_td_l    = ParagraphStyle('TDL', parent=s_td, alignment=TA_LEFT)
s_caption = ParagraphStyle('Cap', fontName='Calibri', fontSize=9, leading=13, textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=3, spaceAfter=6)

def tbl(data, widths, cap=None):
    t = Table(data, colWidths=widths, hAlign='CENTER')
    cmds = [
        ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0,0), (-1,0), TABLE_HEADER_TEXT),
        ('GRID', (0,0), (-1,-1), 0.5, TEXT_MUTED),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 8), ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]
    for i in range(1, len(data)):
        cmds.append(('BACKGROUND', (0,i), (-1,i), TABLE_ROW_EVEN if i%2==1 else TABLE_ROW_ODD))
    t.setStyle(TableStyle(cmds))
    els = [Spacer(1,18), t]
    if cap: els.append(Paragraph(cap, s_caption))
    els.append(Spacer(1,18))
    return els

story = []

# ═══════════════════════════════════════════
# COVER
# ═══════════════════════════════════════════
story.append(Spacer(1, 140))
story.append(Paragraph('<b>NyXia IA Automation</b>', s_title))
story.append(Spacer(1, 8))
story.append(Paragraph('Systeme d Automation Intelligent Multicanal', s_subtitle))
story.append(Spacer(1, 20))
ln = Table([['']], colWidths=[W*0.5])
ln.setStyle(TableStyle([('LINEBELOW',(0,0),(-1,-1),2,ACCENT),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0)]))
story.append(ln)
story.append(Spacer(1, 30))
story.append(Paragraph('Projet autonome - Version Beta', s_meta))
story.append(Spacer(1, 8))
story.append(Paragraph('Conception, architecture et roadmap', s_meta))
story.append(Spacer(1, 8))
story.append(Paragraph('20 avril 2026', s_meta))
story.append(PageBreak())

# ═══════════════════════════════════════════
# TOC
# ═══════════════════════════════════════════
story.append(Paragraph('<b>Table des Matieres</b>', ParagraphStyle('TOCT', fontName='Times New Roman', fontSize=18, leading=24, textColor=ACCENT, alignment=TA_LEFT, spaceAfter=16)))
for item in [
    '1. Vision et Positionnement',
    '2. Volume et Type de Contenu',
    '3. Plateformes Cibles',
    '4. Outils de Creation de Contenu',
    '5. Voix Off - DeniseNeural via Edge TTS',
    '6. Structure d une Publication',
    '7. Integration ManyChat',
    '8. Possibilites Etendues',
    '9. Acces API - Statut',
    '10. Architecture Technique',
    '11. Modele Economique',
    '12. Questions en Suspens',
    '13. Prochaines Etapes',
]:
    story.append(Paragraph(item, ParagraphStyle('TOCI', fontName='Calibri', fontSize=11, leading=22, textColor=TEXT_PRIMARY, leftIndent=10)))
story.append(PageBreak())

# ═══════════════════════════════════════════
# 1. VISION
# ═══════════════════════════════════════════
story.append(Paragraph('<b>1. Vision et Positionnement</b>', s_h1))
story.append(Paragraph(
    'NyXia IA Automation est un systeme d automation intelligent multicanal concu pour generer, planifier '
    'et publier du contenu sur l ensemble des plateformes sociales et au-dela. L objectif est de remplacer '
    'les heures de travail manuel de gestion de presence digitale par un pipeline automatise de bout en bout, '
    'depuis la creation du contenu jusqu a sa publication programmee sur les differents canaux.', s_body))
story.append(Paragraph(
    'Le systeme va bien au-dela de la simple publication sur les reseaux sociaux. Il couvre la creation de '
    'tout type de contenu digital : images, videos avec voix off, textes optimises pour l engagement, emails '
    'marketing, articles de blog, copies publicitaires, scripts pour webinaires, et bien plus. Chaque element '
    'est genere automatiquement en respectant les codes visuels et textuels de la marque, les bonnes pratiques '
    'de chaque plateforme, et les objectifs strategiques definis par l utilisateur.', s_body))
story.append(Paragraph(
    'Le projet est developpe comme une application autonome, separee de NyXia Z. Cette decision strategique '
    'permet de concevoir et tester le systeme en beta sans risquer d affecter la plateforme principale. Une fois '
    'la version beta validee et fonctionnelle, une integration dans l ecosysteme NyXia sera envisagee. Le systeme '
    'est concu pour etre evolutif : de nouvelles plateformes, formats et fonctionnalites pourront etre ajoutes '
    'sans refonte majeure de l architecture.', s_body))

# ═══════════════════════════════════════════
# 2. VOLUME
# ═══════════════════════════════════════════
story.append(Paragraph('<b>2. Volume et Type de Contenu</b>', s_h1))
story.append(Paragraph(
    'Le volume de publication cible est ambitieux mais realisable grace a l automatisation complete du pipeline. '
    'Chaque jour, le systeme genere et programme automatiquement 6 publications reparties en deux categories. '
    'Ce rythme soutenu vise a maintenir une presence constante et maximiser la portee organique sur les plateformes.', s_body))
story.extend(tbl([
    [Paragraph('<b>Type</b>',s_th), Paragraph('<b>Par jour</b>',s_th), Paragraph('<b>Semaine</b>',s_th), Paragraph('<b>Mois</b>',s_th)],
    [Paragraph('Texte + Image',s_td_l), Paragraph('4',s_td), Paragraph('28',s_td), Paragraph('112',s_td)],
    [Paragraph('Video + Texte',s_td_l), Paragraph('2',s_td), Paragraph('14',s_td), Paragraph('56',s_td)],
    [Paragraph('<b>Total</b>',s_td_l), Paragraph('<b>6</b>',s_td), Paragraph('<b>42</b>',s_td), Paragraph('<b>168</b>',s_td)],
], [W*0.35,W*0.20,W*0.22,W*0.23], 'Tableau 1 : Volume de publication mensuel'))
story.append(Paragraph(
    'Ce volume est parametrable selon les besoins de chaque client. Certains pourraient necessiter 2 publications '
    'par jour, d autres 10 ou plus. Le systeme s adapte a la demande sans effort manuel supplementaire.', s_body))

# ═══════════════════════════════════════════
# 3. PLATEFORMES
# ═══════════════════════════════════════════
story.append(Paragraph('<b>3. Plateformes Cibles</b>', s_h1))
story.append(Paragraph(
    'Le systeme cible les principales plateformes sociales et digitales. Chaque plateforme a ses propres '
    'specificites techniques, formats acceptes et limites que le systeme gere automatiquement. Les plateformes '
    'sont divisees en trois phases de priorite.', s_body))

story.append(Paragraph('<b>3.1 Phase 1 - Reseaux Sociaux Principaux</b>', s_h2))
story.extend(tbl([
    [Paragraph('<b>Plateforme</b>',s_th), Paragraph('<b>Formats</b>',s_th), Paragraph('<b>Statut API</b>',s_th)],
    [Paragraph('Facebook',s_td_l), Paragraph('Profil, Pages multiples, Groupes, Stories',s_td_l), Paragraph('En attente - Validation Meta Business (charte requise)',s_td_l)],
    [Paragraph('Instagram',s_td_l), Paragraph('Posts, Reels, Stories (multi-comptes)',s_td_l), Paragraph('En attente - Lie a Meta Business',s_td_l)],
    [Paragraph('TikTok',s_td_l), Paragraph('Videos, Stories',s_td_l), Paragraph('A faire - Inscription TikTok for Developers',s_td_l)],
    [Paragraph('YouTube',s_td_l), Paragraph('Videos, Shorts, Community Posts',s_td_l), Paragraph('A faire - Google Developer Console + API v3',s_td_l)],
], [W*0.18,W*0.38,W*0.44], 'Tableau 2 : Plateformes Phase 1'))

story.append(Paragraph('<b>3.2 Phase 2 - Reseaux Complementaires</b>', s_h2))
story.extend(tbl([
    [Paragraph('<b>Plateforme</b>',s_th), Paragraph('<b>Formats</b>',s_th), Paragraph('<b>Potentiel</b>',s_th)],
    [Paragraph('LinkedIn',s_td_l), Paragraph('Posts, Articles, Newsletter',s_td_l), Paragraph('B2B, positionnement professionnel, lead gen',s_td_l)],
    [Paragraph('Pinterest',s_td_l), Paragraph('Pins, Idea Pins, Boards',s_td_l), Paragraph('SEO visuel, drive traffic longue duree',s_td_l)],
    [Paragraph('Threads',s_td_l), Paragraph('Posts textuels',s_td_l), Paragraph('Communaute, discussions, engagement',s_td_l)],
], [W*0.18,W*0.35,W*0.47], 'Tableau 3 : Plateformes Phase 2'))

story.append(Paragraph('<b>3.3 Phase 3 - Au-dela des Reseaux Sociaux</b>', s_h2))
story.append(Paragraph(
    'Le systeme pourra egalement generer du contenu pour les canaux suivants : emails marketing et newsletters '
    '(sujet + corps optimises), articles de blog optimises SEO, descriptions de produits pour e-commerce, '
    'copies publicitaires pour Facebook Ads et Google Ads, scripts pour videos de presentation et webinaires, '
    'contenu pour cours en ligne, et landing pages. Cette extension transforme le systeme en un hub centralise '
    'de creation de contenu digital.', s_body))

# ═══════════════════════════════════════════
# 4. OUTILS DE CREATION
# ═══════════════════════════════════════════
story.append(Paragraph('<b>4. Outils de Creation de Contenu</b>', s_h1))
story.append(Paragraph(
    'Tous les outils de creation sont gratuits et open source. Aucun cout par generation, aucun credit a acheter, '
    'aucune limitation volumetrique. Le modele economique est entierement base sur la valeur du service.', s_body))

story.append(Paragraph('<b>4.1 Wan - Generation d Images et Videos</b>', s_h2))
story.append(Paragraph(
    'Wan est le moteur central du systeme. Il est deja operationnel dans NyXia Z et couvre les deux besoins '
    'principaux de creation visuelle : generation d images et generation de videos. Wan genere des images de '
    'haute qualite a partir de prompts textuels, et des sequences video de maximum 15 secondes avec audio '
    'ambiant natif. Wan est open source et entierement gratuit, sans limite de generation.', s_body))

story.append(Paragraph('<b>4.2 Repurposing Automatique</b>', s_h2))
story.append(Paragraph(
    'A partir d une seule video generee par Wan, le systeme redimensionne automatiquement le contenu pour '
    'chaque plateforme : 9:16 pour TikTok, Reels et Shorts, 1:1 pour Instagram Posts, 16:9 pour YouTube. '
    'Un texte adapte est genere pour accompagner chaque version. Le repurposing est entirely automatique et '
    'permet de multiplier la presence sur les plateformes a partir d un seul contenu de base.', s_body))

story.extend(tbl([
    [Paragraph('<b>Outil</b>',s_th), Paragraph('<b>Type</b>',s_th), Paragraph('<b>Cout</b>',s_th), Paragraph('<b>Details</b>',s_th)],
    [Paragraph('Wan',s_td_l), Paragraph('Images + Videos',s_td), Paragraph('Gratuit',s_td), Paragraph('Deja dans NyXia Z, images HD, videos 15 sec max, audio inclus',s_td_l)],
    [Paragraph('edge-tts',s_td_l), Paragraph('Voix off',s_td), Paragraph('Gratuit',s_td), Paragraph('Voix DeniseNeural, fichier MP3, Python',s_td_l)],
    [Paragraph('FFmpeg',s_td_l), Paragraph('Mixage audio',s_td), Paragraph('Gratuit',s_td), Paragraph('Mixage video Wan + voix off, redimensionnement multi-format',s_td_l)],
    [Paragraph('LLM',s_td_l), Paragraph('Texte',s_td), Paragraph('Variable',s_td), Paragraph('Generation titres, CTA, corps, hashtags, scripts',s_td_l)],
], [W*0.18,W*0.16,W*0.12,W*0.54], 'Tableau 4 : Outils de creation de contenu'))

# ═══════════════════════════════════════════
# 5. VOIX OFF
# ═══════════════════════════════════════════
story.append(Paragraph('<b>5. Voix Off - DeniseNeural via Edge TTS</b>', s_h1))
story.append(Paragraph(
    'La voix DeniseNeural (fr-CA-DeniseNeural) est la voix off selectionnee pour les videos. La solution '
    'validee est le package Python edge-tts qui genere des fichiers audio MP3 de haute qualite en se '
    'connectant directement aux serveurs Microsoft.', s_body))

story.append(Paragraph('<b>5.1 Pourquoi edge-tts fonctionne ici</b>', s_h2))
story.append(Paragraph(
    'Les tests precedents avec Edge TTS sur NyXia Z ont revele deux bloquants en temps reel : Cloudflare Workers '
    'ne peut pas se connecter a des WebSockets externes, et les navigateurs rejettent les connexions WebSocket '
    'vers Microsoft a cause de l en-tete Origin. Pour la creation de videos, le contexte est different : '
    'edge-tts en Python se connecte directement aux serveurs Microsoft sans aucune restriction. Pas de '
    'limitation de plateforme, pas de dependance a un service tiers.', s_body))

story.append(Paragraph('<b>5.2 Mixage Audio Video + Voix Off</b>', s_h2))
story.append(Paragraph(
    'Wan genere nativement des videos avec un audio ambiant. Le systeme conserve cet audio et y superpose '
    'la voix off DeniseNeural. Le volume de l audio original est reduit a 30% pour laisser la narration '
    'clairement audible tout en conservant l immersion sonore.', s_body))

story.extend(tbl([
    [Paragraph('<b>Etape</b>',s_th), Paragraph('<b>Action</b>',s_th), Paragraph('<b>Outil</b>',s_th)],
    [Paragraph('1',s_td), Paragraph('Generation de la video avec audio original',s_td_l), Paragraph('Wan',s_td)],
    [Paragraph('2',s_td), Paragraph('Generation de la narration MP3',s_td_l), Paragraph('edge-tts',s_td)],
    [Paragraph('3',s_td), Paragraph('Reduction volume audio original a 30%',s_td_l), Paragraph('FFmpeg',s_td)],
    [Paragraph('4',s_td), Paragraph('Superposition voix off + export final',s_td_l), Paragraph('FFmpeg',s_td)],
], [W*0.10,W*0.60,W*0.30], 'Tableau 5 : Processus de mixage audio'))

# ═══════════════════════════════════════════
# 6. STRUCTURE PUBLICATION
# ═══════════════════════════════════════════
story.append(Paragraph('<b>6. Structure d une Publication</b>', s_h1))
story.append(Paragraph(
    'Chaque publication respecte une structure strictement definie pour maximiser l engagement et declencher '
    'des commentaires qui activent ManyChat pour la conversion automatique.', s_body))
story.extend(tbl([
    [Paragraph('<b>Element</b>',s_th), Paragraph('<b>Description</b>',s_th), Paragraph('<b>Objectif</b>',s_th)],
    [Paragraph('Titre Stop-Scroll',s_td_l), Paragraph('Phrase d accroche percutante en premiere ligne',s_td_l), Paragraph('Arreter le defilement et capter l attention',s_td_l)],
    [Paragraph('Corps du texte',s_td_l), Paragraph('Message principal, valeur ajoutee, information',s_td_l), Paragraph('Delivrer le message et apporter de la valeur',s_td_l)],
    [Paragraph('CTA fort',s_td_l), Paragraph('Appel a l action oriente engagement/commentaire',s_td_l), Paragraph('Declencher un commentaire pour ManyChat',s_td_l)],
    [Paragraph('Hashtags',s_td_l), Paragraph('Exactement 3 hashtags optimises algorithme',s_td_l), Paragraph('Maximiser la portee organique',s_td_l)],
], [W*0.22,W*0.40,W*0.38], 'Tableau 6 : Structure type d une publication'))
story.append(Paragraph(
    'Le CTA est l element le plus strategique. Il encourage les utilisateurs a laisser un commentaire specifique '
    'qui servira de declencheur pour ManyChat. L outil intervient automatiquement en message prive pour engager '
    'la conversation et conduire l utilisateur le long du funnel de conversion.', s_body))

# ═══════════════════════════════════════════
# 7. MANYCHAT
# ═══════════════════════════════════════════
story.append(Paragraph('<b>7. Integration ManyChat</b>', s_h1))
story.append(Paragraph(
    'ManyChat est la piece maitresse de la strategie de conversion. Chaque publication inclut un CTA concu '
    'pour provoquer un commentaire. Lorsqu un commentaire est detecte, ManyChat intervient automatiquement '
    'en message prive (Facebook Messenger, Instagram DM). Le systeme genere des CTA compatibles avec les '
    'declencheurs ManyChat configures. Par exemple, si ManyChat reagit au mot-cle "INFO", le CTA genere '
    'incite les utilisateurs a commenter ce mot-cle precis.', s_body))
story.append(Paragraph(
    'ManyChat offre des fonctionnalites avancees exploitables : flows de conversation personnalises, sequences '
    'automatisees multi-etapes, segmentation d audience basee sur les interactions, et analytics de performance. '
    'Le systeme pourrait se parametrer avec differentes campagnes selon le type de contenu publie, dirigeant '
    'les utilisateurs vers differentes offres ou entonnoirs de conversion.', s_body))

# ═══════════════════════════════════════════
# 8. POSSIBILITES ETENDUES
# ═══════════════════════════════════════════
story.append(Paragraph('<b>8. Possibilites Etendues</b>', s_h1))
story.append(Paragraph(
    'Au-dela de la publication sur les reseaux sociaux, le systeme peut couvrir un large spectre de '
    'fonctionnalites qui transforment NyXia IA Automation en un hub centralise de creation de contenu digital.', s_body))

story.append(Paragraph('<b>8.1 Automation Intelligente</b>', s_h2))
story.append(Paragraph(
    'Le systeme peut integrer des mecanismes d intelligence pour optimiser automatiquement la performance. '
    'La detection de tendances permet d identifier les sujets populaires en temps reel et de generer du '
    'contenu pertinent automatiquement. L A/B testing des titres et CTA permet de comparer differentes '
    'versions et de retenir les plus performantes. L analyse de l engagement permet d ajuster automatiquement '
    'les horaires de publication, les tonalites et les formats pour maximiser la portee et les interactions.', s_body))

story.append(Paragraph('<b>8.2 Types de Contenu</b>', s_h2))
story.extend(tbl([
    [Paragraph('<b>Type</b>',s_th), Paragraph('<b>Description</b>',s_th), Paragraph('<b>Usage</b>',s_th)],
    [Paragraph('Posts texte + image',s_td_l), Paragraph('Visuels Wan + texte optimise',s_td_l), Paragraph('Facebook, Instagram, LinkedIn',s_td_l)],
    [Paragraph('Videos avec voix off',s_td_l), Paragraph('Video Wan + narration DeniseNeural',s_td_l), Paragraph('TikTok, Reels, Shorts',s_td_l)],
    [Paragraph('Stories',s_td_l), Paragraph('Contenu ephemere, polls, questions',s_td_l), Paragraph('Instagram, Facebook, TikTok',s_td_l)],
    [Paragraph('Carrousels',s_td_l), Paragraph('Slides multi-pages avec visuels',s_td_l), Paragraph('Instagram, LinkedIn',s_td_l)],
    [Paragraph('Emails marketing',s_td_l), Paragraph('Sujet + corps optimises conversion',s_td_l), Paragraph('Newsletters, sequences email',s_td_l)],
    [Paragraph('Articles SEO',s_td_l), Paragraph('Articles de blog optimises',s_td_l), Paragraph('Blog, WordPress, Medium',s_td_l)],
    [Paragraph('Copies publicitaires',s_td_l), Paragraph('Texte Ads optimises CTR',s_td_l), Paragraph('Facebook Ads, Google Ads',s_td_l)],
    [Paragraph('Scripts video',s_td_l), Paragraph('Scripts webinaires et tuto',s_td_l), Paragraph('YouTube, webinaires, cours',s_td_l)],
    [Paragraph('Descriptions produits',s_td_l), Paragraph('Texte e-commerce optimise',s_td_l), Paragraph('Boutique, Shopify',s_td_l)],
    [Paragraph('Landing page copy',s_td_l), Paragraph('Titres, CTA, sections',s_td_l), Paragraph('Pages de vente, funnels',s_td_l)],
], [W*0.22,W*0.40,W*0.38], 'Tableau 7 : Types de contenu generables'))

story.append(Paragraph('<b>8.3 Business et Conversion</b>', s_h2))
story.append(Paragraph(
    'Le systeme couvre l ensemble du funnel de conversion : generation de leads via CTA orientes commentaires, '
    'nurturing automatique via ManyChat, creation de contenu pour chaque etape du funnel (sensibilisation, '
    'consideration, decision), reporting automatique des performances, et integration CRM pour le suivi des '
    'prospects. NyXia IA Automation n est pas un simple outil de publication mais un veritable systeme de '
    'marketing digital automatise.', s_body))

# ═══════════════════════════════════════════
# 9. ACCES API
# ═══════════════════════════════════════════
story.append(Paragraph('<b>9. Acces API - Statut</b>', s_h1))
story.append(Paragraph(
    'L acces aux API est une precondition pour la publication automatisee. Le developpement peut commencer '
    'sans les API car la generation de contenu est independante de la couche de publication.', s_body))
story.extend(tbl([
    [Paragraph('<b>Plateforme</b>',s_th), Paragraph('<b>Statut</b>',s_th), Paragraph('<b>Action requise</b>',s_th)],
    [Paragraph('Facebook / Instagram',s_td_l), Paragraph('En attente',s_td), Paragraph('Validation Meta Business avec charte d entreprise',s_td_l)],
    [Paragraph('TikTok',s_td_l), Paragraph('Non demarre',s_td), Paragraph('Inscription TikTok for Developers',s_td_l)],
    [Paragraph('YouTube / Google',s_td_l), Paragraph('Non demarre',s_td), Paragraph('Google Developer Console + API v3',s_td_l)],
    [Paragraph('LinkedIn',s_td_l), Paragraph('Non demarre',s_td), Paragraph('LinkedIn Marketing API',s_td_l)],
    [Paragraph('Pinterest',s_td_l), Paragraph('Non demarre',s_td), Paragraph('Pinterest API v5',s_td_l)],
], [W*0.22,W*0.15,W*0.63], 'Tableau 8 : Statut d acces aux API'))

# ═══════════════════════════════════════════
# 10. ARCHITECTURE TECHNIQUE
# ═══════════════════════════════════════════
story.append(Paragraph('<b>10. Architecture Technique</b>', s_h1))
story.append(Paragraph(
    'L architecture repose entierement sur l ecosysteme Cloudflare, deja utilise pour NyXia Z. Aucun service '
    'externe supplementaire n est necessaire. Tout est gratuit et gere dans un seul environnement unifie.', s_body))

story.append(Paragraph('<b>10.1 Stack Technique Cloudflare</b>', s_h2))
story.extend(tbl([
    [Paragraph('<b>Composant</b>',s_th), Paragraph('<b>Service Cloudflare</b>',s_th), Paragraph('<b>Role</b>',s_th)],
    [Paragraph('Backend / API',s_td_l), Paragraph('Cloudflare Workers (Node.js)',s_td_l), Paragraph('Logique metier, routes API, traitement des donnees',s_td_l)],
    [Paragraph('Base de donnees',s_td_l), Paragraph('Cloudflare D1 (SQLite)',s_td_l), Paragraph('Stockage publications, configs, logs, templates',s_td_l)],
    [Paragraph('Stockage configs',s_td_l), Paragraph('Cloudflare KV',s_td_l), Paragraph('Variables d env, tokens API, cache',s_td_l)],
    [Paragraph('Frontend',s_td_l), Paragraph('Cloudflare Pages',s_td_l), Paragraph('Interface Next.js, calendrier, dashboard',s_td_l)],
    [Paragraph('Scheduling',s_td_l), Paragraph('Cloudflare Queues / Cron',s_td_l), Paragraph('Publication automatique aux heures programmee',s_td_l)],
    [Paragraph('Stockage fichiers',s_td_l), Paragraph('Cloudflare R2',s_td_l), Paragraph('Stockage images, videos, fichiers audio generes',s_td_l)],
], [W*0.20,W*0.32,W*0.48], 'Tableau 9 : Stack technique Cloudflare'))

story.append(Paragraph('<b>10.2 Pipeline de Creation et Publication</b>', s_h2))
story.append(Paragraph(
    'Le pipeline complet fonctionne de la maniere suivante : le systeme genere le contenu (image ou video via Wan, '
    'texte via LLM, voix off via edge-tts), assemble les elements si necessaire (mixage FFmpeg pour les videos), '
    'stocke les fichiers dans R2 et les metadonnees dans D1, puis le scheduler Cloudflare Queues declenche '
    'la publication aux heures programmee en appelant les API des plateformes cibles. L utilisateur peut '
    'visualiser, modifier et approuver le contenu avant publication via l interface Cloudflare Pages.', s_body))

story.extend(tbl([
    [Paragraph('<b>Etape</b>',s_th), Paragraph('<b>Action</b>',s_th), Paragraph('<b>Technologie</b>',s_th)],
    [Paragraph('1',s_td), Paragraph('Generation image ou video',s_td_l), Paragraph('Wan (Cloudflare Worker)',s_td)],
    [Paragraph('2',s_td), Paragraph('Generation texte (titre, corps, CTA, hashtags)',s_td_l), Paragraph('LLM (API externe)',s_td)],
    [Paragraph('3',s_td), Paragraph('Generation voix off MP3 (si video)',s_td_l), Paragraph('edge-tts (Python)',s_td)],
    [Paragraph('4',s_td), Paragraph('Mixage audio video + voix off (si video)',s_td_l), Paragraph('FFmpeg',s_td)],
    [Paragraph('5',s_td), Paragraph('Repurposing multi-format (si necessaire)',s_td_l), Paragraph('FFmpeg + Worker',s_td)],
    [Paragraph('6',s_td), Paragraph('Stockage fichiers + metadonnees',s_td_l), Paragraph('R2 + D1',s_td)],
    [Paragraph('7',s_td), Paragraph('Planification dans le calendrier',s_td_l), Paragraph('D1 + Interface',s_td)],
    [Paragraph('8',s_td), Paragraph('Publication automatique a l heure prevue',s_td_l), Paragraph('Cloudflare Queues + API plateforme',s_td)],
], [W*0.08,W*0.55,W*0.37], 'Tableau 10 : Pipeline complet de creation et publication'))

story.append(Paragraph('<b>10.3 Module Calendrier</b>', s_h2))
story.append(Paragraph(
    'Le calendrier est le centre de l organisation. Interface interactive de type calendrier mensuel et hebdomadaire '
    'developpee en Next.js sur Cloudflare Pages. Permet de planifier, visualiser, deplacer et approuver les '
    'publications. Le systeme gere automatiquement les fuseaux horaires et propose les meilleures plages de '
    'publication selon les plateformes.', s_body))

story.append(Paragraph('<b>10.4 Moteur de Publication</b>', s_h2))
story.append(Paragraph(
    'Le moteur de publication gere l envoi vers chaque plateforme via Cloudflare Workers. Il respecte les '
    'specificites techniques de chaque API (format, dimensions, limites), gere les tokens d authentification '
    'et leur renouvellement, implemente les retries en cas d echec, et produit des logs detailles. Ce module '
    'est branche en dernier car il depend de l acces aux API.', s_body))

# ═══════════════════════════════════════════
# 11. MODELE ECONOMIQUE
# ═══════════════════════════════════════════
story.append(Paragraph('<b>11. Modele Economique</b>', s_h1))
story.append(Paragraph(
    'Le cout de production est quasi nul. Tous les outils sont gratuits et open source. Le seul cout recurrent '
    'est l hebergement deja existant. La marge sur chaque abonnement client est proche de 100%.', s_body))
story.extend(tbl([
    [Paragraph('<b>Element</b>',s_th), Paragraph('<b>Cout mensuel</b>',s_th), Paragraph('<b>Notes</b>',s_th)],
    [Paragraph('Creation contenu (Wan)',s_td_l), Paragraph('0 $',s_td), Paragraph('Open source, gratuit, sans limite',s_td_l)],
    [Paragraph('Voix off (edge-tts)',s_td_l), Paragraph('0 $',s_td), Paragraph('Gratuit, connexion directe Microsoft',s_td_l)],
    [Paragraph('Mixage (FFmpeg)',s_td_l), Paragraph('0 $',s_td), Paragraph('Open source',s_td_l)],
    [Paragraph('Infrastructure Cloudflare',s_td_l), Paragraph('0 $',s_td), Paragraph('Free tier genereux, deja utilise',s_td_l)],
    [Paragraph('API plateformes',s_td_l), Paragraph('0 $',s_td), Paragraph('Publication via API gratuite',s_td_l)],
    [Paragraph('LLM (texte)',s_td_l), Paragraph('Variable',s_td), Paragraph('Seul cout potentiel (generation textes)',s_td_l)],
], [W*0.28,W*0.20,W*0.52], 'Tableau 11 : Structure des couts'))

# ═══════════════════════════════════════════
# 12. QUESTIONS
# ═══════════════════════════════════════════
story.append(Paragraph('<b>12. Questions en Suspens</b>', s_h1))
for i, q in enumerate([
    'FFmpeg : Le serveur dispose-t-il de FFmpeg pour le mixage audio/video ?',
    'Calendrier multi-plaforme : Comment gerer les plages horaires optimales par plateforme ?',
    'ManyChat API : Integration directe de l API ManyChat ou configuration manuelle des declencheurs ?',
    'Validation du contenu : Approbation manuelle avant publication ou automatique avec logs ?',
    'Multi-tenant : Plusieurs clients simultanes avec configurations separees des le depart ?',
    'Analytics : Statistiques de base ou analytics approfondis via API plateformes ?',
    'Page de vente : Positionnement commercial et tarification pour la page de vente ?',
    'LLM : Quel modele de langage pour la generation de texte et quel budget ?',
], 1):
    story.append(Paragraph('<b>{0}.</b> {1}'.format(i, q), s_bullet))
    story.append(Spacer(1, 4))

# ═══════════════════════════════════════════
# 13. PROCHAINES ETAPES
# ═══════════════════════════════════════════
story.append(Paragraph('<b>13. Prochaines Etapes</b>', s_h1))
story.extend(tbl([
    [Paragraph('<b>#</b>',s_th), Paragraph('<b>Priorite</b>',s_th), Paragraph('<b>Dep.</b>',s_th), Paragraph('<b>Description</b>',s_th)],
    [Paragraph('1',s_td), Paragraph('Haute',s_td), Paragraph('-',s_td), Paragraph('Valider edge-tts + DeniseNeural (test Python complet)',s_td_l)],
    [Paragraph('2',s_td), Paragraph('Haute',s_td), Paragraph('1',s_td), Paragraph('Tester mixage Wan + voix off avec FFmpeg',s_td_l)],
    [Paragraph('3',s_td), Paragraph('Haute',s_td), Paragraph('-',s_td), Paragraph('Configurer Cloudflare D1 + KV pour le projet',s_td_l)],
    [Paragraph('4',s_td), Paragraph('Haute',s_td), Paragraph('3',s_td), Paragraph('Developper module generation contenu (Wan + LLM)',s_td_l)],
    [Paragraph('5',s_td), Paragraph('Moyenne',s_td), Paragraph('-',s_td), Paragraph('Developper interface calendrier (Next.js + Pages)',s_td_l)],
    [Paragraph('6',s_td), Paragraph('Moyenne',s_td), Paragraph('4+5',s_td), Paragraph('Integrer generation video + voix off dans pipeline',s_td_l)],
    [Paragraph('7',s_td), Paragraph('Moyenne',s_td), Paragraph('-',s_td), Paragraph('Developper repurposing automatique multi-format',s_td_l)],
    [Paragraph('8',s_td), Paragraph('Basse',s_td), Paragraph('API Meta',s_td), Paragraph('Brancher publication Facebook/Instagram',s_td_l)],
    [Paragraph('9',s_td), Paragraph('Basse',s_td), Paragraph('API TikTok',s_td), Paragraph('Brancher publication TikTok',s_td_l)],
    [Paragraph('10',s_td), Paragraph('Basse',s_td), Paragraph('API YouTube',s_td), Paragraph('Brancher publication YouTube',s_td_l)],
    [Paragraph('11',s_td), Paragraph('Moyenne',s_td), Paragraph('Complet',s_td), Paragraph('Developper la page de vente',s_td_l)],
], [W*0.06,W*0.11,W*0.08,W*0.75], 'Tableau 12 : Feuille de route'))

# ── Build ──
doc.build(story)
print(f'PDF generated: {OUTPUT}')
