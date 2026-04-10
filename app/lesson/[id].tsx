import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Lesson } from '../../src/types/lesson';
import { getLessonById } from '../../src/services/storage';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useAudioPlayback } from '../../src/hooks/useAudioPlayback';
import { AudioControls } from '../../src/components/AudioControls';
import { LineItem } from '../../src/components/LineItem';
import { CacheBadge } from '../../src/components/CacheBadge';
import { colors, spacing, fontSize } from '../../src/constants/theme';

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const network = useNetworkStatus();

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }
    getLessonById(id).then((l) => {
      setLesson(l);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Lesson not found.</Text>
      </View>
    );
  }

  return <LessonContent lesson={lesson} isOnline={network.isInternetReachable} />;
}

// Separate component so hooks always run with a valid lesson
function LessonContent({ lesson, isOnline }: { lesson: Lesson; isOnline: boolean }) {
  const flatListRef = useRef<FlatList>(null);
  const audio = useAudioPlayback(lesson, isOnline);

  const hasAudio =
    lesson.cache.fullAudioSaved || lesson.cache.lineAudioCount > 0 || isOnline;

  // Scroll to the currently playing line
  useEffect(() => {
    if (audio.currentLineIdx === null) return;
    try {
      flatListRef.current?.scrollToIndex({
        index: audio.currentLineIdx,
        animated: true,
        viewPosition: 0.3,
      });
    } catch {
      // Line not rendered yet — ignore
    }
  }, [audio.currentLineIdx]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerMeta}>
          <Text style={styles.title}>{lesson.title}</Text>
          <Text style={styles.desc}>{lesson.description}</Text>
          <CacheBadge lesson={lesson} />
        </View>
        <View
          style={[
            styles.netBadge,
            { backgroundColor: isOnline ? colors.success : colors.error },
          ]}
        >
          <Text style={styles.netText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <AudioControls
        isPlaying={audio.isPlaying}
        isPaused={audio.isPaused}
        isLoading={audio.isLoading}
        isDownloading={audio.isDownloading}
        hasAudio={hasAudio}
        isOnline={isOnline}
        errorMsg={audio.errorMsg}
        downloadProgress={audio.downloadProgress}
        onPlay={audio.playFull}
        onPause={audio.pause}
        onResume={audio.resume}
        onStop={audio.stop}
        onDownload={audio.downloadAll}
      />

      <FlatList
        ref={flatListRef}
        data={lesson.lines}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <LineItem
            line={item}
            index={index}
            isActive={audio.currentLineIdx === index}
            isAudioAvailable={hasAudio}
            onPlayLine={audio.playSingleLine}
            onPlayFromLine={audio.playFromLine}
          />
        )}
        onScrollToIndexFailed={() => {}}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerMeta: {
    flex: 1,
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  desc: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  netBadge: {
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  netText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
});
