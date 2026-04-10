import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: '#f0f0f0',
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          contentStyle: { backgroundColor: '#0d0d0d' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Russian Lessons' }} />
        <Stack.Screen name="lesson/[id]" options={{ title: 'Lesson' }} />
        <Stack.Screen name="import" options={{ title: 'Import Lesson' }} />
        <Stack.Screen name="importexport" options={{ title: 'Import / Export All' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}
