# -*- coding: utf-8 -*-
import os, sys, hashlib
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
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')

# ── Color Palette ──
ACCENT       = colors.HexColor('#278fb1')
TEXT_PRIMARY  = colors.HexColor('#1c1e1f')
TEXT_MUTED    = colors.HexColor('#6d7379')
BG_SURFACE   = colors.HexColor('#d5d9de')
BG_PAGE      = colors.HexColor('#e7eaed')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# ── Output ──
OUTPUT = '/home/z/my-project/download/META_FACTORY_AGENT.pdf'

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=2.0*cm,
    rightMargin=2.0*cm,
    topMargin=2.5*cm,
    bottomMargin=2.5*cm,
)

available_width = A4[0] - 4.0*cm

# ── Styles ──
s_title = ParagraphStyle('Title', fontName='Times New Roman', fontSize=28, leading=36,
                          textColor=ACCENT, alignment=TA_CENTER, spaceAfter=6)
s_subtitle = ParagraphStyle('Subtitle', fontName='Calibri', fontSize=13, leading=18,
                             textColor=TEXT_MUTED, alignment=TA_CENTER, spaceAfter=24)
s_h1 = ParagraphStyle('H1', fontName='Times New Roman', fontSize=18, leading=24,
                       textColor=ACCENT, spaceBefore=18, spaceAfter=10)
s_h2 = ParagraphStyle('H2', fontName='Times New Roman', fontSize=14, leading=20,
                       textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=8)
s_h3 = ParagraphStyle('H3', fontName='Times New Roman', fontSize=12, leading=17,
                       textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6)
s_body = ParagraphStyle('Body', fontName='Calibri', fontSize=10.5, leading=17,
                         textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=6,
                         firstLineIndent=0)
s_body_indent = ParagraphStyle('BodyIndent', parent=s_body, firstLineIndent=0)
s_bullet = ParagraphStyle('Bullet', parent=s_body, leftIndent=20, bulletIndent=8,
                           spaceBefore=2, spaceAfter=2)
s_note = ParagraphStyle('Note', fontName='Calibri', fontSize=9.5, leading=15,
                          textColor=TEXT_MUTED, alignment=TA_LEFT, leftIndent=15,
                          borderPadding=6, spaceBefore=4, spaceAfter=4)
s_th = ParagraphStyle('TH', fontName='Times New Roman', fontSize=10, leading=14,
                       textColor=colors.white, alignment=TA_CENTER)
s_td = ParagraphStyle('TD', fontName='Calibri', fontSize=10, leading=14,
                       textColor=TEXT_PRIMARY, alignment=TA_CENTER)
s_td_left = ParagraphStyle('TDLeft', parent=s_td, alignment=TA_LEFT)
s_caption = ParagraphStyle('Caption', fontName='Calibri', fontSize=9, leading=13,
                            textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=3, spaceAfter=6)

story = []

# ═══════════════════════════════════════════
# COVER
# ═══════════════════════════════════════════
story.append(Spacer(1, 120))
story.append(Paragraph('<b>META FACTORY AGENT</b>', s_title))
story.append(Spacer(1, 12))
story.append(Paragraph('Plan de Developpement et Architecture', s_subtitle))
story.append(Spacer(1, 30))

# Decorative line
line_data = [['']]
line_table = Table(line_data, colWidths=[available_width * 0.4])
line_table.setStyle(TableStyle([
    ('LINEBELOW', (0, 0), (-1, -1), 2, ACCENT),
    ('TOPPADDING', (0, 0), (-1, -1), 0),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
]))
story.append(line_table)

story.append(Spacer(1, 30))
meta_style = ParagraphStyle('Meta', fontName='Calibri', fontSize=11, leading=16,
                              textColor=TEXT_MUTED, alignment=TA_CENTER)
story.append(Paragraph('Projet separe de NyXia Z (Version Beta)', meta_style))
story.append(Spacer(1, 8))
story.append(Paragraph('Notes de conception et decisions validees', meta_style))
story.append(Spacer(1, 8))
story.append(Paragraph('Derniere mise a jour : 20 avril 2026', meta_style))

