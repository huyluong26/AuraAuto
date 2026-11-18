export type BlockType = 'paragraph' | 'image' | 'heading' | 'quote' | 'list';

export interface ContentBlock {
  id: string;
  type: BlockType;
  value: string;
  caption?: string;
  headingLevel?: 2 | 3;
}

export function generateBlockId(): string {
  return 'b_' + Math.random().toString(36).substring(2, 9);
}

// Chuyển danh sách blocks thành chuỗi Markdown lưu trữ
export function blocksToMarkdown(blocks: ContentBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'heading':
          return `## ${b.value.trim()}`;
        case 'image':
          if (b.caption && b.caption.trim()) {
            return `![${b.caption.trim()}](${b.value.trim()})\n*${b.caption.trim()}*`;
          }
          return `![Hình ảnh minh họa](${b.value.trim()})`;
        case 'quote':
          return `> ${b.value.trim()}`;
        case 'list':
          return b.value
            .split('\n')
            .map((line) => (line.trim().startsWith('-') ? line.trim() : `- ${line.trim()}`))
            .join('\n');
        case 'paragraph':
        default:
          return b.value.trim();
      }
    })
    .filter(Boolean)
    .join('\n\n');
}

// Phân giải chuỗi Markdown thành các khối Blocks trực quan
export function markdownToBlocks(md: string): { blocks: ContentBlock[]; images: string[] } {
  const sections = md.split('\n\n');
  const blocks: ContentBlock[] = [];
  const foundImages: string[] = [];

  sections.forEach((sec) => {
    const trimmed = sec.trim();
    if (!trimmed) return;

    // Image: ![caption](url)
    const imgMatch = trimmed.match(/^!\[([\s\S]*?)\]\((https?:\/\/[^\s\)]+)\)(?:\s*\n\*(.*?)\*)?$/);
    if (imgMatch) {
      const url = imgMatch[2];
      const caption = imgMatch[3] || imgMatch[1];
      blocks.push({
        id: generateBlockId(),
        type: 'image',
        value: url,
        caption: caption === 'Hình ảnh minh họa' ? '' : caption,
      });
      if (!foundImages.includes(url)) foundImages.push(url);
      return;
    }

    // Heading 2 or 3
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      const text = trimmed.replace(/^#{2,3}\s+/, '');
      blocks.push({
        id: generateBlockId(),
        type: 'heading',
        headingLevel: trimmed.startsWith('###') ? 3 : 2,
        value: text,
      });
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const text = trimmed.replace(/^>\s*/gm, '');
      blocks.push({
        id: generateBlockId(),
        type: 'quote',
        value: text,
      });
      return;
    }

    // Bullet List
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({
        id: generateBlockId(),
        type: 'list',
        value: trimmed,
      });
      return;
    }

    // Paragraph
    blocks.push({
      id: generateBlockId(),
      type: 'paragraph',
      value: trimmed,
    });
  });

  return { blocks, images: foundImages };
}
