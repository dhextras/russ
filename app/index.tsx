import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useLessons } from '../src/hooks/useLessons';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { useModal } from '../src/hooks/useModal';
import { AppModal } from '../src/components/AppModal';
import { CacheBadge } from '../src/components/CacheBadge';
import { colors, spacing, fontSize } from '../src/constants/theme';
import { Lesson } from '../src/types/lesson';

export default function LessonsListScreen() {
  const { lessons, loading, load, removeLesson } = useLessons();
  const network = useNetworkStatus();
  const { modalConfig, hide, confirm } = useModal();

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(
    (lesson: Lesson) => {
      confirm(
        'Delete lesson',
        `Delete "${lesson.title}"? This cannot be undone.`,
        'Delete',
        () => removeLesson(lesson.id),
        true
      );
    },
    [confirm, removeLesson]
  );

  const renderLesson = ({ item }: { item: Lesson }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/lesson/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.cardMeta}>{item.lines.length} lines</Text>
        <CacheBadge lesson={item} />
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppModal config={modalConfig} onDismiss={hide} />

      <View style={styles.topBar}>
        <View
          style={[
            styles.netBadge,
            { backgroundColor: network.isInternetReachable ? colors.success : colors.error },
          ]}
        >
          <Text style={styles.netText}>
            {network.isLoading ? '…' : network.isInternetReachable ? 'Online' : 'Offline'}
          </Text>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push('/importexport')}>
            <Text style={styles.topBtnText}>Import / Export All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push('/settings')}>
            <Text style={styles.topBtnText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : lessons.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No lessons yet</Text>
          <Text style={styles.emptyDesc}>Tap the button below to import your first lesson.</Text>
        </View>
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          renderItem={renderLesson}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/import')}>
        <Text style={styles.fabText}>+ Import Lesson</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  netBadge: { borderRadius: 4, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  netText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '600' },
  topActions: { flexDirection: 'row', gap: spacing.sm },
  topBtn: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topBtnText: { color: colors.accent, fontSize: fontSize.sm },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.md, paddingBottom: 90, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBody: { flex: 1, gap: spacing.xs },
  cardTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  cardDesc: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 21 },
  cardMeta: { color: colors.textMuted, fontSize: fontSize.sm },
  deleteBtn: { padding: spacing.sm, marginLeft: spacing.sm },
  deleteBtnText: { color: colors.textMuted, fontSize: fontSize.lg },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '600' },
  emptyDesc: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    backgroundColor: colors.accent,
    borderRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  fabText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
});
