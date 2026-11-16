import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/components/app-icon';
import { NativeSurface } from '@/components/native-surface';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useFontFamily } from '@/hooks/use-font-family';
import { useTheme } from '@/hooks/use-theme';
import { deleteConversation, listConversations } from '@/chats/history/chat-db';
import {
  formatConversationTime,
  groupConversationsByDay,
  type ConversationSummary,
} from '@/chats/history/chat-history';

const PRESS_EASE = cubicBezier(0.23, 1, 0.32, 1);

/**
 * Every saved conversation, newest activity first, grouped by day. The thread
 * opens inside this tab, so the tab bar stays put while a chat is read.
 */
export function ChatsScreen() {
  const theme = useTheme();
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [now, setNow] = useState(0);

  const refresh = useCallback(async () => {
    const rows = await listConversations();
    setSummaries(rows);
    setNow(Date.now());
  }, []);

  // The module's serial queue guarantees a save queued by the closing chat
  // screen lands before this read.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void listConversations().then((rows) => {
        if (!alive) return;
        setSummaries(rows);
        setNow(Date.now());
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const confirmDelete = useCallback(
    (item: ConversationSummary) => {
      Alert.alert('Delete conversation?', 'This removes the thread from this device.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteConversation(item.id).then(refresh);
          },
        },
      ]);
    },
    [refresh],
  );

  const groups = groupConversationsByDay(summaries, now);

  return (
    <TabScreen eyebrow="OpenCore" title="Chats" action={<NewChatButton />}>
      {summaries.length === 0 ? (
        <NativeSurface tone="glass" radius={Radius.card} style={styles.card}>
          <View style={styles.cardHeader}>
            <AppIcon
              ios="bubble.left.and.bubble.right"
              android="forum"
              size={13}
              color={theme.textSecondary}
            />
            <ThemedText variant="caption" themeColor="textSecondary">
              On this device
            </ThemedText>
          </View>
          <ThemedText variant="subheading" themeColor="text">
            No conversations yet
          </ThemedText>
          <ThemedText variant="bodySm" themeColor="textSecondary">
            Start a chat and it will be listed here.
            {Platform.OS === 'web' ? ' History is kept on device builds.' : ''}
          </ThemedText>
        </NativeSurface>
      ) : (
        // shortcut: plain rows in TabScreen's ScrollView; move to a FlatList if
        // history ever outgrows a few hundred threads.
        <View style={styles.list}>
          {groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <ThemedText variant="label" themeColor="textSecondary" style={styles.groupLabel}>
                {group.label}
              </ThemedText>
              {group.items.map((item) => (
                <ConversationRow
                  key={item.id}
                  item={item}
                  now={now}
                  onOpen={() => router.push({ pathname: '/chats/[id]', params: { id: item.id } })}
                  onDelete={() => confirmDelete(item)}
                />
              ))}
            </View>
          ))}
        </View>
      )}
    </TabScreen>
  );
}

function ConversationRow({
  item,
  now,
  onOpen,
  onDelete,
}: {
  item: ConversationSummary;
  now: number;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const mono = useFontFamily('mono');
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint="Opens the conversation"
      testID={`chat-row-${item.id}`}
      onPress={onOpen}
      onLongPress={onDelete}
      onPressIn={() => {
        setPressed(true);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }}
      onPressOut={() => setPressed(false)}
      style={styles.rowAnchor}>
      <Animated.View
        style={[
          styles.row,
          { borderBottomColor: theme.borderVisible },
          reducedMotion
            ? {
                transitionProperty: 'opacity',
                transitionDuration: 140,
                transitionTimingFunction: PRESS_EASE,
                opacity: pressed ? 0.65 : 1,
              }
            : {
                transitionProperty: 'transform',
                transitionDuration: 140,
                transitionTimingFunction: PRESS_EASE,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
        ]}>
        <View style={styles.rowText}>
          <ThemedText variant="body" themeColor="text" numberOfLines={1}>
            {item.title}
          </ThemedText>
          {item.preview === '' ? null : (
            <ThemedText variant="bodySm" themeColor="textSecondary" numberOfLines={1}>
              {item.preview}
            </ThemedText>
          )}
        </View>
        <ThemedText
          variant="caption"
          themeColor="textSecondary"
          style={[styles.rowTime, mono ? { fontFamily: mono } : null]}>
          {formatConversationTime(item.updatedAt, now)}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

function NewChatButton() {
  const theme = useTheme();
  const mono = useFontFamily('mono');
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const labelStyle = [Typography.controlLabel, mono ? { fontFamily: mono } : null];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Start a new chat"
      testID="new-chat"
      onPress={() => router.push('/chats/new')}
      onPressIn={() => {
        setPressed(true);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={{ top: 12, left: 12, right: 12, bottom: 12 }}
      style={styles.buttonAnchor}>
      <Animated.View
        style={[
          styles.button,
          { backgroundColor: theme.textDisplay },
          reducedMotion
            ? {
                transitionProperty: 'opacity',
                transitionDuration: 140,
                transitionTimingFunction: PRESS_EASE,
                opacity: pressed ? 0.65 : 1,
              }
            : {
                transitionProperty: 'transform',
                transitionDuration: 140,
                transitionTimingFunction: PRESS_EASE,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
        ]}>
        <Text style={[labelStyle, { color: theme.background }]}>+ NEW</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  list: {
    gap: Spacing.five,
  },
  group: {
    gap: 0,
  },
  groupLabel: {
    paddingBottom: Spacing.two,
  },
  rowAnchor: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  rowTime: {
    alignSelf: 'flex-start',
  },
  buttonAnchor: {
    alignSelf: 'flex-end',
  },
  button: {
    minHeight: 44,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
