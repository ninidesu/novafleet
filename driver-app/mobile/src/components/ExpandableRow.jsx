import React, { useState } from 'react';
import { Pressable, View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';
import { Card } from './ui';

/**
 * Collapsible "view details" row — keeps secondary information out of the
 * default screen while still preserving it (per the wireframe spec's
 * "expandable row / view details" pattern), instead of deleting it outright.
 *
 * variant: 'row'  — label + caret inside a card, body appears below on open
 *          'card' — the whole summary is a tappable card, body appends below
 *          'link' — a small "View details" link, body appears below on open
 */
export default function ExpandableRow({ variant = 'row', label, summary, body, last }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  if (variant === 'card') {
    return (
      <Pressable onPress={() => setOpen((v) => !v)}>
        <Card padding="sm" style={{ rowGap: 8 }}>
          {summary}
          {open ? (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 9 }}>{body}</View>
          ) : null}
        </Card>
      </Pressable>
    );
  }

  if (variant === 'link') {
    return (
      <View>
        <Pressable onPress={() => setOpen((v) => !v)}>
          <Text style={{ color: colors.accent, fontFamily: fontFamily.bodyBold, fontSize: 12 }}>
            {open ? 'Hide details' : 'View details'}
          </Text>
        </Pressable>
        {open ? <View style={{ marginTop: 10 }}>{body}</View> : null}
      </View>
    );
  }

  return (
    <View
      style={{
        paddingVertical: 9,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.lineSoft,
      }}
    >
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text style={{ color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 12.5 }}>{label}</Text>
        <Text style={{ color: colors.accent, fontFamily: fontFamily.bodyBold, fontSize: 11 }}>
          {open ? 'Hide' : 'View'}
        </Text>
      </Pressable>
      {open ? <View style={{ marginTop: 8 }}>{body}</View> : null}
    </View>
  );
}