story.append(PageBreak())

# ═══════════════════════════════════════════
# TABLE OF CONTENTS (manual simple - no auto-link needed for this short doc)
# ═══════════════════════════════════════════
s_toc_title = ParagraphStyle('TOCTitle', fontName='Times New Roman', fontSize=18, leading=24,
                               textColor=ACCENT, alignment=TA_LEFT, spaceAfter=16)
s_toc_item = ParagraphStyle('TOCItem', fontName='Calibri', fontSize=11, leading=22,
                              textColor=TEXT_PRIMARY, leftIndent=10)

story.append(Paragraph('<b>Table des Matieres</b>', s_toc_title))

toc_items = [
    '1. Vision du Projet',
    '2. Volume et Type de Contenu',
    '3. Plateformes Cibles',
    '4. Outils de Creation de Contenu',
    '5. Voix Off - DeniseNeural via Edge TTS',
    '6. Structure d une Publication',
    '7. Integration ManyChat',
    '8. Acces API - Statut',
    '9. Architecture Proposee',
    '10. Modele Economique',
    '11. Questions en Suspens',
    '12. Prochaines Etapes',
]

for item in toc_items:
    story.append(Paragraph(item, s_toc_item))

story.append(PageBreak())

# ═══════════════════════════════════════════
# 1. VISION DU PROJET
# ═══════════════════════════════════════════
story.append(Paragraph('<b>1. Vision du Projet</b>', s_h1))
story.append(Paragraph(
    'META FACTORY AGENT est un systeme automatise de creation et de publication de contenu social media. '
    'L objectif principal est de generer, planifier et publier du contenu sur plusieurs plateformes sociales '
    'de maniere programmatique, reduisant ainsi le temps de gestion manuelle tout en maintenant une qualite '
    'et une coherence professionnelle a travers tous les canaux de distribution.',
    s_body))
story.append(Paragraph(
    'Le projet est concu comme une application autonome, separee de NyXia Z. Cette decision strategique '
    'permet de developper et tester le systeme independamment sans risquer de destabiliser la plateforme '
    'principale. Une fois la version beta validee et fonctionnelle, une integration dans NyXia Z sera envisagee. '
    'Cette approche iterative garantit que les fonctionnalites sont robustes avant tout deploiement en production.',
    s_body))
story.append(Paragraph(
    'Le systeme doit etre capable de fonctionner de bout en bout : depuis la generation du contenu '
    '(texte, image, video) jusqu a la publication programmee sur les reseaux sociaux, en passant par '
    'l ajout de voix off et le respect des bonnes pratiques d engagement pour chaque plateforme. '
    'L agent doit aussi etre capable de s adapter aux specificites de chaque reseau social en termes '
    'de format, de duree, de dimensions et d exigences techniques.',
    s_body))

# ═══════════════════════════════════════════
# 2. VOLUME ET TYPE DE CONTENU
# ═══════════════════════════════════════════
story.append(Paragraph('<b>2. Volume et Type de Contenu</b>', s_h1))
story.append(Paragraph(
    'Le volume de publication cible est ambitieux mais realisable grace a l automatisation. Chaque jour, '
    'le systeme doit generer et programmer un total de 6 publications reparties en deux categories distinctes. '
    'Ce rythme soutenu vise a maintenir une presence constante sur les reseaux sociaux et a maximiser la '
    'portee organique aupres de l audience cible.',
    s_body))

# Volume table
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
vol_table = Table(vol_data, colWidths=[available_width*0.35, available_width*0.20, available_width*0.22, available_width*0.23])
vol_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
]))
story.append(Spacer(1, 18))
story.append(vol_table)
story.append(Paragraph('Tableau 1 : Volume de publication mensuel', s_caption))
story.append(Spacer(1, 18))

