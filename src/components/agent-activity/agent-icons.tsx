import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type GlyphProps = {
  size?: number;
  color: string;
  strokeWidth?: number;
};

/**
 * Every glyph shares one 24 pt grid and one stroke treatment, so a row that
 * mixes tool, search, and file icons still reads as a single set at 14 pt.
 */
function Glyph({
  size = 14,
  color,
  strokeWidth = 1.6,
  children,
}: GlyphProps & { children: ReactNode }) {
  return (
    <Svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {children}
    </Svg>
  );
}

export function ChevronDownGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M6 9l6 6 6-6" />
    </Glyph>
  );
}

export function CheckGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M5 12.5l4.5 4.5L19 7" />
    </Glyph>
  );
}

export function SearchGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={11} cy={11} r={6.5} />
      <Path d="M16 16l4 4" />
    </Glyph>
  );
}

export function GlobeGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M3.5 12h17" />
      <Path d="M12 3.5c2.5 2.4 3.8 5.3 3.8 8.5s-1.3 6.1-3.8 8.5c-2.5-2.4-3.8-5.3-3.8-8.5S9.5 5.9 12 3.5z" />
    </Glyph>
  );
}

export function FileGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <Path d="M14 3v5h5" />
    </Glyph>
  );
}

export function PencilGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z" />
      <Path d="M13.5 6.5l3 3" />
    </Glyph>
  );
}

export function TerminalGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M5 7l5 5-5 5" />
      <Path d="M12.5 17H19" />
    </Glyph>
  );
}

export function WrenchGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M14.5 6.5a4 4 0 0 0 5 5L9 22l-3-3z" />
      <Path d="M14.5 6.5L19 2" />
    </Glyph>
  );
}

export function SparkleGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    </Glyph>
  );
}

export function MessageGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Path d="M4 5h16v11H9l-5 4z" />
    </Glyph>
  );
}

export function ImageGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <Rect x={3} y={4} width={18} height={16} rx={2} />
      <Circle cx={8.5} cy={9.5} r={1.5} />
      <Path d="M21 16l-5-5-8 8" />
    </Glyph>
  );
}
