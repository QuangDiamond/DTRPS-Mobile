import React, { useState } from 'react';
import { View } from 'react-native';
import { ownerScreens } from './screenRegistry';
import type { OwnerRoute } from './types';

type Props = {
  initialRoute?: OwnerRoute;
  onExit?: () => void;
};

export default function BusinessOwnerNavigator({
  initialRoute = 'Become Business Owner',
  onExit,
}: Props) {
  const [history, setHistory] = useState<OwnerRoute[]>([initialRoute]);
  const route = history[history.length - 1] ?? initialRoute;
  const Screen = ownerScreens[route];

  const navigate = (next: OwnerRoute) => {
    setHistory(previous => [...previous, next]);
  };

  const goBack = () => {
    if (history.length > 1) {
      setHistory(previous => previous.slice(0, -1));
    } else {
      onExit?.();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen navigate={navigate} goBack={goBack} />
    </View>
  );
}
