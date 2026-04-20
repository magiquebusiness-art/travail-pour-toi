# -*- coding: utf-8 -*-
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak,
                                 Table, TableStyle, KeepTogether)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Font Registration ──
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('Calibri', normal='Calibri', bold='Calibri')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')

# ── Color Palette ──
ACCENT       = colors.HexColor('#278fb1')
ACCENT2      = colors.HexColor('#1a6d8a')
TEXT_PRIMARY  = colors.HexColor('#1c1e1f')
TEXT_MUTED    = colors.HexColor('#6d7379')
BG_SURFACE   = colors.HexColor('#d5d9de')
BG_PAGE      = colors.HexColor('#e7eaed')
GREEN_ACCENT = colors.HexColor('#2d8f5e')
ORANGE_ACCENT = colors.HexColor('#c47a20')
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

available_width = A4[0] - 4.0*cm

# ── Styles ──
s_title = ParagraphStyle('Title', fontName='Times New Roman', fontSize=30, leading=38,
                          textColor=ACCENT, alignment=TA_CENTER, spaceAfter=4)
s_subtitle = ParagraphStyle('Subtitle', fontName='Calibri', fontSize=14, leading=20,
                             textColor=TEXT_MUTED, alignment=TA_CENTER, spaceAfter=6)
s_tagline = ParagraphStyle('Tagline', fontName='Calibri', fontSize=11, leading=16,
                            textColor=ACCENT2, alignment=TA_CENTER, spaceAfter=20)
s_h1 = ParagraphStyle('H1', fontName='Times New Roman', fontSize=18, leading=24,
                       textColor=ACCENT, spaceBefore=18, spaceAfter=10)
s_h2 = ParagraphStyle('H2', fontName='Times New Roman', fontSize=14, leading=20,
                       textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=8)
s_h3 = ParagraphStyle('H3', fontName='Times New Roman', fontSize=12, leading=17,
                       textColor=ACCENT2, spaceBefore=10, spaceAfter=6)
s_body = ParagraphStyle('Body', fontName='Calibri', fontSize=10.5, leading=17,
                         textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=6)
s_bullet = ParagraphStyle('Bullet', parent=s_body, leftIndent=20, bulletIndent=8,
                           spaceBefore=2, spaceAfter=2)
s_note = ParagraphStyle('Note', fontName='Calibri', fontSize=9.5, leading=15,
                          textColor=TEXT_MUTED, leftIndent=15, spaceBefore=4, spaceAfter=4)
s_th = ParagraphStyle('TH', fontName='Times New Roman', fontSize=10, leading=14,
                       textColor=colors.white, alignment=TA_CENTER)
s_td = ParagraphStyle('TD', fontName='Calibri', fontSize=10, leading=14,
                       textColor=TEXT_PRIMARY, alignment=TA_CENTER)
s_td_left = ParagraphStyle('TDLeft', parent=s_td, alignment=TA_LEFT)
s_td_bold = ParagraphStyle('TDBold', parent=s_td_left, fontName='Times New Roman')
s_caption = ParagraphStyle('Caption', fontName='Calibri', fontSize=9, leading=13,
                            textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=3, spaceAfter=6)
s_meta = ParagraphStyle('Meta', fontName='Calibri', fontSize=11, leading=16,
                          textColor=TEXT_MUTED, alignment=TA_CENTER)

