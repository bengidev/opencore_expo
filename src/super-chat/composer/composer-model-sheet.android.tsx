import {
  Column,
  DropdownMenu,
  DropdownMenuItem,
  Host,
  Icon,
  LazyColumn,
  ListItem,
  ModalBottomSheet,
  OutlinedTextField,
  RNHostView,
  Row,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  clickable,
  fillMaxWidth,
  padding,
  Shapes,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, type ImageSourcePropType } from 'react-native';

import { useMaterialTheme } from '@/hooks/use-material-theme';
import { useTheme } from '@/hooks/use-theme';
import type { ComposerControlVariant } from '@/super-chat/composer/composer-actions-trigger';
import { ComposerModelTrigger } from '@/super-chat/composer/composer-model-trigger';
import { ModelSheetStatus } from '@/super-chat/composer/model-sheet-status';
import {
  THINKING_LEVEL_LABELS,
  filterHomeModels,
  type HomeModel,
  type HomeModelAndroidIcon,
  type ModelCapabilityId,
  type ThinkingLevel,
} from '@/super-chat/composer/chat-models';
import { clampThinkingLevel } from '@/super-chat/llm/thinking';
import type { ModelCatalogStatus } from '@/super-chat/llm/use-model-catalog';

type ComposerModelSheetProps = {
  models: readonly HomeModel[];
  selectedId: string;
  /** Thinking level per model id, owned by the screen. */
  thinkingByModel: Record<string, ThinkingLevel>;
  status: ModelCatalogStatus;
  error: string | null;
  /** Explicit retry: always refetches. */
  reload: () => void;
  /** Retry on open: skipped inside the hook's guard window. */
  retryOnOpen: () => void;
  variant?: ComposerControlVariant;
  onThinkingChange: (modelId: string, level: ThinkingLevel) => void;
  onSelect: (id: string) => void;
};

const MODEL_ICONS: Record<HomeModelAndroidIcon, ImageSourcePropType> = {
  image: require('@expo/material-symbols/image.xml'),
  videocam: require('@expo/material-symbols/videocam.xml'),
  graphic_eq: require('@expo/material-symbols/graphic_eq.xml'),
  description: require('@expo/material-symbols/description.xml'),
  code: require('@expo/material-symbols/code.xml'),
  globe: require('@expo/material-symbols/globe.xml'),
  psychology: require('@expo/material-symbols/psychology.xml'),
  auto_awesome_mosaic: require('@expo/material-symbols/auto_awesome_mosaic.xml'),
  chat: require('@expo/material-symbols/chat.xml'),
};

const SEARCH_ICON: ImageSourcePropType = require('@expo/material-symbols/search.xml');

/** One Material Symbol per capability, shown inline on the model's name line. */
const CAPABILITY_ICONS: Record<ModelCapabilityId, ImageSourcePropType> = {
  text: require('@expo/material-symbols/notes.xml'),
  image: require('@expo/material-symbols/image.xml'),
  documents: require('@expo/material-symbols/description.xml'),
  code: require('@expo/material-symbols/code.xml'),
  web: require('@expo/material-symbols/public.xml'),
  reasoning: require('@expo/material-symbols/psychology.xml'),
  audio: require('@expo/material-symbols/graphic_eq.xml'),
  video: require('@expo/material-symbols/movie.xml'),
};

/**
 * The composer model picker on Android: a Material 3 `ModalBottomSheet` holding
 * Material components only — an `OutlinedTextField` for the search, `ListItem`
 * rows with the platform's own metrics, and a Compose `DropdownMenu` for the
 * thinking level. The metrics and the materials are Material's; the colours are
 * the app palette's, mapped onto the M3 roles. iOS keeps the SwiftUI sheet; only
 * the custom tier draws the hand-built sheet body.
 */
