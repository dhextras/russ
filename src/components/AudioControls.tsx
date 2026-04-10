import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, fontSize } from '../constants/theme';

interface Props {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  hasAudio: boolean;
  errorMsg: string | null;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function AudioControls({
  isPlaying,
  isPaused,
  isLoading,
  hasAudio,
  errorMsg,
  onPlay,
  onPause,
  onResume,
  onStop,
}: Props) {
  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.row}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={styles.loadingText}>Loading audio…</Text>
        </View>
      ) : (
        <View style={styles.row}>
          {!isPlaying && !isPaused && (
            <Btn label="Play" onPress={onPlay} disabled={!hasAudio} />
          )}
          {isPlaying && (
            <Btn label="Pause" onPress={onPause} disabled={false} />
          )}
          {isPaused && (
            <Btn label="Resume" onPress={onResume} disabled={false} />
          )}
          {(isPlaying || isPaused) && (
            <Btn label="Stop" onPress={onStop} disabled={false} danger />
          )}
          {!hasAudio && !isPlaying && !isPaused && (
            <Text style={styles.unavailable}>No audio available offline</Text>
          )}
        </View>
      )}
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
    </View>
  );
}

function Btn({
  label,
  onPress,
  disabled,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: danger ? colors.error : colors.accent },
        disabled && styles.btnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    color: '#ffffff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
  unavailable: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
});
