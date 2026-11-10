import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const BANDS = 8;

type FadeEdgeProps = {
  edge: 'top' | 'bottom';
  height?: number;
  /** Surface colour the log sits on; the fade resolves from transparent to this. */
  color: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A stepped fade instead of a gradient: the bands are plain views, so the edge
 * costs nothing beyond layout and follows whatever surface colour the caller
 * passes rather than introducing a second colour token.
 *
 * The strip is opaque at the viewport edge and transparent toward the content,
 * so it covers the hard scroll cut and rows dissolve as they reach the edge.
 */
export function FadeEdge({ edge, height = 12, color, style }: FadeEdgeProps) {
  return (
    <View
      pointerEvents="none"
      style={[styles.root, edge === 'top' ? styles.top : styles.bottom, { height }, style]}>
      {Array.from({ length: BANDS }, (_, index) => {
        const share = (index + 1) / BANDS;
        const opacity = edge === 'top' ? 1 - share ** 2 : share ** 2;
        return <View key={index} style={[styles.band, { backgroundColor: color, opacity }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
  band: {
    flex: 1,
  },
});
