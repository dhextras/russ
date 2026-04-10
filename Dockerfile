# HF Spaces Docker build — serves the Silero TTS API on port 7860
# The React Native app files in this repo are ignored by this build.

FROM python:3.11-slim

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"
WORKDIR /home/user/app

COPY --chown=user hf-backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY --chown=user hf-backend/app.py .

# Pre-download Silero model at build time so cold starts are instant.
# Remove this RUN line if the build fails due to network restrictions.
RUN python -c "\
import torch; \
torch.hub.load('snakers4/silero-models', 'silero_tts', language='ru', speaker='v4_ru', trust_repo=True); \
print('Silero cached.')"

EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
