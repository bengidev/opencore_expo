import { BottomSheet } from '@expo/ui/community/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { hasNativeChrome } from '@/lib/ui-tier';
import type { ComposerControlVariant } from '@/super-chat/composer/composer-actions-trigger';
import { ComposerModelTrigger } from '@/super-chat/composer/composer-model-trigger';
import type { HomeModel, ThinkingLevel } from '@/super-chat/composer/chat-models';
import { ModelSheetContent } from '@/super-chat/composer/model-sheet-content';
import type { ModelCatalogStatus } from '@/super-chat/llm/use-model-catalog';
import {
  MODEL_SHEET_DEFAULT_SNAP_INDEX,
  MODEL_SHEET_SNAP_POINTS,
} from '@/super-chat/composer/model-sheet-snap';

type ComposerModelSheetProps = {
  models: readonly HomeModel[];
  selectedId: string;
  /** Thinking level per model id, owned by the screen. */
  thinkingByModel: Record<string, ThinkingLevel>;
  status: ModelCatalogStatus;
  error: string | null;
  reload: () => void;
  variant?: ComposerControlVariant;
  onThinkingChange: (modelId: string, level: ThinkingLevel) => void;
  onSelect: (id: string) => void;
};

/**
 * The composer model picker: a chip that opens a native bottom sheet holding
 * the model list. The sheet is a real SwiftUI sheet on iOS and a Material
 * bottom sheet on Android, and it rests on the snap points the user picked.
 */
export function ComposerModelSheet({
  models,
  selectedId,
  thinkingByModel,
  status,
  error,
  reload,
  variant,
  onThinkingChange,
  onSelect,
}: ComposerModelSheetProps) {
  const theme = useTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const [query, setQuery] = useState('');
  /** Bumped on open and close so any overlay inside the sheet lets go. */
  const [resetKey, setResetKey] = useState(0);
  /**
   * The height the user last rested the sheet at. The sheet grows past it
   * while the search field is focused, because the keyboard hides the
   * smallest detent.
   */
  const preferredSnapIndex = useRef(MODEL_SHEET_DEFAULT_SNAP_INDEX);
  /** The last height we asked the sheet for, to tell our own snaps from a drag. */
  const requestedSnapIndex = useRef(MODEL_SHEET_DEFAULT_SNAP_INDEX);

  const selected = models.find((model) => model.id === selectedId) ?? models[0] ?? null;

  const open = useCallback(() => {
    setQuery('');
    setResetKey((key) => key + 1);
    // A fallback row is a stand-in, not a catalogue: retry as the sheet opens.
    if (status === 'fallback') reload();
    requestedSnapIndex.current = preferredSnapIndex.current;
    sheetRef.current?.snapToIndex(preferredSnapIndex.current);
  }, [reload, status]);

  const handleSnapChange = useCallback((index: number) => {
    if (index < 0) return;
    if (index !== requestedSnapIndex.current) {
      // The user dragged the sheet to a new height — that becomes their height.
      preferredSnapIndex.current = index;
    }
  }, []);

  const handleThinkingChange = useCallback(
    (modelId: string, level: ThinkingLevel) => {
      onThinkingChange(modelId, level);
      void Haptics.selectionAsync().catch(() => {});
    },
    [onThinkingChange],
  );

  const handleSelect = useCallback(
    (id: string) => {
      sheetRef.current?.close();
      onSelect(id);
    },
    [onSelect],
  );

  // An empty catalogue has nothing to trigger, and the chip must never render
  // an undefined model.
  if (selected === null) return null;

  return (
    <>
      <ComposerModelTrigger model={selected} variant={variant} onPress={open} />
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={[...MODEL_SHEET_SNAP_POINTS]}
        enablePanDownToClose
        // The native tiers keep the sheet's own material: the iOS 26 sheet is
        // translucent glass and the Material sheet is a tonal container. Only
        // the custom tier paints the app surface, because it has no material
        // of its own.
        backgroundStyle={hasNativeChrome ? undefined : { backgroundColor: theme.surface }}
        onChange={handleSnapChange}
        onClose={() => {
          setQuery('');
          setResetKey((key) => key + 1);
        }}
        testID="composer-model-sheet">
        <ModelSheetContent
          models={models}
          selectedId={selectedId}
          query={query}
          resetKey={resetKey}
          thinkingByModel={thinkingByModel}
          status={status}
          error={error}
          onRetry={reload}
          onQueryChange={setQuery}
          onThinkingChange={handleThinkingChange}
          onSelect={handleSelect}
        />
      </BottomSheet>
    </>
  );
}
