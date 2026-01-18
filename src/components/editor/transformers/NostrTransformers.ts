import type { TextMatchTransformer } from '@lexical/markdown';
import { $createNpubNode, $isNpubNode, NpubNode } from '../nodes/NpubNode';
import { $createNprofileNode, $isNprofileNode, NprofileNode } from '../nodes/NprofileNode';
import { $createNeventNode, $isNeventNode, NeventNode } from '../nodes/NeventNode';
import { $createNaddrNode, $isNaddrNode, NaddrNode } from '../nodes/NaddrNode';

export const NPUB: TextMatchTransformer = {
  dependencies: [NpubNode],
  export: (node) => {
    if (!$isNpubNode(node)) {
      return null;
    }
    return node.getNpub();
  },
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

export const NPROFILE: TextMatchTransformer = {
  dependencies: [NprofileNode],
  export: (node) => {
    if (!$isNprofileNode(node)) {
      return null;
    }
    return node.getNprofile();
  },
  // nprofile has variable length (contains pubkey + optional relays)
  importRegExp: /nprofile1[a-z0-9]+/i,
  regExp: /nprofile1[a-z0-9]+$/i,
  trigger: ' ',
  replace: (textNode, match) => {
    const [nprofile] = match;
    const node = $createNprofileNode({ nprofile });
    textNode.replace(node);
  },
  type: 'text-match',
};

export const NEVENT: TextMatchTransformer = {
  dependencies: [NeventNode],
  export: (node) => {
    if (!$isNeventNode(node)) {
      return null;
    }
    return node.getNevent();
  },
  // nevent has variable length (contains event id + optional relays/author)
  importRegExp: /nevent1[a-z0-9]+/i,
  regExp: /nevent1[a-z0-9]+$/i,
  trigger: ' ',
  replace: (textNode, match) => {
    const [nevent] = match;
    const node = $createNeventNode({ nevent });
    textNode.replace(node);
  },
  type: 'text-match',
};

export const NADDR: TextMatchTransformer = {
  dependencies: [NaddrNode],
  export: (node) => {
    if (!$isNaddrNode(node)) {
      return null;
    }
    return node.getNaddr();
  },
  // naddr has variable length (contains kind + pubkey + d-tag + optional relays)
  importRegExp: /naddr1[a-z0-9]+/i,
  regExp: /naddr1[a-z0-9]+$/i,
  trigger: ' ',
  replace: (textNode, match) => {
    const [naddr] = match;
    const node = $createNaddrNode({ naddr });
    textNode.replace(node);
  },
  type: 'text-match',
};

// Export all Nostr transformers as an array for convenience
export const NOSTR_TRANSFORMERS = [NPUB, NPROFILE, NEVENT, NADDR];
