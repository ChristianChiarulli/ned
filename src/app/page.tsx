'use client';

import { NostrEditor } from '@/components/editor';

const sampleContent = `# Welcome to NED

This is a **Nostr Editor** built with *Lexical*. It supports various markdown features.

## Text Formatting

You can write **bold**, *italic*, ~~strikethrough~~, and \`inline code\`.

## Lists

Here's a bullet list:
- First item
- Second item
    - Nested item one
    - Nested item two
- Third item

And a numbered list:
1. Step one
2. Step two
3. Step three

## Code Blocks

Here's a multiline code block:

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);

  // Empty line above
  return true;
}
\`\`\`

## Blockquotes

> This is a blockquote.
> It can span multiple lines.

## Images

![Saturn](https://cdn.mos.cms.futurecdn.net/BwL2586BtvBPywasXXtzwA-1000-80.jpeg.webp)

---

That's a horizontal rule above. Happy writing!
`;

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 cursor-text">
      <main className="w-full max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          NED - Nostr Editor
        </h1>
        <NostrEditor
          placeholder="What's on your mind?"
          initialMarkdown={sampleContent}
        />
      </main>
    </div>
  );
}
