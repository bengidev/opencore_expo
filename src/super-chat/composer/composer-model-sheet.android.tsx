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
import {
  THINKING_LEVEL_LABELS,
  defaultThinkingLevel,
  filterHomeModels,
  type HomeModel,
  type HomeModelAndroidIcon,
  type ModelCapabilityId,
  type ThinkingLevel,
} from '@/super-chat/composer/chat-models';

type ComposerModelSheetProps = {
  models: readonly HomeModel[];
  selectedId: string;
  variant?: ComposerControlVariant;
  onSelect: (id: string) => void;
};

const MODEL_ICONS: Record<HomeModelAndroidIcon, ImageSourcePropType> = {
  auto_awesome_mosaic: require('@expo/material-symbols/auto_awesome_mosaic.xml'),
  bolt: require('@expo/material-symbols/bolt.xml'),
  psychology: require('@expo/material-symbols/psychology.xml'),
  image_search: require('@expo/material-symbols/image_search.xml'),
  code: require('@expo/material-symbols/code.xml'),
  globe: require('@expo/material-symbols/globe.xml'),
  edit_note: require('@expo/material-symbols/edit_note.xml'),
  analytics: require('@expo/material-symbols/analytics.xml'),
  shield: require('@expo/material-symbols/shield.xml'),
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
  variant,
  onSelect,
}: ComposerModelSheetProps) {
  const theme = useTheme();
  const material = useMaterialTheme();
  const { width } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  /** Which model's thinking-level menu is expanded, if any. */
  const [levelMenuFor, setLevelMenuFor] = useState<string | null>(null);
  const [thinkingByModel, setThinkingByModel] = useState<Record<string, ThinkingLevel>>({});

  const visibleModels = useMemo(() => filterHomeModels(models, query), [models, query]);
  const selected = models.find((model) => model.id === selectedId) ?? models[0];

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
    setThinkingByModel((current) =>
      current[modelId] === level ? current : { ...current, [modelId]: level },
    );
    setLevelMenuFor(null);
    void Haptics.selectionAsync().catch(() => {});
  }

  return (
    <>
      <ComposerModelTrigger
        model={selected}
        variant={variant}
        onPress={() => {
          setQuery('');
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
              <LazyColumn modifiers={[fillMaxWidth(), weight(1)]}>
                {visibleModels.map((model) => {
                  const level = thinkingByModel[model.id] ?? defaultThinkingLevel(model);
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
