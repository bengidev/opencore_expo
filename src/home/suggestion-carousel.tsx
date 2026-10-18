import { ScrollView, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { HOME_SUGGESTIONS, type HomeSuggestion } from '@/home/home-content';
import { SuggestionCard } from '@/home/suggestion-card';

type SuggestionCarouselProps = {
  onSelect: (suggestion: HomeSuggestion) => void;
};

export function SuggestionCarousel({ onSelect }: SuggestionCarouselProps) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={168 + Spacing.two}
        contentContainerStyle={styles.content}
        accessibilityRole="list"
        accessibilityLabel="Suggested prompts">
        {HOME_SUGGESTIONS.map((suggestion) => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} onPress={onSelect} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: -Spacing.three,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    gap: Spacing.two,
    flexDirection: 'row',
  },
});
