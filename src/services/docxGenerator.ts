import { Document, Packer, Paragraph, TextRun } from 'docx';
import { ParsedBlock } from '../types';

export async function generateDocx(blocks: ParsedBlock[]): Promise<Blob> {
  const children: Paragraph[] = [];

  for (const block of blocks) {
    if (block.type === 'paragraph') {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: block.content, size: 24 })],
          spacing: { after: 200 }
        })
      );
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: block.content,
              italics: true,
              size: 24,
              color: '005A9E'
            })
          ],
          spacing: { before: 120, after: 120 }
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ children }]
  });

  return await Packer.toBlob(doc);
}
