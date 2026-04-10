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
import { colors, spacing, fontSize } from '../src/constants/theme';

type Status = { type: 'success' | 'error' | 'info'; message: string } | null;

export default function ImportExportScreen() {
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [importDetail, setImportDetail] = useState<string[]>([]);

  async function handleExport() {
    setWorking(true);
    setStatus(null);
    try {
      await exportAllLessons();
      setStatus({ type: 'success', message: 'Export ready — share dialog opened.' });
    } catch (e) {
      setStatus({ type: 'error', message: String(e) });
    } finally {
      setWorking(false);
    }
  }

  async function handleImport() {
    setWorking(true);
    setStatus(null);
    setImportDetail([]);
    try {
      const result = await importAllLessonsFromFile();
      if (!result) {
        setStatus({ type: 'info', message: 'Import cancelled.' });
        return;
      }
      setStatus({
        type: result.imported > 0 ? 'success' : 'error',
        message: `Imported ${result.imported} lesson${result.imported !== 1 ? 's' : ''}. Skipped ${result.skipped}.`,
      });
      if (result.errors.length > 0) {
        setImportDetail(result.errors);
      }
    } catch (e) {
      setStatus({ type: 'error', message: String(e) });
    } finally {
      setWorking(false);
    }
  }

  const statusColor =
    status?.type === 'success'
      ? colors.success
      : status?.type === 'error'
      ? colors.error
      : colors.textSecondary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Export</Text>
      <Text style={styles.sectionDesc}>
        Save all lessons as a JSON file. Audio paths are excluded — only lesson text is exported.
      </Text>
      <TouchableOpacity style={[styles.btn, working && styles.btnDisabled]} onPress={handleExport} disabled={working}>
        {working ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Export all lessons</Text>}
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Import</Text>
      <Text style={styles.sectionDesc}>
        Load lessons from a previously exported JSON file. Existing lessons are kept; duplicates
        may be added with a new ID.
      </Text>
      <TouchableOpacity
        style={[styles.btn, styles.btnSecondary, working && styles.btnDisabled]}
        onPress={handleImport}
        disabled={working}
      >
        {working ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : (
          <Text style={[styles.btnText, { color: colors.accent }]}>Choose file to import</Text>
        )}
      </TouchableOpacity>

      {status && (
        <View style={[styles.statusBox, { borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{status.message}</Text>
          {importDetail.map((err, i) => (
            <Text key={i} style={styles.detailText}>
              {err}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  sectionDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
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
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  statusBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  detailText: {
    color: colors.error,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
