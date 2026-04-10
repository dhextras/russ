import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { exportAllLessons, importAllLessonsFromFile } from '../src/services/importExport';
import { useModal } from '../src/hooks/useModal';
import { AppModal } from '../src/components/AppModal';
import { colors, spacing, fontSize } from '../src/constants/theme';

export default function ImportExportScreen() {
  const [working, setWorking] = useState(false);
  const { modalConfig, hide, alert } = useModal();

  async function handleExport() {
    setWorking(true);
    try {
      await exportAllLessons();
    } catch (e) {
      alert('Export failed', String(e));
    } finally {
      setWorking(false);
    }
  }

  async function handleImport() {
    setWorking(true);
    try {
      const result = await importAllLessonsFromFile();
      if (!result) return;
      const detail = result.errors.length > 0
        ? `\n\nIssues:\n${result.errors.join('\n')}`
        : '';
      alert(
        result.imported > 0 ? 'Import complete' : 'Nothing imported',
        `Imported ${result.imported} lesson${result.imported !== 1 ? 's' : ''}. Skipped ${result.skipped}.${detail}`
      );
    } catch (e) {
      alert('Import failed', String(e));
    } finally {
      setWorking(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppModal config={modalConfig} onDismiss={hide} />

      <Text style={styles.sectionTitle}>Export</Text>
      <Text style={styles.sectionDesc}>
        Save all lessons as a JSON file. Audio is excluded — only lesson text is exported.
      </Text>
      <TouchableOpacity
        style={[styles.btn, working && styles.btnDisabled]}
        onPress={handleExport}
        disabled={working}
      >
        {working
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.btnText}>Export all lessons</Text>}
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Import</Text>
      <Text style={styles.sectionDesc}>
        Load lessons from a previously exported JSON file. Existing lessons are kept.
      </Text>
      <TouchableOpacity
        style={[styles.btn, styles.btnSecondary, working && styles.btnDisabled]}
        onPress={handleImport}
        disabled={working}
      >
        {working
          ? <ActivityIndicator color={colors.accent} size="small" />
          : <Text style={[styles.btnText, { color: colors.accent }]}>Choose file to import</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  sectionDesc: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '600' },
});
