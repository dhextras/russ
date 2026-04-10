import { useState, useCallback } from 'react';
import { ModalConfig, ModalButton } from '../components/AppModal';

export function useModal() {
  const [config, setConfig] = useState<ModalConfig | null>(null);

  const hide = useCallback(() => setConfig(null), []);

  const show = useCallback((cfg: ModalConfig) => setConfig(cfg), []);

  // Convenience: simple info alert with one OK button
  const alert = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      setConfig({
        title,
        message,
        buttons: [{ label: 'OK', onPress: () => { hide(); onOk?.(); }, style: 'default' }],
      });
    },
    [hide]
  );

  // Convenience: confirmation with Cancel + action button
  const confirm = useCallback(
    (
      title: string,
      message: string,
      actionLabel: string,
      onConfirm: () => void,
      danger = false
    ) => {
      setConfig({
        title,
        message,
        buttons: [
          { label: 'Cancel', onPress: hide, style: 'cancel' },
          {
            label: actionLabel,
            style: danger ? 'danger' : 'default',
            onPress: () => { hide(); onConfirm(); },
          },
        ],
      });
    },
    [hide]
  );

  return { modalConfig: config, show, hide, alert, confirm };
}
