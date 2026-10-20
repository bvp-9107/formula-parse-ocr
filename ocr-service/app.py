from flask import Flask, request, jsonify
from flask_cors import CORS
from pix2text import Pix2Text
from PIL import Image
import io
import time

app = Flask(__name__)
CORS(app)

print("Loading Pix2Text models...", flush=True)
startup_start = time.perf_counter()
p2t = Pix2Text()
print(f"Pix2Text is ready! Model startup: {time.perf_counter() - startup_start:.2f}s", flush=True)

@app.get("/health")
def health():
    return jsonify({"status": "ok", "engine": "Pix2Text"})

@app.post("/recognize")
def recognize():
    if "file" not in request.files:
        return jsonify({"error": "Upload an image using the 'file' field."}), 400

    uploaded = request.files["file"]
    request_start = time.perf_counter()

    try:
        image = Image.open(io.BytesIO(uploaded.read())).convert("RGB")
        image_ready = time.perf_counter()
        result = p2t.recognize_formula(image)
        finished = time.perf_counter()

        app.logger.info(
            "Pix2Text timing: image preparation %.2fs; inference %.2fs; total %.2fs",
            image_ready - request_start,
            finished - image_ready,
            finished - request_start
        )
        return jsonify({"latex": result})
    except Exception:
        app.logger.exception("Formula recognition failed")
        return jsonify({"error": "Formula recognition failed."}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
