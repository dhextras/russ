import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'app_settings';

export interface AppSettings {
  sileroBackendUrl: string;
}

const defaults: AppSettings = {
  sileroBackendUrl: '',
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return { ...defaults };
  }
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }));
}
