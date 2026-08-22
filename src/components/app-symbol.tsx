import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';

type MaterialName = ComponentProps<typeof MaterialIcons>['name'];

export type AppSymbolName = {
  ios: string;
  android?: string;
  web?: string;
};

type Props = Omit<SymbolViewProps, 'name' | 'fallback'> & {
  name: AppSymbolName;
};

function toMaterialName(name?: string): MaterialName {
  return (name ?? 'help-outline').replaceAll('_', '-') as MaterialName;
}

/**
 * SDK 54 SymbolView only accepts an SF Symbol string plus `fallback`.
 * This wrapper keeps the `{ ios, android, web }` shape used across screens.
 */
export function AppSymbol({ name, size = 24, tintColor, ...rest }: Props) {
  const fallback = (
    <MaterialIcons
      name={toMaterialName(name.android ?? name.web)}
      size={size}
      color={tintColor}
    />
  );

  return (
    <SymbolView
      name={name.ios as SFSymbol}
      size={size}
      tintColor={tintColor}
      fallback={fallback}
      {...rest}
    />
  );
}
