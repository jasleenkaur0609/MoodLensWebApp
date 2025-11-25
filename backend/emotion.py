import sys
import json
from deepface import DeepFace

# Helper to convert numpy types to Python native types and to percentages
def convert_to_percentage(obj):
    if isinstance(obj, dict):
        return {k: convert_to_percentage(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_percentage(i) for i in obj]
    elif hasattr(obj, "item"):  # numpy scalar
        val = obj.item()
        return int(round(val * 100)) if 0 <= val <= 1 else int(round(val))
    elif isinstance(obj, float):
        return int(round(obj * 100)) if 0 <= obj <= 1 else int(round(obj))
    else:
        return obj


# Get image path from argument
img_path = sys.argv[1]

try:
    # Analyze emotions
    result = DeepFace.analyze(img_path, actions=['emotion'], enforce_detection=True)

    # Handle multiple faces or single face
    if isinstance(result, list):
        result = result[0]

    detected_emotion = result['dominant_emotion']
    confidence = convert_to_percentage(result['emotion'])  # convert to percentages

    print(json.dumps({
        "detectedMood": detected_emotion,
        "confidence": confidence
    }))

except Exception as e:
    print(json.dumps({
        "detectedMood": "unknown",
        "confidence": {},
        "error": str(e)
    }))
