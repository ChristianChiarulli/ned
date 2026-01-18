import type { TextMatchTransformer } from '@lexical/markdown';
import { $createLinkNode, $isLinkNode, LinkNode } from '../nodes/LinkNode';

export const LINK: TextMatchTransformer = {
  dependencies: [LinkNode],
  export: (node) => {
    if (!$isLinkNode(node)) {
      return null;
    }
    const displayText = node.getDisplayText();
    const url = node.getUrl();
    // If displayText is set (user customized it), use markdown format
    // Otherwise just output the raw URL
    if (displayText) {
      return `[${displayText}](${url})`;
    }
    return url;
  },
  // Match [text](url) format
  importRegExp: /\[([^\]]+)\]\(([^)]+)\)/,
  regExp: /\[([^\]]+)\]\(([^)]+)\)$/,
  trigger: ')',
  replace: (textNode, match) => {
    const [, displayText, url] = match;
    const linkNode = $createLinkNode({ url, displayText });
    textNode.replace(linkNode);
  },
  type: 'text-match',
};
