import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LessonLine } from '../types/lesson';
import { colors, spacing, fontSize } from '../constants/theme';

interface Props {
  line: LessonLine;
  index: number;
  isActive: boolean;
  isAudioAvailable: boolean;
  onPlayLine: (index: number) => void;
  onPlayFromLine: (index: number) => void;
}

export function LineItem({ line, index, isActive, isAudioAvailable, onPlayLine, onPlayFromLine }: Props) {
  return (
    <View style={[styles.container, isActive && styles.active]}>
      <View style={styles.number}>
        <Text style={styles.numberText}>{index + 1}</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.ru}>{line.ru}</Text>
        <Text style={styles.en}>{line.en}</Text>
      </View>
      {isAudioAvailable && (
        <View style={styles.btns}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => onPlayLine(index)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={styles.btnText}>▶</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => onPlayFromLine(index)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={styles.btnText}>↓▶</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'flex-start',
  },
  active: {
    backgroundColor: colors.accentDim,
  },
  number: {
    width: 28,
    paddingTop: 3,
  },
  numberText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  ru: {
    color: colors.ruText,
    fontSize: fontSize.ru,
    lineHeight: 30,
    fontWeight: '500',
  },
  en: {
    color: colors.enText,
    fontSize: fontSize.en,
    lineHeight: 22,
  },
  btns: {
    flexDirection: 'column',
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  btn: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    minWidth: 34,
  },
  btnText: {
    color: colors.accent,
    fontSize: fontSize.sm,
  },
});