story.append(Paragraph(
    'Chaque publication, qu elle soit texte/image ou video, doit respecter une structure precisement definie '
    'pour maximiser l engagement et le taux d interaction avec l audience. Cette structure a ete elaboree en '
    'fonction des meilleures pratiques actuelles en matiere de marketing de contenu sur les reseaux sociaux, '
    'et vise particulierement a declencher des commentaires de la part de l audience pour activer le systeme '
    'automatise ManyChat.',
    s_body))

# ═══════════════════════════════════════════
# 3. PLATEFORMES CIBLES
# ═══════════════════════════════════════════
story.append(Paragraph('<b>3. Plateformes Cibles</b>', s_h1))
story.append(Paragraph(
    'Le systeme doit etre capable de publier sur plusieurs plateformes sociales simultanement. Chaque plateforme '
    'a ses propres specificites techniques, formats acceptes et limites de caractere qu il faudra respecter. '
    'La liste ci-dessous represente les plateformes prioritaires pour le lancement initial du systeme.',
    s_body))

plat_data = [
    [Paragraph('<b>Plateforme</b>', s_th),
     Paragraph('<b>Comptes / Cibles</b>', s_th),
     Paragraph('<b>Statut API</b>', s_th)],
    [Paragraph('Facebook', s_td_left),
     Paragraph('Profil, Pages multiples, Groupes', s_td_left),
     Paragraph('En cours - Validation Meta Business (charte entreprise requise)', s_td_left)],
    [Paragraph('Instagram', s_td_left),
     Paragraph('Plusieurs comptes (Posts, Reels, Stories)', s_td_left),
     Paragraph('En cours - Lie a Meta Business (meme validation)', s_td_left)],
    [Paragraph('TikTok', s_td_left),
     Paragraph('Compte principal', s_td_left),
     Paragraph('Pas encore - A faire prochainement', s_td_left)],
    [Paragraph('YouTube', s_td_left),
     Paragraph('Chaine principale', s_td_left),
     Paragraph('Pas encore - A faire prochainement', s_td_left)],
]
plat_table = Table(plat_data, colWidths=[available_width*0.22, available_width*0.38, available_width*0.40])
plat_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(Spacer(1, 18))
story.append(plat_table)
story.append(Paragraph('Tableau 2 : Plateformes cibles et statut d acces API', s_caption))
story.append(Spacer(1, 18))

story.append(Paragraph(
    'Pour Facebook et Instagram, la validation est en cours via le programme Meta Business. Les regles de '
    'validation de Meta ont recemment change et necessitent la charte d entreprise pour completer le processus. '
    'Cette etape administrative est indispensable car elle debloque l acces a l API Graph de Meta qui permet '
    'la publication programmee sur les pages, profils et groupes Facebook ainsi que sur les comptes Instagram. '
    'Sans cette validation, aucune publication automatisee n est possible sur ces deux plateformes.',
    s_body))
story.append(Paragraph(
    'Pour TikTok et YouTube, l inscription aux programmes developpeurs est planifiee mais pas encore effectuee. '
    'YouTube requiert un compte Google Developer Console avec la YouTube Data API v3 activee. TikTok propose '
    'le TikTok Content Posting API qui necessite une inscription au TikTok for Developers. Ces etapes peuvent '
    'etre realisees en parallele du developpement du systeme principal, car les API ne sont pas necessaires '
    'pour la phase de test initiale de generation de contenu.',
    s_body))

# ═══════════════════════════════════════════
# 4. OUTILS DE CREATION DE CONTENU
# ═══════════════════════════════════════════
story.append(Paragraph('<b>4. Outils de Creation de Contenu</b>', s_h1))
story.append(Paragraph(
    'La creation de contenu est le coeur du systeme. Plusieurs outils gratuits et open source sont disponibles '
    'pour generer des images et des videos de qualite. L avantage majeur est que ces outils sont deja integres '
    'dans le projet NyXia Z et fonctionnent sans cout supplementaire, ce qui rend le modele economique tres '
    'avantageux. Aucune limite de credits ou de couts par generation n empeche la production a grande echelle.',
    s_body))

