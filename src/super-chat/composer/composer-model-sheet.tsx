import { BottomSheet } from '@expo/ui/community/bottom-sheet';
import { useCallback, useRef, useState } from 'react';

import { useTheme } from '@/hooks/use-theme';
import type { ComposerControlVariant } from '@/super-chat/composer/composer-actions-trigger';
import { ComposerModelTrigger } from '@/super-chat/composer/composer-model-trigger';
import type { HomeModel } from '@/super-chat/composer/chat-models';
import { ModelSheetContent } from '@/super-chat/composer/model-sheet-content';
import {
  MODEL_SHEET_DEFAULT_SNAP_INDEX,
  MODEL_SHEET_SNAP_POINTS,
} from '@/super-chat/composer/model-sheet-snap';

type ComposerModelSheetProps = {
  models: readonly HomeModel[];
  selectedId: string;
  variant: ComposerControlVariant;
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
  variant,
  onSelect,
}: ComposerModelSheetProps) {
  const theme = useTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const [query, setQuery] = useState('');
  /**
   * The height the user last rested the sheet at. The sheet grows past it
   * while the search field is focused, because the keyboard hides the
   * smallest detent.
   */
  const preferredSnapIndex = useRef(MODEL_SHEET_DEFAULT_SNAP_INDEX);
  /** The last height we asked the sheet for, to tell our own snaps from a drag. */
  const requestedSnapIndex = useRef(MODEL_SHEET_DEFAULT_SNAP_INDEX);

  const selected = models.find((model) => model.id === selectedId) ?? models[0];

  const open = useCallback(() => {
    setQuery('');
    requestedSnapIndex.current = preferredSnapIndex.current;
    sheetRef.current?.snapToIndex(preferredSnapIndex.current);
  }, []);

  const handleSnapChange = useCallback((index: number) => {
    if (index < 0) return;
    if (index !== requestedSnapIndex.current) {
      // The user dragged the sheet to a new height — that becomes their height.
      preferredSnapIndex.current = index;
    }
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      sheetRef.current?.close();
      onSelect(id);
    },
    [onSelect],
  );

  return (
    <>
      <ComposerModelTrigger model={selected} variant={variant} onPress={open} />
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={[...MODEL_SHEET_SNAP_POINTS]}
        enablePanDownToClose
        // The sheet uses the app surface on every platform. The native iOS
        // sheet material is lighter than the app's dark surface, which would
        // invert the "raised" tier and make selected rows read as dark holes.
        backgroundStyle={{ backgroundColor: theme.surface }}
        onChange={handleSnapChange}
        onClose={() => setQuery('')}
        testID="composer-model-sheet">
        <ModelSheetContent
          models={models}
          selectedId={selectedId}
          query={query}
          onQueryChange={setQuery}
          onSelect={handleSelect}
        />
      </BottomSheet>
    </>
  );
}
