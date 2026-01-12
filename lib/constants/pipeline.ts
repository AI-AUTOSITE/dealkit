// lib/constants/pipeline.ts
import { DealStage } from '@/types';
import { colors } from '@/design-tokens/primitives/colors';

export interface PipelineStage {
  id: DealStage;
  name: string;
  color: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'pitched', name: 'Pitched', color: colors.primary500 },
  { id: 'negotiating', name: 'Negotiating', color: colors.warning500 },
  { id: 'contracted', name: 'Contracted', color: colors.info500 },
  { id: 'in_progress', name: 'In Progress', color: colors.primary400 },  // ← 修正
  { id: 'delivered', name: 'Delivered', color: colors.success400 },
  { id: 'invoiced', name: 'Invoiced', color: colors.warning400 },
  { id: 'paid', name: 'Paid', color: colors.success500 },
];

export function getStageByID(id: DealStage): PipelineStage | undefined {
  return PIPELINE_STAGES.find(stage => stage.id === id);
}