story.append(Paragraph('<b>4.1 Generation Video</b>', s_h2))
story.append(Paragraph(
    'Wan est le moteur de generation video principal et deja operationnel dans NyXia Z. C est un modele open source '
    'et gratuit qui permet de creer des courtes sequences video a partir de prompts textuels. La duree maximale '
    'par video est de 15 secondes, ce qui est ideal pour les formats courts des reseaux sociaux (Reels Instagram, '
    'TikTok, YouTube Shorts). Wan genere egalement de l audio ambiant dans ses videos, ce qui sera exploite '
    'pour le mixage avec la voix off DeniseNeural.',
    s_body))
story.append(Paragraph(
    'En complement, d autres modeles gratuits sont disponibles comme solutions de secours ou pour varier les styles : '
    'Luma Dream Machine (qualite superieure, credits gratuits quotidiens, jusqu a 5 secondes en mode gratuit) et '
    'Kling AI (66 credits gratuits par jour, jusqu a 10 secondes). Ces alternatives peuvent etre utilisees comme '
    'fallback si Wan rencontre des problemes ou pour diversifier le style visuel du contenu publie.',
    s_body))

story.append(Paragraph('<b>4.2 Generation d Images</b>', s_h2))
story.append(Paragraph(
    'Pour les 4 publications quotidiennes de type texte + image, un modele de generation d images est requis. '
    'FLUX est actuellement l option privilegiee car il offre une qualite photographique exceptionnelle et est '
    'gratuitement accessible via API. Les images generees doivent etre de haute qualite, visuellement attrayantes '
    'et pertinentes par rapport au texte de la publication pour capter l attention de l audience dans le fil '
    'd actualite tres concurrentiel des reseaux sociaux.',
    s_body))

# Tools summary table
tools_data = [
    [Paragraph('<b>Outil</b>', s_th),
     Paragraph('<b>Type</b>', s_th),
     Paragraph('<b>Cout</b>', s_th),
     Paragraph('<b>Details</b>', s_th)],
    [Paragraph('Wan', s_td_left),
     Paragraph('Video', s_td),
     Paragraph('Gratuit', s_td),
     Paragraph('Max 15 sec, audio inclus, deja dans NyXia Z', s_td_left)],
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
]
tools_table = Table(tools_data, colWidths=[available_width*0.22, available_width*0.13, available_width*0.13, available_width*0.52])
tools_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(Spacer(1, 18))
story.append(tools_table)
story.append(Paragraph('Tableau 3 : Outils de creation de contenu', s_caption))
story.append(Spacer(1, 18))

# ═══════════════════════════════════════════
# 5. VOIX OFF - DENISE NEURAL
# ═══════════════════════════════════════════
story.append(Paragraph('<b>5. Voix Off - DeniseNeural via Edge TTS</b>', s_h1))
story.append(Paragraph(
    'La voix DeniseNeural (fr-CA-DeniseNeural) est la voix off selectionnee pour les videos generees par le systeme. '
    'Apres plusieurs tests et investigations, la solution technique retenue est d utiliser le package Python edge-tts '
    'pour generer des fichiers audio MP3 contenant la narration. Cette approche est validee et fonctionnelle.',
    s_body))

story.append(Paragraph('<b>5.1 Pourquoi edge-tts fonctionne ici (mais pas dans le navigateur)</b>', s_h2))
story.append(Paragraph(
    'Lors de nos precedents tests avec Edge TTS sur NyXia Z, nous avons rencontre deux bloquants techniques majeurs '
    'qui empechent son utilisation en temps reel dans le navigateur : (1) Cloudflare Workers ne peut pas se connecter '
    'a des WebSockets externes comme wss://speech.platform.bing.com, et (2) les navigateurs rejettent les connexions '
    'WebSocket vers Microsoft car l en-tete Origin ne correspond pas a l extension Edge TTS officielle.',
    s_body))
