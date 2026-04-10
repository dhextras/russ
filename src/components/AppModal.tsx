import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors, spacing, fontSize } from '../constants/theme';

export interface ModalButton {
  label: string;
  onPress: () => void;
  style?: 'default' | 'danger' | 'cancel';
}

export interface ModalConfig {
  title: string;
  message?: string;
  buttons: ModalButton[];
}

interface Props {
  config: ModalConfig | null;
  onDismiss: () => void;
}

export function AppModal({ config, onDismiss }: Props) {
  if (!config) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <Text style={styles.title}>{config.title}</Text>
              {config.message ? (
                <Text style={styles.message}>{config.message}</Text>
              ) : null}
              <View style={styles.buttons}>
                {config.buttons.map((btn, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.btn, btnStyle(btn.style)]}
                    onPress={btn.onPress}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.btnText, btnTextStyle(btn.style)]}>
                      {btn.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function btnStyle(style?: string) {
  if (style === 'danger') return styles.btnDanger;
  if (style === 'cancel') return styles.btnCancel;
  return styles.btnDefault;
}

function btnTextStyle(style?: string) {
  if (style === 'cancel') return styles.btnTextCancel;
  return styles.btnTextDark;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 14,
    padding: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttons: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  btn: {
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnDefault: {
    backgroundColor: colors.accent,
  },
  btnDanger: {
    backgroundColor: colors.error,
  },
  btnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  btnTextDark: {
    color: '#fff',
  },
  btnTextCancel: {
    color: colors.textSecondary,
  },
});
