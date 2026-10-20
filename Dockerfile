
FROM node:22-bookworm-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_ENDPOINT=https://huggingface.co
ENV HUGGINGFACE_HUB_CACHE=/opt/huggingface

# Install Python and Linux libraries required by OpenCV.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
    libxcb1 \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

RUN python3 -m venv /opt/ocr-venv
ENV PATH="/opt/ocr-venv/bin:$PATH"

# Install CPU-only PyTorch.
RUN pip install --no-cache-dir \
    --index-url https://pypi.org/simple \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    torch==2.14.1+cpu torchvision==0.29.1+cpu

# Install Pix2Text dependencies.
RUN pip install --no-cache-dir --only-binary=:all: \
    --index-url https://pypi.org/simple \
    -c ocr-service/constraints.txt \
    -r ocr-service/requirements.txt

EXPOSE 10000

CMD ["sh", "start.sh"]
