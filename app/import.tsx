import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { validateLessonJSON } from '../src/services/lessonValidator';
import { createLessonFromImport } from '../src/services/storage';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { useModal } from '../src/hooks/useModal';
import { AppModal } from '../src/components/AppModal';
import { ensureFullAudio } from '../src/services/audioService';
import { colors, spacing, fontSize } from '../src/constants/theme';

export default function ImportLessonScreen() {
  const [json, setJson] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const network = useNetworkStatus();
  const { modalConfig, hide, alert } = useModal();

  async function handleCopyPrompt() {
    await Clipboard.setStringAsync(LESSON_GENERATOR_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    if (!json.trim()) {
      setErrors(['Paste a lesson JSON first']);
      return;
    }
    const result = validateLessonJSON(json);
    if (!result.valid || !result.lesson) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      const lesson = await createLessonFromImport(result.lesson);
      if (network.isInternetReachable) {
        ensureFullAudio(lesson.id).catch(() => {});
      }
      alert(
        'Saved',
        `"${lesson.title}" saved.${network.isInternetReachable ? ' Audio is being generated.' : ' Go online to generate audio.'}`,
        () => router.back()
      );
    } catch {
      setErrors(['Failed to save lesson. Please try again.']);
    } finally {
      setSaving(false);
    }
  }

  function handleValidate() {
    if (!json.trim()) {
      setErrors(['Nothing to validate']);
      return;
    }
    const result = validateLessonJSON(json);
    if (result.valid) {
      setErrors([]);
      alert('Valid', `Lesson looks good — ${result.lesson?.lines.length} lines found.`);
    } else {
      setErrors(result.errors);
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <AppModal config={modalConfig} onDismiss={hide} />

      <TouchableOpacity style={styles.copyPromptBtn} onPress={handleCopyPrompt}>
        <Text style={styles.copyPromptText}>
          {copied ? 'Copied!' : 'Copy AI lesson generator prompt'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.copyPromptHint}>
        Paste into Claude or ChatGPT → get JSON → paste below
      </Text>

      <Text style={[styles.label, { marginTop: spacing.lg }]}>Paste lesson JSON</Text>
      <TextInput
        style={styles.input}
        multiline
        value={json}
        onChangeText={(t) => { setJson(t); setErrors([]); }}
        placeholder={'{\n  "title": "...",\n  "description": "...",\n  "lines": [...]\n}'}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
      />

      {errors.length > 0 && (
        <View style={styles.errorBox}>
          {errors.map((e, i) => (
            <Text key={i} style={styles.errorText}>• {e}</Text>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnSecondary} onPress={handleValidate}>
          <Text style={styles.btnSecondaryText}>Validate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.btnPrimaryText}>Save Lesson</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.hint}>
        <Text style={styles.hintTitle}>Expected format</Text>
        <Text style={styles.hintCode}>{SAMPLE_HINT}</Text>
      </View>
    </ScrollView>
  );
}

const LESSON_GENERATOR_PROMPT = `Generate a practical Russian lesson for a mobile Russian-learning app.

Return ONLY valid JSON. No markdown fences. No commentary before or after the JSON.

Output format:
{
  "title": "Lesson title",
  "description": "Short useful description",
  "tags": ["tag1", "tag2"],
  "lines": [
    { "ru": "Russian sentence", "en": "Natural English translation" }
  ]
}

Rules:
- Russian must be natural, modern, actually usable in real life
- English must be an accurate translation of the Russian, not a loose summary
- No transliteration, no grammar notes, no IPA, no markdown
- Every line must have exactly: ru and en
- Focus on real-world spoken situations (shop, cafe, directions, transport, pharmacy, greetings, small talk)
- Avoid textbook lines nobody says
- Default length: 15-22 lines (medium lesson)
- Order lines logically like a real interaction

If you cannot satisfy the format exactly, still return valid JSON and do not include any explanation outside the JSON.`;

const SAMPLE_HINT = `{
  "title": "At the shop",
  "description": "Buying things",
  "tags": ["shop"],
  "lines": [
    { "ru": "Здравствуйте!", "en": "Hello!" }
  ]
}`;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  copyPromptBtn: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  copyPromptText: { color: colors.accent, fontSize: fontSize.md, fontWeight: '600' },
  copyPromptHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    fontSize: fontSize.sm,
    fontFamily: 'monospace',
    padding: spacing.md,
    minHeight: 200,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#2a0a0a',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 6,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  errorText: { color: colors.error, fontSize: fontSize.sm, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  btnSecondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnSecondaryText: { color: colors.text, fontSize: fontSize.md },
  btnDisabled: { opacity: 0.5 },
  hint: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hintTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hintCode: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
