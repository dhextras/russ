import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, fontSize } from '../constants/theme';
import { DownloadProgress } from '../hooks/useAudioPlayback';

interface Props {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isDownloading: boolean;
  hasAudio: boolean;
  isOnline: boolean;
  errorMsg: string | null;
  downloadProgress: DownloadProgress | null;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDownload: () => void;
}

export function AudioControls({
  isPlaying,
  isPaused,
  isLoading,
  isDownloading,
  hasAudio,
  isOnline,
  errorMsg,
  downloadProgress,
  onPlay,
  onPause,
  onResume,
  onStop,
  onDownload,
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

          {/* Download button — show when online and not actively playing */}
          {isOnline && !isPlaying && !isPaused && (
            isDownloading ? (
              <View style={styles.downloadRow}>
                <ActivityIndicator color={colors.accent} size="small" />
                <Text style={styles.downloadText}>
                  {downloadProgress
                    ? `Downloading ${downloadProgress.done}/${downloadProgress.total}…`
                    : 'Downloading…'}
                </Text>
              </View>
            ) : (
              <Btn label="⬇ Download" onPress={onDownload} disabled={false} secondary />
            )
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
  secondary,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  danger?: boolean;
  secondary?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        secondary && styles.btnSecondary,
        !secondary && { backgroundColor: danger ? colors.error : colors.accent },
        disabled && styles.btnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.btnText, secondary && styles.btnTextSecondary]}>{label}</Text>
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
  btnSecondary: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    color: '#ffffff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  btnTextSecondary: {
    color: colors.accent,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: spacing.xs,
  },
  downloadText: {
    color: colors.accent,
    fontSize: fontSize.sm,
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
