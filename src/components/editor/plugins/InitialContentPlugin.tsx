'use client';

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { IMAGE } from '../transformers/ImageTransformer';

// IMAGE must come before LINK transformer to properly match ![alt](url) before [alt](url)
const ALL_TRANSFORMERS = [IMAGE, ...TRANSFORMERS];

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
