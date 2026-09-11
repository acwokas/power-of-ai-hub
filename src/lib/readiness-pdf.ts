import { jsPDF } from 'jspdf';
export function readinessPdf(text:string,fontBase64:string){
 const pdf=new jsPDF({unit:'mm',format:'a4'});
 pdf.addFileToVFS('NotoSans.ttf',fontBase64);pdf.addFont('NotoSans.ttf','NotoSans','normal');pdf.setFont('NotoSans');
 pdf.setProperties({title:'EDGE AI readiness review',author:'EDGE by Adrian Watkins'});
 const width=170;let y=28;
 const header=()=>{pdf.setFillColor(21,43,57);pdf.rect(0,0,210,12,'F');pdf.setFontSize(9);pdf.setTextColor(21,43,57);pdf.text('EDGE / WORKING REVIEW',20,21);y=31;};header();
 const glyphs=(pdf.getFont() as any).metadata?.cmap?.unicode?.codeMap;
 if(glyphs&&[...text].some(ch=>ch.charCodeAt(0)>32&&!glyphs[ch.codePointAt(0)!]))throw new Error('This PDF font cannot preserve every character in your notes. Use the text download or Print / save as PDF to preserve the full text.');
 for(const paragraph of text.split('\n\n')){
  const heading=/^(EDGE AI|Evaluate \/|Define \/|Govern \/|Elevate \/)/.test(paragraph);
  pdf.setFontSize(heading?13:10.5);pdf.setTextColor(heading?21:40,heading?43:40,heading?57:40);
  const lines=pdf.splitTextToSize(paragraph,width) as string[];
  if(heading&&y>246){pdf.addPage();header();}
  for(const line of lines){if(y>270){pdf.addPage();header();pdf.setFontSize(heading?13:10.5);}pdf.text(line,20,y);y+=heading?6.3:5.2;}y+=4;
 }
 const total=pdf.getNumberOfPages();for(let n=1;n<=total;n++){pdf.setPage(n);pdf.setFontSize(8);pdf.setTextColor(80,80,80);pdf.text('User-authored discussion brief. No certification or approval.',20,285);pdf.text(n+' / '+total,190,285,{align:'right'});}
 return pdf;
}
export async function downloadReadinessPdf(report:string){const response=await fetch('/fonts/NotoSans-Regular.ttf');if(!response.ok)throw new Error('The PDF font could not be loaded. Use the text download instead.');const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);readinessPdf(report,btoa(binary)).save('EDGE-AI-readiness-review.pdf');}
