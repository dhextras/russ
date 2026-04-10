import os
import uuid
import traceback
import torch
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI()

AUDIO_DIR = "audio_out"
os.makedirs(AUDIO_DIR, exist_ok=True)

app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

# Build public base URL from HF env vars
SPACE_HOST = os.environ.get("SPACE_HOST", "")
SPACE_ID = os.environ.get("SPACE_ID", "")  # "username/space-name"
if SPACE_HOST:
    BASE_URL = f"https://{SPACE_HOST}"
elif SPACE_ID:
    slug = SPACE_ID.replace("/", "-")
    BASE_URL = f"https://{slug}.hf.space"
else:
    BASE_URL = "http://localhost:7860"

print(f"BASE_URL: {BASE_URL}")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Loading Silero on {device}...")

model, _ = torch.hub.load(
    repo_or_dir="snakers4/silero-models",
    model="silero_tts",
    language="ru",
    speaker="v4_ru",
    trust_repo=True,
)
model.to(device)
print("Silero ready.")

SAMPLE_RATE = 24000
SPEAKER = "xenia"


def synthesize(text: str) -> torch.Tensor:
    return model.apply_tts(
        text=text,
        speaker=SPEAKER,
        sample_rate=SAMPLE_RATE,
        put_accent=True,
        put_yo=True,
    )


def save_audio(tensor: torch.Tensor) -> str:
    fname = f"{uuid.uuid4()}.wav"
    path = os.path.join(AUDIO_DIR, fname)
    import numpy as np
    audio = np.array(tensor.cpu().tolist(), dtype=np.float32)
    sf.write(path, audio, SAMPLE_RATE)
    return f"{BASE_URL}/audio/{fname}"


@app.get("/health")
def health():
    return {"ok": True, "base_url": BASE_URL, "device": str(device)}


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
        detail = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
        print(detail)
        raise HTTPException(status_code=500, detail=detail)


@app.post("/tts/lesson")
def tts_lesson(req: LessonRequest):
    if not req.lines:
        raise HTTPException(status_code=400, detail="lines is required")
    try:
        segments = [synthesize(line) for line in req.lines if line.strip()]
        if not segments:
            raise ValueError("No valid lines to synthesize")
        full = torch.cat(segments, dim=0)
        url = save_audio(full)
        return {"url": url}
    except Exception as e:
        detail = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
        print(detail)
        raise HTTPException(status_code=500, detail=detail)
