// constants/stages.ts
import { DealStage } from '@/types';
import { colors } from '@/design-tokens/primitives/colors';

export interface PipelineStage {
  id: DealStage;
  name: string;
  order: number;
  color: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'pitched', name: 'Pitched', order: 0, color: colors.stagePitched },
  { id: 'negotiating', name: 'Negotiating', order: 1, color: colors.stageNegotiating },
  { id: 'contracted', name: 'Contracted', order: 2, color: colors.stageContracted },
  { id: 'in_progress', name: 'In Progress', order: 3, color: colors.stageInProgress },
  { id: 'delivered', name: 'Delivered', order: 4, color: colors.stageDelivered },
  { id: 'invoiced', name: 'Invoiced', order: 5, color: colors.stageInvoiced },
  { id: 'paid', name: 'Paid', order: 6, color: colors.stagePaid },
] as const;

export const getStageByOrder = (order: number): PipelineStage | undefined => {
  return PIPELINE_STAGES.find(s => s.order === order);
};

export const getNextStage = (currentStage: DealStage): DealStage | null => {
  const current = PIPELINE_STAGES.find(s => s.id === currentStage);
  if (!current || current.order >= 6) return null;
  const next = getStageByOrder(current.order + 1);
  return next?.id ?? null;
};

export const getPreviousStage = (currentStage: DealStage): DealStage | null => {
  const current = PIPELINE_STAGES.find(s => s.id === currentStage);
  if (!current || current.order <= 0) return null;
  const prev = getStageByOrder(current.order - 1);
  return prev?.id ?? null;
};