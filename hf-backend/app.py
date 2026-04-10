import os
import uuid
import torch
import torchaudio
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI()

AUDIO_DIR = "audio_out"
os.makedirs(AUDIO_DIR, exist_ok=True)

# Serve generated audio files at /audio/<filename>
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

# On HF Spaces, SPACE_HOST is set automatically — use it to build public URLs
SPACE_HOST = os.environ.get("SPACE_HOST", "")
BASE_URL = f"https://{SPACE_HOST}" if SPACE_HOST else "http://localhost:7860"

# ---------------------------------------------------------------------------
# Load Silero v4_ru — handles Russian stress + homograph disambiguation natively
# See: https://github.com/snakers4/silero-models
# ---------------------------------------------------------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Loading Silero on {device}...")

model, _ = torch.hub.load(
    repo_or_dir="snakers4/silero-models",
    model="silero_tts",
    language="ru",
    speaker="v4_ru",
)
model.to(device)
print("Silero ready.")

SAMPLE_RATE = 24000
DEFAULT_SPEAKER = "aidar"  # Options for v4_ru: aidar, baya, kseniya, xenia, eugene, random


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def synthesize(text: str) -> torch.Tensor:
    """Returns a 1D float32 audio tensor at SAMPLE_RATE."""
    return model.apply_tts(
        text=text,
        speaker=DEFAULT_SPEAKER,
        sample_rate=SAMPLE_RATE,
        put_accent=True,   # automatic stress marking
        put_yo=True,       # restore ё where needed
    )


def save_audio(tensor: torch.Tensor) -> str:
    """Saves tensor to a wav file, returns public URL."""
    fname = f"{uuid.uuid4()}.wav"
    path = os.path.join(AUDIO_DIR, fname)
    # torchaudio expects (channels, samples)
    torchaudio.save(path, tensor.unsqueeze(0).cpu(), SAMPLE_RATE)
    return f"{BASE_URL}/audio/{fname}"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"ok": True}


class LineRequest(BaseModel):
    text: str


class LessonRequest(BaseModel):
    lines: list[str]


@app.post("/tts/line")
def tts_line(req: LineRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    try:
        audio = synthesize(req.text)
        url = save_audio(audio)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tts/lesson")
def tts_lesson(req: LessonRequest):
    if not req.lines:
        raise HTTPException(status_code=400, detail="lines is required")
    try:
        segments = [synthesize(line) for line in req.lines if line.strip()]
        full = torch.cat(segments, dim=0)
        url = save_audio(full)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
