import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { getSettings, saveSettings } from '../src/services/settingsService';
import { resetProvider } from '../src/services/audioService';
import { useModal } from '../src/hooks/useModal';
import { AppModal } from '../src/components/AppModal';
import { colors, spacing, fontSize } from '../src/constants/theme';

export default function SettingsScreen() {
  const [backendUrl, setBackendUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const { modalConfig, hide, alert } = useModal();

  useEffect(() => {
    getSettings().then((s) => setBackendUrl(s.sileroBackendUrl));
  }, []);

  async function handleSave() {
    await saveSettings({ sileroBackendUrl: backendUrl.trim() });
    resetProvider();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleTest() {
    const url = backendUrl.trim();
    if (!url) {
      alert('No URL', 'Enter a backend URL first.');
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    fetch(`${url}/health`, { signal: controller.signal })
      .then(async (r) => {
        clearTimeout(timer);
        if (r.ok) {
          const data = await r.json().catch(() => ({})) as { base_url?: string; device?: string };
          alert('Connected', `Backend is reachable.\nDevice: ${data.device ?? '?'}\nURL: ${data.base_url ?? url}`);
        } else {
          alert('Error', `Backend returned HTTP ${r.status}`);
        }
      })
      .catch(() => {
        clearTimeout(timer);
        alert('Unreachable', 'Could not connect. Check the URL and make sure the Space is running.');
      });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppModal config={modalConfig} onDismiss={hide} />

      <Text style={styles.heading}>Silero TTS Backend</Text>
      <Text style={styles.desc}>
        Enter the URL of your Hugging Face Space running the Silero TTS backend.
      </Text>

      <Text style={styles.label}>Backend URL</Text>
      <TextInput
        style={styles.input}
        value={backendUrl}
        onChangeText={(t) => { setBackendUrl(t); setSaved(false); }}
        placeholder="https://dhextras-russ.hf.space"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnSecondary} onPress={handleTest}>
          <Text style={styles.btnSecondaryText}>Test connection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
          <Text style={styles.btnPrimaryText}>{saved ? 'Saved!' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Backend response format</Text>
        <Text style={styles.infoCode}>{BACKEND_DOCS}</Text>
      </View>
    </ScrollView>
  );
}

const BACKEND_DOCS = `POST /tts/line
  body:     { "text": "<russian text>" }
  response: { "url": "<URL to .wav file>" }

POST /tts/lesson
  body:     { "lines": ["line1", "line2", ...] }
  response: { "url": "<URL to .wav file>" }

GET /health
  response: { "ok": true, "base_url": "...", "device": "..." }`;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  heading: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  desc: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 22 },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: -spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    fontSize: fontSize.md,
    padding: spacing.md,
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontSize: fontSize.md, fontWeight: '600' },
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
  infoBox: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  infoTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  infoCode: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontFamily: 'monospace',
    lineHeight: 22,
  },
});
