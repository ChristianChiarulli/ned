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

// IMAGE must come before LINK transformer to properly match ![alt](url) before [alt](url)
// We exclude TEXT_MATCH_TRANSFORMERS (which contains the default LINK) and use our custom LINK instead
const ALL_TRANSFORMERS = [
  IMAGE,
  LINK,
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
      $convertFromMarkdownString(markdown, ALL_TRANSFORMERS);
    });
  }, [editor, markdown]);

  return null;
}
