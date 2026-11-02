import type { ReactNode } from 'react';

export type SharkOceanStageProps = {
  speechLines: readonly string[];
  showSpeech?: boolean;
  /** Runs for a tap on open water, alongside the splash. */
  onBackdropPress?: () => void;
  children: ReactNode;
};
