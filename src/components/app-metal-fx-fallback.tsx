import { Component, type ReactElement, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  render: ReactElement;
};

type State = { failed: boolean };

/** Catches synchronous MetalFx render failures and shows the plain child. */
export class AppMetalFxFallback extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <View style={this.props.style}>{this.props.children}</View>;
    }
    return this.props.render;
  }
}
