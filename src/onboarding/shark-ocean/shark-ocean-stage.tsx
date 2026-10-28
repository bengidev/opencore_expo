import { SharkOceanStageLive } from './shark-ocean-stage-live';
import type { SharkOceanStageProps } from './stage-types';

export { SharkGlass } from './glass-zone';

export function SharkOceanStage(props: SharkOceanStageProps) {
  return <SharkOceanStageLive {...props} />;
}
