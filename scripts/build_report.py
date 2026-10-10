"""Rebuild the submission PDF from report.html and the current browser screenshots.
Requires reportlab and Pillow. Does not run a browser or alter the screenshots.
"""
from pathlib import Path
import re, html
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Image, KeepTogether, Spacer, Flowable

root=Path(__file__).resolve().parents[1]/'CG_Assignment1_BabylonJS_2D_Rasterisation/starter'
font_root=Path('/System/Library/Fonts/Supplemental')
for name,filename in [('ReportSerif','Times New Roman.ttf'),('ReportSerifItalic','Times New Roman Italic.ttf'),('ReportSerifBold','Times New Roman Bold.ttf'),('ReportSerifBoldItalic','Times New Roman Bold Italic.ttf'),('ReportUnicode','Arial Unicode.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(font_root/filename)))
pdfmetrics.registerFontFamily('ReportSerif',normal='ReportSerif',bold='ReportSerifBold',italic='ReportSerifItalic',boldItalic='ReportSerifBoldItalic')
class DistanceEquation(Flowable):
    """Vector typeset fraction with a drawn radical and raised exponents."""
    def __init__(self):
        super().__init__(); self.width=200; self.height=52; self.hAlign='CENTER'
    def draw(self):
        c=self.canv
        c.setFont('ReportSerifItalic',12); c.drawString(8,25,'d')
        c.setFont('ReportSerif',12); c.drawString(20,25,'=')
        c.setFont('ReportSerifItalic',12); c.drawCentredString(110,38,'|Ax + By + C|')
        c.setLineWidth(0.6); c.line(50,31,170,31)
        # The radical stroke and its overbar are one continuous vector path.
        path=c.beginPath(); path.moveTo(69,17); path.lineTo(73,20)
        path.lineTo(77,10); path.lineTo(83,26); path.lineTo(151,26)
        c.drawPath(path)
        c.setFont('ReportSerifItalic',12); c.drawString(89,12,'A')
        c.setFont('ReportSerif',8); c.drawString(98,18,'2')
        c.setFont('ReportSerif',12); c.drawString(111,12,'+')
        c.setFont('ReportSerifItalic',12); c.drawString(126,12,'B')
        c.setFont('ReportSerif',8); c.drawString(135,18,'2')

styles={
 'p':ParagraphStyle('body',fontName='ReportSerif',fontSize=9.5,leading=13,spaceAfter=7),
 'h1':ParagraphStyle('title',fontName='ReportSerifBold',fontSize=16,leading=21,alignment=TA_CENTER,spaceAfter=9),
 'h2':ParagraphStyle('heading',fontName='ReportSerifBold',fontSize=12,leading=16,spaceBefore=8,spaceAfter=5,keepWithNext=True),
 'caption':ParagraphStyle('caption',fontName='ReportSerif',fontSize=8.5,leading=11,spaceBefore=4,spaceAfter=8),
}
s=(root/'report.html').read_text()
body=s.split('<body>')[1].split('</body>')[0]
blocks=re.findall(r'<(h1|h2|p|figure|div)\b[^>]*>(.*?)</\1>',body,re.S)
def clean(t):
    t=t.replace('楚天泽','<font name="ReportUnicode">楚天泽</font>')
    return t.replace('<br>','<br/>').replace('<em>','<i>').replace('</em>','</i>').replace('<code>','<font name="ReportUnicode">').replace('</code>','</font>')
story=[]
for tag,t in blocks:
    if tag=='div':
        story.append(DistanceEquation())
    elif tag=='figure':
        path=root/re.search(r'<img src="([^"]+)"',t)[1]
        from PIL import Image as PILImage
        w,h=PILImage.open(path).size
        width=350
        caption=re.search(r'<figcaption>(.*?)</figcaption>',t,re.S)[1]
        story.append(KeepTogether([Image(str(path),width=width,height=width*h/w),Paragraph(clean(caption),styles['caption'])]))
    else: story.append(Paragraph(clean(t),styles[tag]))
def footer(canvas,doc):
    canvas.saveState(); canvas.setFont('ReportSerif',8)
    canvas.drawString(42,22,'COMP3033J | BDIC 24372307 | UCD 24107737')
    canvas.drawRightString(A4[0]-42,22,str(doc.page)); canvas.restoreState()
SimpleDocTemplate(str(root/'report.pdf'),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=36,bottomMargin=40,title='2D Rasterisation: Lines, Triangles and a House',author='Chu Tianze (楚天泽)').build(story,onFirstPage=footer,onLaterPages=footer)
plain=html.unescape(re.sub('<[^>]+>',' ',body))
print('Report body word count:',len(plain.split()))
print('PDF:',root/'report.pdf')
