import type { ReactNode } from 'react';

export type SharkOceanStageProps = {
  speechLines: readonly string[];
  showSpeech?: boolean;
  children: ReactNode;
};