story.append(Paragraph(
    'Cependant, pour la creation de videos, le contexte est completement different. Le package Python edge-tts '
    'se connecte directement aux serveurs Microsoft en dehors de tout environnement navigateur ou Cloudflare Worker. '
    'Il n y a aucune restriction d Origin, aucune limitation de plateforme, et aucune dependance a un service tiers. '
    'Le resultat est un fichier audio MP3 de haute qualite avec la voix DeniseNeural, pret a etre integre dans '
    'la video finale.',
    s_body))

story.append(Paragraph('<b>5.2 Integration audio dans les videos Wan</b>', s_h2))
story.append(Paragraph(
    'Wan genere nativement des videos avec un audio ambiant (effets sonores, atmosphere). Plutot que de remplacer '
    'cet audio, le systeme proposera de le conserver et d y superposer la voix off DeniseNeural. Le volume de '
    'l audio original de Wan sera reduit (environ 30% du volume original) pour laisser la narration clairement '
    'audible tout en conservant l immersion sonore de la video. Ce mixage sera realise avec FFmpeg, un outil '
    'standard de traitement multimedia.',
    s_body))
story.append(Paragraph(
    'Le processus complet de creation video avec voix off sera le suivant : (1) Wan genere la video avec son audio '
    'original, (2) edge-tts genere la narration en MP3 avec la voix DeniseNeural a partir du script fourni, '
    '(3) FFmpeg fusionne les deux pistes audio en ajustant les volumes respectifs, (4) le resultat est une video '
    'MP4 finale avec ambiance + narration professionnelle.',
    s_body))

# ═══════════════════════════════════════════
# 6. STRUCTURE D UNE PUBLICATION
# ═══════════════════════════════════════════
story.append(Paragraph('<b>6. Structure d une Publication</b>', s_h1))
story.append(Paragraph(
    'Chaque publication genere par le systeme doit respecter une structure strictement definie pour maximiser '
    'son impact sur l audience. Cette structure a ete concue specifiquement pour stimuler l engagement et '
    'declencher des commentaires, lesquels activent le systeme ManyChat pour la conversion automatique. '
    'Les quatre elements composant chaque publication sont les suivants :',
    s_body))

struct_data = [
    [Paragraph('<b>Element</b>', s_th),
     Paragraph('<b>Description</b>', s_th),
     Paragraph('<b>Objectif</b>', s_th)],
    [Paragraph('Titre Stop-Scroll', s_td_left),
     Paragraph('Phrase d accroche percutante en premiere ligne', s_td_left),
     Paragraph('Arreter le defilement et capter l attention immediatement', s_td_left)],
    [Paragraph('Corps du texte', s_td_left),
     Paragraph('Message principal, valeur ajoutee, information', s_td_left),
     Paragraph('Delivrer le message et apporter de la valeur a l audience', s_td_left)],
    [Paragraph('CTA fort', s_td_left),
     Paragraph('Appel a l action oriente engagement/commentaire', s_td_left),
     Paragraph('Declencher un commentaire pour activer ManyChat', s_td_left)],
    [Paragraph('Hashtags', s_td_left),
     Paragraph('Exactement 3 hashtags optimises algorithme', s_td_left),
     Paragraph('Maximiser la portee organique via les recommandations', s_td_left)],
]
struct_table = Table(struct_data, colWidths=[available_width*0.22, available_width*0.40, available_width*0.38])
struct_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 4), (-1, 4), TABLE_ROW_ODD),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(Spacer(1, 18))
story.append(struct_table)
story.append(Paragraph('Tableau 4 : Structure type d une publication', s_caption))
story.append(Spacer(1, 18))

story.append(Paragraph(
    'Le CTA (Call to Action) est l element le plus strategique de chaque publication. Il doit etre concu pour '
    'encourager les utilisateurs a laisser un commentaire specifique (par exemple, un mot-cle, un emoji ou une '
    'reponse a une question). Ce commentaire sert de declencheur pour ManyChat, un outil d automatisation de '
    'messagerie qui permet d engager automatiquement la conversation en message prive, conduisant ainsi '
    'l utilisateur le long du funnel de conversion. L ensemble du systeme de publication est donc oriente '
    'vers la generation de commentaires qualifiés.',
    s_body))

