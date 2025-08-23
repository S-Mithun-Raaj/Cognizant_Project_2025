from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch
import io


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "results"
processor = AutoImageProcessor.from_pretrained(MODEL_PATH)
model = AutoModelForImageClassification.from_pretrained(MODEL_PATH)

def classify_image(image):
    """Classify an uploaded image using the Hugging Face model."""
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
    predicted_class = outputs.logits.argmax(-1).item()
    return predicted_class

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    """Receive image, classify, and return prediction."""
    image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    predicted_class = classify_image(image)
    return {"predicted_class": predicted_class}
