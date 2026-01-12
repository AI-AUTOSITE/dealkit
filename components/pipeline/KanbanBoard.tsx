// components/pipeline/KanbanBoard.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { StageColumn } from './StageColumn';
import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { Deal } from '@/types';
import { PIPELINE_STAGES, PipelineStage } from '@/constants/stages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = SCREEN_WIDTH - 32;

interface KanbanBoardProps {
  deals: Deal[];
  onDealPress: (deal: Deal) => void;
}

export function KanbanBoard({ deals, onDealPress }: KanbanBoardProps) {
  const { isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // Group deals by stage
  const dealsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = deals.filter((deal) => deal.stage === stage.id);
    return acc;
  }, {} as Record<string, Deal[]>);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / COLUMN_WIDTH);
    setCurrentStageIndex(Math.min(Math.max(index, 0), PIPELINE_STAGES.length - 1));
  };

  return (
    <View style={styles.container}>
      {/* Stage Indicator Dots */}
      <View style={styles.stageIndicator}>
        {PIPELINE_STAGES.map((stage, index) => (
          <View
            key={stage.id}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentStageIndex
                    ? stage.color
                    : isDark
                    ? colors.neutral700
                    : colors.neutral300,
              },
            ]}
          />
        ))}
      </View>

      {/* Horizontal Scroll */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={COLUMN_WIDTH}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {PIPELINE_STAGES.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            deals={dealsByStage[stage.id] || []}
            onDealPress={onDealPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
});