# ═══════════════════════════════════════════
# 7. INTEGRATION MANYCHAT
# ═══════════════════════════════════════════
story.append(Paragraph('<b>7. Integration ManyChat</b>', s_h1))
story.append(Paragraph(
    'ManyChat est un outil d automatisation de conversations utilise comme piece maitresse de la strategie '
    'de conversion. Le lien entre les publications sociales et ManyChat fonctionne de la maniere suivante : '
    'chaque publication inclut un CTA concu pour provoquer un commentaire de l utilisateur. Lorsqu un '
    'commentaire est detecte, ManyChat intervient automatiquement pour engager la conversation en message '
    'prive (Facebook Messenger, Instagram DM, etc.).',
    s_body))
story.append(Paragraph(
    'Le systeme META FACTORY AGENT doit generer des CTA compatibles avec les declencheurs ManyChat configures. '
    'Par exemple, si ManyChat est configure pour reagir au mot-cle "INFO" dans les commentaires, le CTA genere '
    'par l agent doit inciter les utilisateurs a commenter ce mot-cle precis. Cette coherence entre le contenu '
    'genere et l automatisation ManyChat est essentielle pour que le pipeline de conversion fonctionne de bout '
    'en bout sans intervention manuelle.',
    s_body))
story.append(Paragraph(
    'ManyChat offre egalement des fonctionnalites avancees comme les flows de conversation, les sequences '
    'automatisees, la segmentation d audience et les analytics. Le systeme devrait ideally pouvoir se parametrer '
    'avec differentes campagnes ManyChat selon le type de contenu publie, permettant ainsi de diriger les '
    'utilisateurs vers differentes offres ou entonnoirs de conversion selon la publication source.',
    s_body))

# ═══════════════════════════════════════════
# 8. ACCES API - STATUT
# ═══════════════════════════════════════════
story.append(Paragraph('<b>8. Acces API - Statut</b>', s_h1))
story.append(Paragraph(
    'L acces aux API des plateformes sociales est une precondition technique indispensable pour la publication '
    'automatisee. Chaque plateforme a son propre processus d inscription developpeur et ses propres conditions '
    'd utilisation. Le tableau ci-dessous resume le statut actuel pour chaque plateforme et les etapes restantes.',
    s_body))

api_data = [
    [Paragraph('<b>Plateforme</b>', s_th),
     Paragraph('<b>Statut</b>', s_th),
     Paragraph('<b>Action requise</b>', s_th)],
    [Paragraph('Facebook / Instagram', s_td_left),
     Paragraph('En attente', s_td),
     Paragraph('Completer la validation Meta Business avec la charte d entreprise', s_td_left)],
    [Paragraph('TikTok', s_td_left),
     Paragraph('Non demarre', s_td),
     Paragraph('Inscription TikTok for Developers + Content Posting API', s_td_left)],
    [Paragraph('YouTube / Google', s_td_left),
     Paragraph('Non demarre', s_td),
     Paragraph('Google Developer Console + YouTube Data API v3', s_td_left)],
]
api_table = Table(api_data, colWidths=[available_width*0.22, available_width*0.15, available_width*0.63])
api_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_EVEN),
    ('BACKGROUND', (0, 2), (-1, 2), TABLE_ROW_ODD),
    ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_EVEN),
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(Spacer(1, 18))
story.append(api_table)
story.append(Paragraph('Tableau 5 : Statut d acces aux API', s_caption))
story.append(Spacer(1, 18))

story.append(Paragraph(
    'Il est important de noter que le developpement du systeme peut commencer meme sans acces complet aux API. '
    'La generation de contenu (texte, images, videos, voix off) peut etre developpee et testee independamment. '
    'La couche de publication ne sera branchee qu une fois les acces API obtenus. Cette separation des responsabilites '
    'permet de ne pas bloquer le developpement sur des demarches administratives externes.',
    s_body))