export function ComposerModelSheet({
  models,
  selectedId,
  thinkingByModel,
  status,
  error,
  reload,
  retryOnOpen,
  variant,
  onThinkingChange,
  onSelect,
}: ComposerModelSheetProps) {
  const theme = useTheme();
  const material = useMaterialTheme();
  const { width } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  /** Which model's thinking-level menu is expanded, if any. */
  const [levelMenuFor, setLevelMenuFor] = useState<string | null>(null);

  const visibleModels = useMemo(() => filterHomeModels(models, query), [models, query]);
  const selected = models.find((model) => model.id === selectedId) ?? models[0] ?? null;

  function close() {
    setIsOpen(false);
    setQuery('');
    setLevelMenuFor(null);
  }

  function handleSelect(id: string) {
    close();
    onSelect(id);
  }

  function handleThinkingChange(modelId: string, level: ThinkingLevel) {
    onThinkingChange(modelId, level);
    setLevelMenuFor(null);
    void Haptics.selectionAsync().catch(() => {});
  }

  // An empty catalogue has nothing to trigger, and the chip must never render
  // an undefined model.
  if (selected === null) return null;

  return (
    <>
      <ComposerModelTrigger
        model={selected}
        variant={variant}
        onPress={() => {
          setQuery('');
          // A fallback row is a stand-in, not a catalogue: retry on open.
          if (status === 'fallback') retryOnOpen();
          setIsOpen(true);
        }}
      />
      {isOpen ? (
        <Host
          colorScheme={material.colorScheme}
          colorOverrides={material.colorOverrides}
          style={[styles.host, { width }]}>
          <ModalBottomSheet
            onDismissRequest={close}
            showDragHandle
            skipPartiallyExpanded
            containerColor={theme.surface}
            contentColor={theme.text}>
            <Column modifiers={[fillMaxWidth(), padding(16, 4, 16, 0)]}>
              <OutlinedTextField
                onValueChange={setQuery}
                singleLine
                colors={{
                  focusedContainerColor: theme.surfaceRaised,
                  unfocusedContainerColor: theme.surfaceRaised,
                  focusedTextColor: theme.text,
                  unfocusedTextColor: theme.text,
                  cursorColor: theme.text,
                  focusedIndicatorColor: theme.border,
                  unfocusedIndicatorColor: theme.border,
                  focusedLeadingIconColor: theme.textSecondary,
                  unfocusedLeadingIconColor: theme.textSecondary,
                  focusedPlaceholderColor: theme.textDisabled,
                  unfocusedPlaceholderColor: theme.textDisabled,
                }}
                modifiers={[fillMaxWidth()]}>
                <OutlinedTextField.LeadingIcon>
                  <Icon source={SEARCH_ICON} size={20} />
                </OutlinedTextField.LeadingIcon>
                <OutlinedTextField.Placeholder>
                  <Text color={theme.textDisabled}>Search models</Text>
                </OutlinedTextField.Placeholder>
              </OutlinedTextField>
              <Text
                color={theme.textDisplay}
                modifiers={[padding(0, 16, 0, 2)]}
                style={{ fontSize: 16, fontWeight: '600' }}>
                Select a model
              </Text>
              <Text
                color={theme.textSecondary}
                modifiers={[padding(0, 0, 0, 8)]}
                style={{ fontSize: 12 }}>
                Sets the speed and depth of every reply.
              </Text>
              {status === 'ready' ? null : (
                <RNHostView matchContents={{ vertical: true }} modifiers={[fillMaxWidth()]}>
                  <ModelSheetStatus status={status} error={error} onRetry={reload} />
                </RNHostView>
              )}
              {status === 'loading' ? null : (
              <LazyColumn modifiers={[fillMaxWidth(), weight(1)]}>
                {visibleModels.map((model) => {
                  const level = clampThinkingLevel(
                    model.thinkingLevels,
                    thinkingByModel[model.id],
                  );
                  const isSelected = model.id === selectedId;

                  // The key carries the level: Compose's `LazyColumn` reuses rows whose
                  // composition input looks unchanged, which left the trailing chip
                  // showing the previous level after a change.
                  return (
                    <ListItem
                      key={`${model.id}:${level}`}
                      colors={{
                        containerColor: 'transparent',
                        contentColor: isSelected ? theme.textDisplay : theme.text,
                        supportingContentColor: theme.textSecondary,
                        leadingContentColor: theme.textDisplay,
                        trailingContentColor: theme.textSecondary,
                      }}
                      modifiers={[
                        fillMaxWidth(),
                        background(isSelected ? theme.surfaceRaised : 'transparent'),
                        clickable(() => handleSelect(model.id)),
                      ]}>
                      <ListItem.LeadingContent>
                        <Icon source={MODEL_ICONS[model.androidIcon]} size={22} />
                      </ListItem.LeadingContent>
                      <ListItem.HeadlineContent>
                        <Row
                          verticalAlignment="center"
                          horizontalArrangement={{ spacedBy: 6 }}>
                          <Text
                            color={isSelected ? theme.textDisplay : theme.text}
                            style={{ fontSize: 16, fontWeight: isSelected ? '600' : '500' }}>
                            {model.name}
                          </Text>
                          {model.capabilities.map((capability) => (
                            <Icon
                              key={capability}
                              source={CAPABILITY_ICONS[capability]}
                              size={13}
                              tint={theme.textSecondary}
                            />
                          ))}
                        </Row>
                      </ListItem.HeadlineContent>
                      <ListItem.SupportingContent>
                        <Text color={theme.textSecondary} style={{ fontSize: 13 }}>
                          {model.description}
                        </Text>
                      </ListItem.SupportingContent>
                      {level ? (
                        <ListItem.TrailingContent>
                          <DropdownMenu
                            expanded={levelMenuFor === model.id}
                            onDismissRequest={() => setLevelMenuFor(null)}
                            color={theme.surface}
                            cornerRadius={16}>
                            <DropdownMenu.Trigger>
                              <Row
                                verticalAlignment="center"
                                modifiers={[
                                  clip(Shapes.RoundedCorner(999)),
                                  // A selected row is already raised, so the chip
                                  // inverts to the sheet's surface and stays a chip.
                                  background(isSelected ? theme.surface : theme.surfaceRaised),
                                  padding(10, 4, 10, 4),
                                  clickable(() => setLevelMenuFor(model.id)),
                                ]}>
                                <Text
                                  color={theme.textSecondary}
                                  style={{ fontSize: 11, fontWeight: '600' }}>
                                  {THINKING_LEVEL_LABELS[level].toUpperCase()}
                                </Text>
                              </Row>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Items>
                              {model.thinkingLevels.map((option) => (
                                <DropdownMenuItem
                                  key={option}
                                  onClick={() => handleThinkingChange(model.id, option)}>
                                  <DropdownMenuItem.Text>
                                    <Text style={{ fontSize: 14 }}>
                                      {THINKING_LEVEL_LABELS[option]}
                                    </Text>
                                  </DropdownMenuItem.Text>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenu.Items>
                          </DropdownMenu>
                        </ListItem.TrailingContent>
                      ) : null}
                    </ListItem>
                  );
                })}
              </LazyColumn>
              )}
            </Column>
          </ModalBottomSheet>
        </Host>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  /**
   * The sheet is its own modal window, so the host only supplies a width — with
   * `matchContents` the Compose content would be measured without a height
   * constraint and the lazy list could not scroll.
   */
  host: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
});