def make_table(data, widths, caption_text=None):
    """Helper to create consistent styled tables."""
    t = Table(data, colWidths=widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    elements = [Spacer(1, 18), t]
    if caption_text:
        elements.append(Paragraph(caption_text, s_caption))
    elements.append(Spacer(1, 18))
    return elements

story = []

# ═══════════════════════════════════════════════════════
# COVER
# ═══════════════════════════════════════════════════════
story.append(Spacer(1, 140))
story.append(Paragraph('<b>NyXia IA Automation</b>', s_title))
story.append(Spacer(1, 8))
story.append(Paragraph('Systeme d Automation Intelligent Multicanal', s_subtitle))
story.append(Spacer(1, 20))

# Decorative line
line_data = [['']]
line_table = Table(line_data, colWidths=[available_width * 0.5])
line_table.setStyle(TableStyle([
    ('LINEBELOW', (0, 0), (-1, -1), 2, ACCENT),
    ('TOPPADDING', (0, 0), (-1, -1), 0),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
]))
story.append(line_table)

story.append(Spacer(1, 30))
story.append(Paragraph('Projet autonome - Version Beta', s_meta))
story.append(Spacer(1, 8))
story.append(Paragraph('Conception, architecture et roadmap', s_meta))
story.append(Spacer(1, 8))
story.append(Paragraph('20 avril 2026', s_meta))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════
# TABLE OF CONTENTS
# ═══════════════════════════════════════════════════════
s_toc_title = ParagraphStyle('TOCTitle', fontName='Times New Roman', fontSize=18, leading=24,
                               textColor=ACCENT, alignment=TA_LEFT, spaceAfter=16)
s_toc_item = ParagraphStyle('TOCItem', fontName='Calibri', fontSize=11, leading=22,
                              textColor=TEXT_PRIMARY, leftIndent=10)

story.append(Paragraph('<b>Table des Matieres</b>', s_toc_title))

toc_items = [
    '1. Vision et Positionnement',
    '2. Volume et Type de Contenu',
    '3. Plateformes Cibles',
    '4. Outils de Creation de Contenu',
    '5. Voix Off - DeniseNeural via Edge TTS',
    '6. Structure d une Publication',
    '7. Integration ManyChat',
    '8. Possibilities Etendues',
    '9. Acces API - Statut',
    '10. Architecture Proposee',
    '11. Modele Economique',
    '12. Questions en Suspens',
    '13. Prochaines Etapes',
]
for item in toc_items:
    story.append(Paragraph(item, s_toc_item))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════
# 1. VISION ET POSITIONNEMENT
# ═══════════════════════════════════════════════════════
story.append(Paragraph('<b>1. Vision et Positionnement</b>', s_h1))
story.append(Paragraph(
    'NyXia IA Automation est un systeme d automation intelligent multicanal concu pour generer, planifier '
    'et publier du contenu sur l ensemble des plateformes sociales et au-dela. L objectif principal est de '
    'remplacer les heures de travail manuel de gestion de presence digitale par un pipeline automatise de '
    'bout en bout, depuis la creation du contenu jusqu a sa publication programmee.',
    s_body))
story.append(Paragraph(
    'Le systeme va bien au-dela de la simple publication sur les reseaux sociaux. Il couvre la creation '
    'de tout type de contenu digital : images, videos avec voix off, textes optimises pour l engagement, '
    'emails marketing, articles de blog, copies publicitaires, scripts pour webinaires, et bien plus. '
    'Chaque element est genere automatiquement en respectant les codes visuels et textuels de la marque, '
    'les bonnes pratiques de chaque plateforme, et les objectifs strategiques definis par l utilisateur.',
    s_body))
story.append(Paragraph(
    'Le projet est developpe comme une application autonome, separee de NyXia Z. Cette decision strategique '
    'permet de concevoir et tester le systeme en beta sans risquer d affecter la plateforme principale. '
    'Une fois la version beta validee et fonctionnelle, une integration dans l ecosysteme NyXia sera envisagee. '
    'Le systeme est concu pour etre evolutif : de nouvelles plateformes, formats et fonctionnalites pourront '
    'etre ajoutes au fil du temps sans refonte majeure de l architecture.',
    s_body))

# ═══════════════════════════════════════════════════════
# 2. VOLUME ET TYPE DE CONTENU
# ═══════════════════════════════════════════════════════
story.append(Paragraph('<b>2. Volume et Type de Contenu</b>', s_h1))
story.append(Paragraph(
    'Le volume de publication cible est ambitieux mais realisable grace a l automatisation complete du pipeline. '
    'Chaque jour, le systeme genere et programme automatiquement un total de 6 publications reparties en deux '
    'categories. Ce rythme soutenu vise a maintenir une presence constante et a maximiser la portee organique '
    'sur l ensemble des plateformes ciblees.',
    s_body))

vol_data = [
    [Paragraph('<b>Type</b>', s_th),
     Paragraph('<b>Quantite / jour</b>', s_th),
     Paragraph('<b>Semaine</b>', s_th),
     Paragraph('<b>Mois (4 sem.)</b>', s_th)],
    [Paragraph('Texte + Image', s_td_left),
     Paragraph('4', s_td),
     Paragraph('28', s_td),
     Paragraph('112', s_td)],
    [Paragraph('Video + Texte', s_td_left),
     Paragraph('2', s_td),
     Paragraph('14', s_td),
     Paragraph('56', s_td)],
    [Paragraph('<b>Total</b>', s_td_left),
     Paragraph('<b>6</b>', s_td),
     Paragraph('<b>42</b>', s_td),
     Paragraph('<b>168</b>', s_td)],
]
story.extend(make_table(vol_data, [available_width*0.35, available_width*0.20, available_width*0.22, available_width*0.23],
                        'Tableau 1 : Volume de publication mensuel'))

story.append(Paragraph(
    'Ce volume est parametrable selon les besoins de chaque client. Certains pourraient necessiter 2 publications '
    'par jour, d autres 10 ou plus. Le systeme est concu pour s adapter a la demande sans effort manuel '
    'supplementaire. L important est que chaque publication respecte la structure standardisee definie plus '
    'loin dans ce document pour garantir la qualite et la coherence du contenu.',
    s_body))

# ═══════════════════════════════════════════════════════
# 3. PLATEFORMES CIBLES
# ═══════════════════════════════════════════════════════
story.append(Paragraph('<b>3. Plateformes Cibles</b>', s_h1))
story.append(Paragraph(
    'Le systeme cible l ensemble des principales plateformes sociales et digitales. Chaque plateforme a ses '
    'propres specificites techniques, formats acceptes et limites. Le systeme doit gerer automatiquement ces '
    'differences pour que le contenu soit toujours optimise pour la plateforme de destination. Voici la liste '
    'complete des plateformes supportees, divisee en trois categories par priorite.',
    s_body))

story.append(Paragraph('<b>3.1 Priorite Haute - Reseaux Sociaux (Phase 1)</b>', s_h2))

plat1_data = [
    [Paragraph('<b>Plateforme</b>', s_th),
     Paragraph('<b>Formats</b>', s_th),
     Paragraph('<b>Statut API</b>', s_th)],
    [Paragraph('Facebook', s_td_left),
     Paragraph('Profil, Pages multiples, Groupes, Stories', s_td_left),
     Paragraph('En attente - Validation Meta Business (charte requise)', s_td_left)],
    [Paragraph('Instagram', s_td_left),
     Paragraph('Posts, Reels, Stories (multi-comptes)', s_td_left),
     Paragraph('En attente - Lie a Meta Business', s_td_left)],
    [Paragraph('TikTok', s_td_left),
     Paragraph('Videos, Stories', s_td_left),
     Paragraph('A faire - Inscription TikTok for Developers', s_td_left)],
    [Paragraph('YouTube', s_td_left),
     Paragraph('Videos, Shorts, Community Posts', s_td_left),
     Paragraph('A faire - Google Developer Console + API v3', s_td_left)],
]
story.extend(make_table(plat1_data, [available_width*0.18, available_width*0.38, available_width*0.44],
                        'Tableau 2 : Plateformes Phase 1'))

story.append(Paragraph('<b>3.2 Priorite Moyenne - Reseaux Complementaires (Phase 2)</b>', s_h2))

plat2_data = [
    [Paragraph('<b>Plateforme</b>', s_th),
     Paragraph('<b>Formats</b>', s_th),
     Paragraph('<b>Potentiel</b>', s_th)],
    [Paragraph('LinkedIn', s_td_left),
     Paragraph('Posts, Articles, Newsletter', s_td_left),
     Paragraph('B2B, positionnement professionnel, lead gen', s_td_left)],
    [Paragraph('Twitter / X', s_td_left),
     Paragraph('Posts (280 car.), Threads', s_td_left),
     Paragraph('Veille, conversations, drive traffic', s_td_left)],
    [Paragraph('Pinterest', s_td_left),
     Paragraph('Pins, Idea Pins, Boards', s_td_left),
     Paragraph('SEO visuel, drive traffic longue duree', s_td_left)],
    [Paragraph('Threads', s_td_left),
     Paragraph('Posts textuels', s_td_left),
     Paragraph('Communaute, discussions, engagement', s_td_left)],
]
story.extend(make_table(plat2_data, [available_width*0.18, available_width*0.35, available_width*0.47],
                        'Tableau 3 : Plateformes Phase 2'))

story.append(Paragraph('<b>3.3 Priorite Strategique - Au-dela des Reseaux Sociaux (Phase 3)</b>', s_h2))
story.append(Paragraph(
    'NyXia IA Automation ne se limite pas aux reseaux sociaux. Le systeme pourra egalement generer du contenu '
    'pour les canaux suivants : emails marketing et newsletters (sujet + corps optimises), articles de blog '
    'optimises SEO, descriptions de produits pour e-commerce, copies publicitaires pour Facebook Ads et Google '
    'Ads, scripts pour videos de presentation et webinaires, contenu pour cours en ligne, et landing pages. '
    'Cette extension transforme le systeme en un veritable hub de creation de contenu digital centralise.',
    s_body))

# ═══════════════════════════════════════════════════════
# 4. OUTILS DE CREATION DE CONTENU
# ═══════════════════════════════════════════════════════
story.append(Paragraph('<b>4. Outils de Creation de Contenu</b>', s_h1))
story.append(Paragraph(
    'La creation de contenu repose sur des outils gratuits et open source, deja integres dans NyXia Z. '
    'L avantage majeur est l absence totale de couts de generation : pas de credits a acheter, pas de limites '
    'volumetriques, pas de frais caches. Cela rend le modele economique extremement avantageux et la tarification '
    'entierement basee sur la valeur du service, non sur les couts de production.',
    s_body))

story.append(Paragraph('<b>4.1 Generation Video</b>', s_h2))
story.append(Paragraph(
    'Wan est le moteur de generation video principal. Modele open source et gratuit, il genere des sequences '
    'video a partir de prompts textuels avec une duree maximale de 15 secondes (desormais corrige dans le '
    'selecteur). Wan genere nativement de l audio ambiant dans ses videos, qui sera conserve et mixe avec la '
    'voix off DeniseNeural pour un resultat professionnel.',
    s_body))
story.append(Paragraph(
    'En complement, d autres modeles sont disponibles comme fallback : Luma Dream Machine (qualite superieure, '
    'credits quotidiens gratuits, max 5 secondes) et Kling AI (66 credits gratuits/jour, max 10 secondes). '
    'Ces alternatives permettent de varier les styles visuels et d assurer la continuite en cas de problemes '
    'avec le moteur principal.',
    s_body))

story.append(Paragraph('<b>4.2 Generation d Images</b>', s_h2))
story.append(Paragraph(
    'Pour les publications texte + image, FLUX est le modele privilegie. Il offre une qualite photographique '
    'exceptionnelle et est accessible gratuitement via API. Le systeme pourra egalement generer des memes, '
    'des citations visuelles, des infographies et des visuels pour carrousels en combinant FLUX avec des '
    'templates predefinies.',
    s_body))

story.append(Paragraph('<b>4.3 Repurposing Automatique</b>', s_h2))
story.append(Paragraph(
    'Une fonctionnalite cle du systeme est le repurposing automatique de contenu. A partir d une seule video '
    'generee, le systeme pourra automatiquement la redimensionner et l adapter pour TikTok (9:16), Instagram '
    'Reels (9:16), YouTube Shorts (9:16), et en extraire une version texte pour les posts LinkedIn, Twitter et '
    'Facebook. Ce processus multiply automatise l exploitation maximale de chaque contenu cree, reduisant '
    'drastiquement le travail de creation tout en multipliant la presence sur les plateformes.',
    s_body))

tools_data = [
    [Paragraph('<b>Outil</b>', s_th),
     Paragraph('<b>Type</b>', s_th),
     Paragraph('<b>Cout</b>', s_th),
     Paragraph('<b>Details</b>', s_th)],
    [Paragraph('Wan', s_td_left),
     Paragraph('Video', s_td),
     Paragraph('Gratuit', s_td),
     Paragraph('Max 15 sec, audio inclus, open source', s_td_left)],
    [Paragraph('Luma Dream Machine', s_td_left),
     Paragraph('Video', s_td),
     Paragraph('Gratuit', s_td),
     Paragraph('Credits quotidiens, max 5 sec', s_td_left)],
    [Paragraph('Kling AI', s_td_left),
     Paragraph('Video', s_td),
     Paragraph('Gratuit', s_td),
     Paragraph('66 credits/jour, max 10 sec', s_td_left)],
    [Paragraph('FLUX', s_td_left),
     Paragraph('Image', s_td),
     Paragraph('Gratuit', s_td),
     Paragraph('Haute qualite photographique', s_td_left)],
    [Paragraph('edge-tts', s_td_left),
     Paragraph('Voix off', s_td),
     Paragraph('Gratuit', s_td),
     Paragraph('DeniseNeural, MP3, Python', s_td_left)],
    [Paragraph('FFmpeg', s_td_left),
     Paragraph('Mixage audio', s_td),
     Paragraph('Gratuit', s_td),
     Paragraph('Mixage video + voix off', s_td_left)],
]
story.extend(make_table(tools_data, [available_width*0.20, available_width*0.12, available_width*0.12, available_width*0.56],
                        'Tableau 4 : Outils de creation de contenu'))

# ═══════════════════════════════════════════════════════
# 5. VOIX OFF - DENISE NEURAL
# ═══════════════════════════════════════════════════════
story.append(Paragraph('<b>5. Voix Off - DeniseNeural via Edge TTS</b>', s_h1))
story.append(Paragraph(
    'La voix DeniseNeural (fr-CA-DeniseNeural) est la voix off selectionnee pour les videos generees par le '
    'systeme. La solution technique validee est le package Python edge-tts qui genere des fichiers audio MP3 '
    'de haute qualite. Cette approche est fonctionnelle et ne souffre d aucune des limitations rencontrees '
    'lors des tests en temps reel dans le navigateur.',
    s_body))

story.append(Paragraph('<b>5.1 Pourquoi edge-tts fonctionne ici</b>', s_h2))
story.append(Paragraph(
    'Les precedents tests avec Edge TTS sur NyXia Z ont revele deux bloquants techniques : (1) Cloudflare Workers '
    'ne peut pas se connecter a des WebSockets externes comme wss://speech.platform.bing.com, et (2) les '
    'navigateurs rejettent les connexions WebSocket vers Microsoft car l en-tete Origin ne correspond pas a '
    'l extension Edge TTS officielle.',
    s_body))
story.append(Paragraph(
    'Pour la creation de videos, le contexte est fondamentalement different. Le package Python edge-tts se '
    'connecte directement aux serveurs Microsoft en dehors de tout environnement navigateur ou Cloudflare Worker. '
    'Il n y a aucune restriction d Origin, aucune limitation de plateforme, et aucune dependance a un service '
    'tiers. Le resultat est un fichier MP3 de haute qualite avec la voix DeniseNeural, pret a etre integre '
    'dans la video finale via FFmpeg.',
    s_body))

story.append(Paragraph('<b>5.2 Mixage Audio Video + Voix Off</b>', s_h2))
story.append(Paragraph(
    'Wan genere nativement des videos avec un audio ambiant (effets sonores, atmosphere). Le systeme conservera '
    'cet audio et y superposera la voix off DeniseNeural. Le volume de l audio original sera reduit a environ '
    '30% pour laisser la narration clairement audible tout en conservant l immersion sonore. Le mixage sera '
    'realise avec FFmpeg selon le processus suivant :',
    s_body))

mix_data = [
    [Paragraph('<b>Etape</b>', s_th),
     Paragraph('<b>Action</b>', s_th),
     Paragraph('<b>Outil</b>', s_th)],
    [Paragraph('1', s_td),
     Paragraph('Generation de la video avec audio original', s_td_left),
     Paragraph('Wan', s_td)],
    [Paragraph('2', s_td),
     Paragraph('Generation de la narration MP3', s_td_left),
     Paragraph('edge-tts (DeniseNeural)', s_td)],
    [Paragraph('3', s_td),
     Paragraph('Reduction volume audio original a 30%', s_td_left),
     Paragraph('FFmpeg', s_td)],
    [Paragraph('4', s_td),
     Paragraph('Superposition voix off + export final', s_td_left),
     Paragraph('FFmpeg', s_td)],
]
story.extend(make_table(mix_data, [available_width*0.10, available_width*0.60, available_width*0.30],
                        'Tableau 5 : Processus de mixage audio'))

# ═══════════════════════════════════════════════════════
# 6. STRUCTURE D UNE PUBLICATION
# ═══════════════════════════════════════════════════════
story.append(Paragraph('<b>6. Structure d une Publication</b>', s_h1))
story.append(Paragraph(
    'Chaque publication genere par le systeme respecte une structure strictement definie pour maximiser l '
    'engagement. Cette structure est concue specifiquement pour declencher des commentaires, lesquels activent '
    'le systeme ManyChat pour la conversion automatique. Les quatre elements composants chaque publication '
    'sont adaptes automatiquement selon la plateforme de destination.',
    s_body))

struct_data = [
    [Paragraph('<b>Element</b>', s_th),
     Paragraph('<b>Description</b>', s_th),
     Paragraph('<b>Objectif</b>', s_th)],
    [Paragraph('Titre Stop-Scroll', s_td_left),
     Paragraph('Phrase d accroche percutante en premiere ligne', s_td_left),
     Paragraph('Arreter le defilement et capter l attention', s_td_left)],
    [Paragraph('Corps du texte', s_td_left),
     Paragraph('Message principal, valeur ajoutee, information', s_td_left),
     Paragraph('Delivrer le message et apporter de la valeur', s_td_left)],
    [Paragraph('CTA fort', s_td_left),
     Paragraph('Appel a l action oriente engagement/commentaire', s_td_left),
     Paragraph('Declencher un commentaire pour ManyChat', s_td_left)],
    [Paragraph('Hashtags', s_td_left),
     Paragraph('Exactement 3 hashtags optimises algorithme', s_td_left),
     Paragraph('Maximiser la portee organique', s_td_left)],
]
story.extend(make_table(struct_data, [available_width*0.22, available_width*0.40, available_width*0.38],
                        'Tableau 6 : Structure type d une publication'))

story.append(Paragraph(
    'Le CTA est l element le plus strategique. Il doit encourager les utilisateurs a laisser un commentaire '
    'specifique (mot-cle, emoji ou reponse) qui servira de declencheur pour ManyChat. L outil d automatisation '
    'intervient alors automatiquement en message prive pour engager la conversation et conduire l utilisateur '
    'le long du funnel de conversion. L ensemble du systeme est oriente vers la generation de commentaires '
    'qualifies comme premier pas vers la conversion.',
    s_body))

# ═══════════════════════════════════════════════════════
# 7. INTEGRATION MANYCHAT
# ═══════════════════════════════════════════════════════
story.append(Paragraph('<b>7. Integration ManyChat</b>', s_h1))
story.append(Paragraph(
    'ManyChat est la piece maitresse de la strategie de conversion. Le lien entre les publications sociales et '
    'ManyChat fonctionne comme suit : chaque publication inclut un CTA concu pour provoquer un commentaire de '
    'l utilisateur. Lorsqu un commentaire est detecte, ManyChat intervient automatiquement pour engager la '
    'conversation en message prive (Facebook Messenger, Instagram DM).',
    s_body))
story.append(Paragraph(
    'Le systeme doit generer des CTA compatibles avec les declencheurs ManyChat configures. Par exemple, si '
    'ManyChat est configure pour reagir au mot-cle "INFO" dans les commentaires, le CTA genere doit inciter '
    'les utilisateurs a commenter ce mot-cle precis. Cette coherence entre le contenu genere et l automatisation '
    'ManyChat est essentielle pour que le pipeline de conversion fonctionne de bout en bout.',
    s_body))
story.append(Paragraph(
    'ManyChat offre egalement des fonctionnalites avancees qui pourraient etre exploitees : flows de conversation '
    'personnalises, sequences automatisees multi-etapes, segmentation d audience basee sur les interactions, '
    'et analytics de performance. Le systeme pourrait se parametrer avec differentes campagnes selon le type '
    'de contenu publie, dirigeant les utilisateurs vers differentes offres ou entonnoirs de conversion.',
    s_body))

# ═══════════════════════════════════════════════════════
# 8. POSSIBILITIES ETENDUES
# ═══════════════════════════════════════════════════════
story.append(Paragraph('<b>8. Possibilities Etendues</b>', s_h1))
story.append(Paragraph(
    'Au-dela de la publication sur les reseaux sociaux, NyXia IA Automation peut couvrir un large spectre '
    'de fonctionnalites qui transforment le systeme en un hub centralise de creation de contenu digital. '
    'Ces possibilites etendues augmentent considerablement la valeur du systeme pour les clients et ouvrent '
    'de nouvelles sources de revenus.',
    s_body))

story.append(Paragraph('<b>8.1 Automation Intelligente</b>', s_h2))
story.append(Paragraph(
    'Le systeme peut integrer des mecanismes d intelligence pour optimiser automatiquement la performance du '
    'contenu. La detection de tendances permet d identifier les sujets populaires en temps reel et de generer '
    'du contenu pertinent automatiquement. L A/B testing des titres et CTA permet de comparer differentes '
    'versions et de retenir les plus performantes. L analyse de l engagement collectee via les API des '
    'plateformes permet d ajuster automatiquement les horaires de publication, les tonalites et les formats '
    'pour maximiser la portee et les interactions.',
    s_body))

story.append(Paragraph('<b>8.2 Creation de Contenu Diversifie</b>', s_h2))

content_data = [
    [Paragraph('<b>Type de Contenu</b>', s_th),
     Paragraph('<b>Description</b>', s_th),
     Paragraph('<b>Usage</b>', s_th)],
    [Paragraph('Posts texte + image', s_td_left),
     Paragraph('Visuels FLUX + texte optimise engagement', s_td_left),
     Paragraph('Facebook, Instagram, LinkedIn', s_td_left)],
    [Paragraph('Videos avec voix off', s_td_left),
     Paragraph('Video Wan + narration DeniseNeural', s_td_left),
     Paragraph('TikTok, Reels, YouTube Shorts', s_td_left)],
    [Paragraph('Stories', s_td_left),
     Paragraph('Contenu ephemere, polls, questions', s_td_left),
     Paragraph('Instagram, Facebook, TikTok', s_td_left)],
    [Paragraph('Carrousels', s_td_left),
     Paragraph('Slides multi-pages avec visuels', s_td_left),
     Paragraph('Instagram, LinkedIn', s_td_left)],
    [Paragraph('Emails marketing', s_td_left),
     Paragraph('Sujet + corps optimises conversion', s_td_left),
     Paragraph('Newsletters, sequences email', s_td_left)],
    [Paragraph('Articles SEO', s_td_left),
     Paragraph('Articles de blog optimises moteurs', s_td_left),
     Paragraph('Blog, WordPress, Medium', s_td_left)],
    [Paragraph('Copies publicitaires', s_td_left),
     Paragraph('Texte Ads optimises CTR', s_td_left),
     Paragraph('Facebook Ads, Google Ads', s_td_left)],
    [Paragraph('Scripts video', s_td_left),
     Paragraph('Scripts pour webinaires et tuto', s_td_left),
     Paragraph('YouTube, webinaires, cours', s_td_left)],
    [Paragraph('Descriptions produits', s_td_left),
     Paragraph('Texte e-commerce optimise conversion', s_td_left),
     Paragraph('Boutique en ligne, Shopify', s_td_left)],
    [Paragraph('Landing page copy', s_td_left),
     Paragraph('Titres, sous-titres, CTA, sections', s_td_left),
     Paragraph('Pages de vente, funnels', s_td_left)],
]
story.extend(make_table(content_data, [available_width*0.22, available_width*0.40, available_width*0.38],
                        'Tableau 7 : Types de contenu generables'))

story.append(Paragraph('<b>8.3 Business et Conversion</b>', s_h2))
story.append(Paragraph(
    'Le systeme peut etre etendu pour couvrir l ensemble du funnel de conversion : generation de leads via '
    'les CTA orientes commentaires, nurturing automatique via ManyChat, creation de contenu pour les '
    'differentes etapes du funnel (sensibilisation, consideration, decision), reporting automatique des '
    'performances, et integration CRM pour le suivi des prospects. Cette extension positionne NyXia IA '
    'Automation non pas comme un simple outil de publication, mais comme un veritable systeme de marketing '
    'digital automatise.',
    s_body))

# ═══════════════════════════════════════════════════════
# 9. ACCES API - STATUT
# ═══════════════════════════════════════════════════════
story.append(Paragraph('<b>9. Acces API - Statut</b>', s_h1))
story.append(Paragraph(
    'L acces aux API des plateformes est une precondition technique pour la publication automatisee. Le tableau '
    'suivant resume le statut actuel. Le developpement peut commencer sans les API car la generation de contenu '
    'est independante de la couche de publication.',
    s_body))

api_data = [
    [Paragraph('<b>Plateforme</b>', s_th),
     Paragraph('<b>Statut</b>', s_th),
     Paragraph('<b>Action requise</b>', s_th)],
    [Paragraph('Facebook / Instagram', s_td_left),
     Paragraph('En attente', s_td),
     Paragraph('Validation Meta Business avec charte d entreprise', s_td_left)],
    [Paragraph('TikTok', s_td_left),
     Paragraph('Non demarre', s_td),
     Paragraph('Inscription TikTok for Developers', s_td_left)],
    [Paragraph('YouTube / Google', s_td_left),
     Paragraph('Non demarre', s_td),
     Paragraph('Google Developer Console + API v3', s_td_left)],
    [Paragraph('LinkedIn', s_td_left),
     Paragraph('Non demarre', s_td),
     Paragraph('LinkedIn Marketing API', s_td_left)],
    [Paragraph('Twitter / X', s_td_left),
     Paragraph('Non demarre', s_td),
     Paragraph('Twitter API v2 (payant)', s_td_left)],
    [Paragraph('Pinterest', s_td_left),
     Paragraph('Non demarre', s_td),
     Paragraph('Pinterest API v5', s_td_left)],
]
story.extend(make_table(api_data, [available_width*0.22, available_width*0.15, available_width*0.63],
                        'Tableau 8 : Statut d acces aux API'))

# ═══════════════════════════════════════════════════════
# 10. ARCHITECTURE PROPOSEE
# ═══════════════════════════════════════════════════════
story.append(Paragraph('<b>10. Architecture Proposee</b>', s_h1))
story.append(Paragraph(
    'L architecture est organisee en modules independants qui communiquent entre eux. Cette approche modulaire '
    'permet de developper, tester et maintenir chaque composant separement. Le systeme comprend quatre couches '
    'principales.',
    s_body))

story.append(Paragraph('<b>10.1 Module de Generation de Contenu</b>', s_h2))
story.append(Paragraph(
    'Ce module est responsable de la creation de tous les elements d une publication. Il integre un modele de '
    'langage pour generer le texte (titre stop-scroll, corps, CTA, hashtags), un moteur de generation d images '
    '(FLUX), un moteur de generation video (Wan) et le moteur de voix off (edge-tts avec DeniseNeural). Chaque '
    'element est genere selon les templates et regles definis dans la configuration. Le module gere egalement '
    'le repurposing automatique : une video est automatiquement adaptee aux formats de chaque plateforme '
    '(9:16, 1:1, 16:9) et un texte est genere pour accompagner chaque version.',
    s_body))

story.append(Paragraph('<b>10.2 Module Calendrier</b>', s_h2))
story.append(Paragraph(
    'Le calendrier est le centre de l organisation. Il permet de planifier les publications a l avance, '
    'de definir les horaires optimaux pour chaque plateforme, et de visualiser le planning sous forme de '
    'calendrier interactif (vue mensuelle, hebdomadaire, quotidienne). Le systeme gere automatiquement les '
    'fuseaux horaires et peut proposer les meilleures plages de publication selon les donnees d engagement '
    'historiques de chaque plateforme.',
    s_body))

story.append(Paragraph('<b>10.3 Moteur de Publication</b>', s_h2))
story.append(Paragraph(
    'Le moteur de publication gere l envoi du contenu vers chaque plateforme. Il respecte les specificites '
    'techniques de chaque API (format d image, duree video, dimensions, limites de caracteres), gere les '
    'tokens d authentification et leur renouvellement, implemente les retries en cas d echec, et produit '
    'des logs detailles pour le suivi. Ce module est branche en dernier car il depend directement de l acces '
    'aux API des plateformes.',
    s_body))

story.append(Paragraph('<b>10.4 Interface Utilisateur</b>', s_h2))
story.append(Paragraph(
    'L interface permet de configurer les parametres de generation (sujets, ton, style), de gerer le calendrier, '
    'de visualiser et approuver les publications avant publication, et de suivre les performances. Elle sera '
    'developpee en Next.js pour etre coherente avec l ecosysteme technique existant. L interface devrait etre '
    'intuitive et permettre une gestion complete sans competence technique.',
    s_body))

# ═══════════════════════════════════════════════════════
# 11. MODELE ECONOMIQUE
# ═══════════════════════════════════════════════════════
story.append(Paragraph('<b>11. Modele Economique</b>', s_h1))
story.append(Paragraph(
    'L avantage economique majeur de NyXia IA Automation est son cout de production quasi nul. Tous les outils '
    'de creation (Wan, FLUX, edge-tts, FFmpeg) sont gratuits et open source. Le seul cout recurrent est '
    'l hebergement du serveur. Cela signifie que la marge sur chaque abonnement client est extremement elevee, '
    'proche de 100%.',
    s_body))

pricing_data = [
    [Paragraph('<b>Element</b>', s_th),
     Paragraph('<b>Cout mensuel</b>', s_th),
     Paragraph('<b>Notes</b>', s_th)],
    [Paragraph('Outils de creation', s_td_left),
     Paragraph('0 $', s_td),
     Paragraph('Wan, FLUX, edge-tts, FFmpeg sont tous gratuits', s_td_left)],
    [Paragraph('Hebergement serveur', s_td_left),
     Paragraph('Variable', s_td),
     Paragraph('Partage avec NyXia Z ou dedie', s_td_left)],
    [Paragraph('API plateformes', s_td_left),
     Paragraph('0 $', s_td),
     Paragraph('Publication via API gratuite (pas d usage fees)', s_td_left)],
    [Paragraph('<b>Cout total de production</b>', s_td_left),
     Paragraph('<b>Quasi nul</b>', s_td),
     Paragraph('Le client paie le service, pas la consommation', s_td_left)],
]
story.extend(make_table(pricing_data, [available_width*0.28, available_width*0.20, available_width*0.52],
                        'Tableau 9 : Structure des couts'))

story.append(Paragraph(
    'Le modele de revenus est base sur un abonnement mensuel facture au client. Pour 168 publications mensuelles '
    '(6 par jour, 7 jours sur 7), le retour sur investissement pour le client est considerables car le systeme '
    'remplace plusieurs heures de travail manuel quotidien. Le fait que Wan soit open source et gratuit est un '
    'atout considerable pour la proposition de valeur : pas de cout cache, pas de frais de credits par '
    'generation, pas de limitation volumetrique.',
    s_body))

# ═══════════════════════════════════════════════════════
# 12. QUESTIONS EN SUSPENS
# ═══════════════════════════════════════════════════════
story.append(Paragraph('<b>12. Questions en Suspens</b>', s_h1))
story.append(Paragraph(
    'Plusieurs points restent a explorer et a valider avant de finaliser l architecture et commencer le '
    'developpement effectif.',
    s_body))

questions = [
    'FFmpeg : Le serveur dispose-t-il de FFmpeg pour le mixage audio/video ? L installation est simple '
    'mais necessite un acces root au serveur.',
    'Calendrier multi-plaforme : Comment gerer les plages horaires optimales differentes pour chaque plateforme ? '
    'Un systeme de configuration par defaut + personnalisation par plateforme est envisage.',
    'ManyChat API : Faut-il integrer l API ManyChat directement pour declencher des flows automatiquement, '
    'ou la configuration manuelle des declencheurs mots-cles suffit-elle ?',
    'Validation du contenu : Approbation manuelle avant publication ou publication automatique sans revision ? '
    'Un mode hybride (auto-approval avec logs) pourrait etre un bon compromis.',
    'Multi-tenant : Support de plusieurs clients simultanement avec configurations separees, ou un seul client '
    'dans un premier temps ? L architecture devrait etre multi-tenant des le depart si possible.',
    'Analytics : Statistiques de base (nombre de publications, statut) ou analytics approfondis (engagement, '
    'portee, clics) via les API des plateformes ?',
    'Page de vente : Quel positionnement commercial pour la page de vente du produit ? '
    'Abonnement mensuel, forfaits par volume, tarification freemium ?',
]
for i, q in enumerate(questions, 1):
    story.append(Paragraph('<b>{0}.</b> {1}'.format(i, q), s_bullet))
    story.append(Spacer(1, 4))

# ═══════════════════════════════════════════════════════
# 13. PROCHAINES ETAPES
# ═══════════════════════════════════════════════════════
story.append(Paragraph('<b>13. Prochaines Etapes</b>', s_h1))
story.append(Paragraph(
    'La feuille de route est organisee par priorite. Les etapes sans dependance peuvent etre realisees en '
    'parallele.',
    s_body))

steps_data = [
    [Paragraph('<b>#</b>', s_th),
     Paragraph('<b>Priorite</b>', s_th),
     Paragraph('<b>Dependance</b>', s_th),
     Paragraph('<b>Description</b>', s_th)],
    [Paragraph('1', s_td),
     Paragraph('Haute', s_td),
     Paragraph('Aucune', s_td),
     Paragraph('Valider edge-tts avec DeniseNeural (test Python complet)', s_td_left)],
    [Paragraph('2', s_td),
     Paragraph('Haute', s_td),
     Paragraph('Etape 1', s_td),
     Paragraph('Tester le mixage audio Wan + voix off avec FFmpeg', s_td_left)],
    [Paragraph('3', s_td),
     Paragraph('Haute', s_td),
     Paragraph('Aucune', s_td),
     Paragraph('Developper le module de generation contenu (texte + image)', s_td_left)],
    [Paragraph('4', s_td),
     Paragraph('Moyenne', s_td),
     Paragraph('Aucune', s_td),
     Paragraph('Developper l interface calendrier de publication', s_td_left)],
    [Paragraph('5', s_td),
     Paragraph('Moyenne', s_td),
     Paragraph('3 + 4', s_td),
     Paragraph('Integrer la generation video avec voix off dans le pipeline', s_td_left)],
    [Paragraph('6', s_td),
     Paragraph('Basse', s_td),
     Paragraph('API Meta', s_td),
     Paragraph('Brancher le moteur de publication Facebook/Instagram', s_td_left)],
    [Paragraph('7', s_td),
     Paragraph('Basse', s_td),
     Paragraph('API TikTok', s_td),
     Paragraph('Brancher le moteur de publication TikTok', s_td_left)],
    [Paragraph('8', s_td),
     Paragraph('Basse', s_td),
     Paragraph('API YouTube', s_td),
     Paragraph('Brancher le moteur de publication YouTube', s_td_left)],
    [Paragraph('9', s_td),
     Paragraph('Moyenne', s_td),
     Paragraph('Aucune', s_td),
     Paragraph('Developper le systeme de repurposing automatique', s_td_left)],
    [Paragraph('10', s_td),
     Paragraph('Basse', s_td),
     Paragraph('Systeme complet', s_td),
     Paragraph('Developper la page de vente pour le produit', s_td_left)],
]
story.extend(make_table(steps_data, [available_width*0.06, available_width*0.11, available_width*0.13, available_width*0.70],
                        'Tableau 10 : Feuille de route des prochaines etapes'))

# ── Build ──
doc.build(story)
print(f'PDF generated: {OUTPUT}')