# ═══════════════════════════════════════════
# 9. ARCHITECTURE PROPOSEE
# ═══════════════════════════════════════════
story.append(Paragraph('<b>9. Architecture Proposee</b>', s_h1))
story.append(Paragraph(
    'L architecture de META FACTORY AGENT est organisee en modules independants qui communiquent entre eux. '
    'Cette approche modulaire permet de developper, tester et maintenir chaque composant separement. Le systeme '
    'comprend quatre couches principales : la generation de contenu, la gestion du calendrier, le moteur de '
    'publication et l interface utilisateur.',
    s_body))

story.append(Paragraph('<b>9.1 Module de Generation de Contenu</b>', s_h2))
story.append(Paragraph(
    'Ce module est responsable de la creation de tous les elements d une publication. Il integre un modele de '
    'langage pour generer le texte (titre stop-scroll, corps, CTA, hashtags), un moteur de generation d images '
    '(FLUX) pour les publications texte + image, un moteur de generation video (Wan) pour les publications '
    'video + texte, et le moteur de voix off (edge-tts avec DeniseNeural) pour la narration video. Chaque '
    'element est genere selon les templates et regles definis dans la configuration du systeme, assurant '
    'une coherence visuelle et textuelle a travers toutes les publications.',
    s_body))

story.append(Paragraph('<b>9.2 Module Calendrier</b>', s_h2))
story.append(Paragraph(
    'Le calendrier est l element central de l organisation du systeme. Il permet de planifier les publications '
    'a l avance, de definir les horaires optimaux de publication pour chaque plateforme, et de visualiser '
    'l ensemble du planning de maniere intuitive. L interface devrait prendre la forme d un calendrier visuel '
    'interactif de type vue mensuelle/semainale avec la possibilite de glisser-deposer les publications pour '
    'les reprogrammer. Le systeme doit gerer automatiquement les fuseaux horaires et les meilleures plages '
    'de publication selon les donnees d engagement de chaque plateforme.',
    s_body))

story.append(Paragraph('<b>9.3 Moteur de Publication</b>', s_h2))
story.append(Paragraph(
    'Le moteur de publication est responsable de l envoi effectif du contenu vers chaque plateforme sociale. '
    'Il doit gerer les specificites techniques de chaque API (format d image, duree video, dimensions, limites '
    'de caracteres), les tokens d authentification et leur renouvellement, les retries en cas d echec, et '
    'les logs de publication pour le suivi. Ce module est le dernier a etre branche car il depend directement '
    'de l obtention des acces API des differentes plateformes.',
    s_body))

story.append(Paragraph('<b>9.4 Interface Utilisateur</b>', s_h2))
story.append(Paragraph(
    'L interface utilisateur est le point de contact humain avec le systeme. Elle doit permettre de configurer '
    'les parametres de generation (sujets, ton, style), de gerer le calendrier de publication, de visualiser '
    'les publications generees avant qu elles ne soient publiees, d approuver ou modifier le contenu, et de '
    'suivre les performances (statistiques de base). L interface devrait etre developpee en Next.js pour etre '
    'coherente avec l ecosysteme technique existant.',
    s_body))

# ═══════════════════════════════════════════
# 10. MODELE ECONOMIQUE
# ═══════════════════════════════════════════
story.append(Paragraph('<b>10. Modele Economique</b>', s_h1))
story.append(Paragraph(
    'L un des avantages majeurs de META FACTORY AGENT est son cout de production quasi nul. Tous les outils '
    'de creation de contenu utilises (Wan, FLUX, edge-tts) sont gratuits et open source. Le seul cout '
    'recurrent est l hebergement du serveur qui fait tourner le systeme. Cela signifie que la marge sur '
    'chaque publication vendue aux clients est extremement elevee.',
    s_body))
story.append(Paragraph(
    'Pour un client avec un forfait mensuel de 168 publications (6 par jour, 7 jours sur 7), le cout reel '
    'de production est virtuellement nul puisque tout repose sur des outils gratuits. Le modele de revenus '
    'est base sur un abonnement mensuel facture au client, incluant la creation, la planification et la '
    'publication automatisee du contenu. Le retour sur investissement pour le client est important car le '
    'systeme remplace plusieurs heures de travail manuel quotidien par une automation complete.',
    s_body))
