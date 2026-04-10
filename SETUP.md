# RussApp — Setup

## Install

```bash
cd russ-app
npm install
# or: npx expo install  (respects Expo SDK compat versions)
```

## Run

```bash
npx expo start
```

Scan the QR code with the Expo Go app on your phone, or press `a` for Android emulator / `i` for iOS simulator.

## File structure

```
app/
  _layout.tsx          # root Stack navigator
  index.tsx            # lessons list
  import.tsx           # import a single lesson by pasting JSON
  importexport.tsx     # bulk import / export
  settings.tsx         # backend URL config
  lesson/[id].tsx      # lesson detail + playback

src/
  types/lesson.ts      # shared TypeScript types
  constants/theme.ts   # colors, spacing, font sizes

  services/
    storage.ts         # all file-system operations (lessons + audio)
    lessonValidator.ts # validates pasted JSON before saving
    audioService.ts    # TTS generation + audio cache management
    importExport.ts    # bulk import/export logic
    settingsService.ts # AsyncStorage settings (backend URL)

  tts/
    TTSProvider.ts     # interface — swap providers here
    SileroProvider.ts  # Silero HTTP backend stub

  hooks/
    useNetworkStatus.ts   # polls expo-network every 15s
    useLessons.ts         # lesson list state
    useAudioPlayback.ts   # all playback logic (full + line-by-line)

  components/
    AudioControls.tsx  # play/pause/resume/stop bar
    LineItem.tsx       # single line with play buttons
    CacheBadge.tsx     # small badge showing cache state
```

## Plugging in the Silero backend

The app talks to a backend you run yourself. The backend wraps the Silero TTS model.

**Backend endpoints the app expects:**

```
GET  /health        -> 200 OK
POST /tts/line      -> body: { text: "Привет" }
                       response: { url: "http://your-host/audio/xxx.mp3" }
POST /tts/lesson    -> body: { lines: ["line1", "line2"] }
                       response: { url: "http://your-host/audio/xxx.mp3" }
```

The `url` in the response must be a URL the phone can download from (not localhost unless on the same network).

**Quick backend sketch (Python / FastAPI):**

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import torch, uuid, os

app = FastAPI()
app.mount("/audio", StaticFiles(directory="audio_out"), name="audio")

model, _ = torch.hub.load('snakers4/silero-models', 'silero_tts',
                            language='ru', speaker='v4_ru')

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/tts/line")
def tts_line(body: dict):
    text = body["text"]
    fname = f"{uuid.uuid4()}.mp3"
    path = f"audio_out/{fname}"
    audio = model.apply_tts(text=text, speaker='aidar', sample_rate=24000)
    # save audio tensor to mp3 at `path` (use torchaudio or soundfile)
    return {"url": f"http://YOUR_SERVER_IP:8000/audio/{fname}"}

@app.post("/tts/lesson")
def tts_lesson(body: dict):
    lines = body["lines"]
    # concat all lines, generate one audio file
    ...
```

See the full Silero docs: https://github.com/snakers4/silero-models

**Silero stress handling** (automatic in v4+ models):
The v4_ru model handles Russian stress marking and homograph disambiguation automatically.
You can also pre-process text with: https://github.com/snakers4/silero-stress

## Setting the backend URL

Open the app → **Settings** → enter your backend URL → Save.

The app will test the connection with a `/health` check.

## Offline use

The app works fully offline for reading lessons. Audio is only unavailable if:
- No cached audio exists yet, AND
- There is no internet connection

Once audio is generated and cached, it persists on-device indefinitely (until the lesson is deleted).

## Sample lesson

`sample-lesson.json` in the repo root can be pasted directly into the Import screen to test the app without a TTS backend.
