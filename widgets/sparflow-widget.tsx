import { HStack, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  padding,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type SparFlowWidgetProps = {
  totalSaved: number;
  goalTitle: string;
  goalSaved: number;
  goalTarget: number;
  progress: number;
  streak: number;
  level: number;
};

function SparFlowWidgetView(props: SparFlowWidgetProps, environment: WidgetEnvironment) {
  'widget';

  const formatEuro = (value: number) => {
    const rounded = Math.round(Math.max(0, value));
    const text = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${text} €`;
  };

  const progress = Math.max(0, Math.min(1, props.progress || 0));
  const percent = Math.round(progress * 100);
  const remaining = Math.max(0, props.goalTarget - props.goalSaved);

  if (environment.widgetFamily === 'systemSmall') {
    return (
      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[padding({ all: 14 }), containerBackground('#173E2B', 'widget')]}>
        <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle('#BFD7C8')]}>SPARFLOW</Text>
        <Text modifiers={[font({ size: 28, weight: 'bold' }), foregroundStyle('#FFFFFF')]}>
          {formatEuro(props.totalSaved)}
        </Text>
        <Spacer />
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle('#FFFFFF')]}>
          {props.goalTitle || 'Sparziel'}
        </Text>
        <ProgressView value={progress} modifiers={[tint('#7BE0A7')]} />
        <HStack spacing={6}>
          <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle('#D7E7DC')]}>{percent} %</Text>
          <Spacer />
          <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle('#D7E7DC')]}>🔥 {props.streak}</Text>
        </HStack>
      </VStack>
    );
  }

  return (
    <VStack
      alignment="leading"
      spacing={10}
      modifiers={[padding({ all: 16 }), containerBackground('#173E2B', 'widget')]}>
      <HStack>
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle('#BFD7C8')]}>INSGESAMT GESPART</Text>
          <Text modifiers={[font({ size: 30, weight: 'bold' }), foregroundStyle('#FFFFFF')]}>
            {formatEuro(props.totalSaved)}
          </Text>
        </VStack>
        <Spacer />
        <VStack alignment="trailing" spacing={2}>
          <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle('#BFD7C8')]}>LEVEL {props.level}</Text>
          <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle('#FFFFFF')]}>🔥 {props.streak} Tage</Text>
        </VStack>
      </HStack>

      <Spacer />

      <HStack>
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle('#FFFFFF')]}>
            {props.goalTitle || 'Sparziel'}
          </Text>
          <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle('#D7E7DC')]}>
            Noch {formatEuro(remaining)}
          </Text>
        </VStack>
        <Spacer />
        <Text modifiers={[font({ size: 18, weight: 'bold' }), foregroundStyle('#7BE0A7')]}>{percent} %</Text>
      </HStack>
      <ProgressView value={progress} modifiers={[tint('#7BE0A7')]} />
      <HStack>
        <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle('#D7E7DC')]}>
          {formatEuro(props.goalSaved)}
        </Text>
        <Spacer />
        <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle('#D7E7DC')]}>
          {formatEuro(props.goalTarget)}
        </Text>
      </HStack>
    </VStack>
  );
}

const SparFlowWidget = createWidget<SparFlowWidgetProps>('SparFlowSavings', SparFlowWidgetView);

export default SparFlowWidget;
