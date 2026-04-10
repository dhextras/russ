import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lesson } from '../types/lesson';
import { colors, spacing, fontSize } from '../constants/theme';

export function CacheBadge({ lesson }: { lesson: Lesson }) {
  const { cache } = lesson;

  if (cache.fullAudioSaved) {
    return <Badge label="Full audio" color={colors.success} />;
  }
  if (cache.lineAudioCount > 0) {
    return <Badge label={`${cache.lineAudioCount} lines cached`} color={colors.warning} />;
  }
  if (cache.audioPending) {
    return <Badge label="Audio pending" color={colors.textMuted} />;
  }
  return <Badge label="Text only" color={colors.textMuted} />;
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.sm,
  },
});
