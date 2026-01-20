'use client';

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $convertFromMarkdownString,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
} from '@lexical/markdown';
import { IMAGE } from '../transformers/ImageTransformer';
import { LINK } from '../transformers/LinkTransformer';
import { NOSTR_TRANSFORMERS } from '../transformers/NostrTransformers';
import { TABLE } from '../transformers/TableTransformer';
import { HORIZONTAL_RULE } from '../transformers/HorizontalRuleTransformer';

// TABLE and IMAGE must come first for proper matching
// We exclude TEXT_MATCH_TRANSFORMERS (which contains the default LINK) and use our custom transformers instead
const ALL_TRANSFORMERS = [
  TABLE,
  HORIZONTAL_RULE,
  IMAGE,
  LINK,
  ...NOSTR_TRANSFORMERS,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
];

interface InitialContentPluginProps {
  markdown: string;
}

export default function InitialContentPlugin({ markdown }: InitialContentPluginProps) {
  const [editor] = useLexicalComposerContext();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    editor.update(() => {
      $convertFromMarkdownString(markdown, ALL_TRANSFORMERS, undefined, false);
    });
  }, [editor, markdown]);

  return null;
}
