import os
import cv2
from dotenv import load_dotenv
from inference_sdk import InferenceHTTPClient

load_dotenv()
API_KEY = os.getenv("ROBOFLOW_API_KEY")

client = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key=API_KEY
)

image_path = "crowdtest1.png" # Fixed extension from .jpg to .png
model_id = "crowd-counting-dataset-w3o7w/2"

if not os.path.exists(image_path):
    print(f"Error: {image_path} not found in the current folder!")
else:
    print(f"Detecting crowd in {image_path}...")

    result = client.infer(image_path, model_id=model_id)

    predictions = result['predictions']
    num_people = len(predictions)
    img = cv2.imread(image_path)

    for p in predictions:
        x, y, w, h = int(p['x']), int(p['y']), int(p['width']), int(p['height'])
        
        x1, y1 = x - w//2, y - h//2
        x2, y2 = x + w//2, y + h//2
        
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)

    font = cv2.FONT_HERSHEY_SIMPLEX
    text = f"Count: {num_people}"

    cv2.putText(img, text, (50, 50), font, 1.5, (0, 0, 255), 3, cv2.LINE_AA)

    output_path = "crowd_result.jpg"
    cv2.imwrite(output_path, img)

    print(f"\n{'='*40}")
    print(f"Success! Detected {num_people} people.")
    print(f"Result saved as {output_path}")
    print(f"{'='*40}")

    cv2.imshow("Crowd Counting Result", img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()