import type { TextMatchTransformer } from '@lexical/markdown';
import { $createNpubNode, $isNpubNode, NpubNode } from '../nodes/NpubNode';

export const NPUB: TextMatchTransformer = {
  dependencies: [NpubNode],
  export: (node) => {
    if (!$isNpubNode(node)) {
      return null;
    }
    // Export as raw npub
    return node.getNpub();
  },
  // Match npub1 followed by 58 bech32 characters
  importRegExp: /npub1[a-z0-9]{58}/i,
  regExp: /npub1[a-z0-9]{58}$/i,
  trigger: ' ',
  replace: (textNode, match) => {
    const [npub] = match;
    const npubNode = $createNpubNode({ npub });
    textNode.replace(npubNode);
  },
  type: 'text-match',
};