story.append(Paragraph(
    'Le fait que Wan soit open source et gratuit est un atout considerable pour la proposition de valeur '
    'aupres des clients. Il n y a pas de cout cache, pas de frais de credits par generation, et pas de '
    'limitation volumetrique. Le client paie pour le service d automation et la qualite du contenu genere, '
    'pas pour des frais de consommation d API. Cela simplifie egalement la tarification et rend le modele '
    'previsible tant pour le prestataire que pour le client.',
    s_body))

# ═══════════════════════════════════════════
# 11. QUESTIONS EN SUSPENS
# ═══════════════════════════════════════════
story.append(Paragraph('<b>11. Questions en Suspens</b>', s_h1))
story.append(Paragraph(
    'Plusieurs questions restent a explorer et a valider avant de finaliser l architecture du systeme. '
    'Ces points devront etre discutes et tranches lors des prochaines sessions de travail.',
    s_body))

questions = [
    'FFmpeg : Le serveur dispose-t-il de FFmpeg installe pour le mixage audio/video ? Si non, '
    'l installation est simple mais necessite un acces au serveur.',

    'Calendrier multi-plaforme : Comment gerer les plages horaires optimales differentes pour chaque '
    'plateforme ? Chaque reseau a ses propres heures de pointe pour l engagement.',

    'ManyChat API : Faut-il integrer directement l API de ManyChat dans le systeme pour declencher '
    'automatiquement des flows, ou la configuration manuelle des declencheurs mots-cles suffit-elle ?',

    'Validation du contenu : Faut-il un systeme d approbation manuelle avant publication, ou les '
    'publications peuvent-elles etre publiees automatiquement sans revision humaine ?',

    'Multi-tenant : Le systeme doit-il supporter plusieurs clients simultanement avec des calendriers '
    'et des configurations separes, ou est-il concu pour un seul client dans un premier temps ?',

    'Analytics : Quel niveau de suivi des performances est attendu ? Statistiques de base (nombre de '
    'publications, statut) ou analytics approfondis (engagement, portee, clics) via les API des plateformes ?',
]

for i, q in enumerate(questions, 1):
    story.append(Paragraph('<b>{0}.</b> {1}'.format(i, q), s_bullet))
    story.append(Spacer(1, 4))

# ═══════════════════════════════════════════
# 12. PROCHAINES ETAPES
# ═══════════════════════════════════════════
story.append(Paragraph('<b>12. Prochaines Etapes</b>', s_h1))
story.append(Paragraph(
    'Les prochaines etapes du projet sont organisees par ordre de priorite. Certaines etapes peuvent etre '
    'realisees en parallele, tandis que d autres dependent de prealables (comme l acces aux API). Cette '
    'feuille de route sera mise a jour au fur et a mesure de l avancement du projet.',
    s_body))

steps_data = [
    [Paragraph('<b>Etape</b>', s_th),
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
     Paragraph('Developper le module de generation de contenu (texte + image)', s_td_left)],
    [Paragraph('4', s_td),
     Paragraph('Moyenne', s_td),
     Paragraph('Aucune', s_td),
     Paragraph('Developper l interface du calendrier de publication', s_td_left)],
    [Paragraph('5', s_td),
     Paragraph('Moyenne', s_td),
     Paragraph('Etape 3 + 4', s_td),
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
]
steps_table = Table(steps_data, colWidths=[available_width*0.07, available_width*0.12, available_width*0.14, available_width*0.67])
steps_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    *[('BACKGROUND', (0, i), (-1, i), TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD) for i in range(1, 9)],
    ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(Spacer(1, 18))
story.append(steps_table)
story.append(Paragraph('Tableau 6 : Feuille de route des prochaines etapes', s_caption))

# ── Build ──
doc.build(story)
print(f'PDF generated: {OUTPUT}')
