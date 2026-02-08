import os
# Silence the SAM/Gaze warnings immediately
os.environ["CORE_MODEL_SAM_ENABLED"] = "False"
os.environ["CORE_MODEL_GAZE_ENABLED"] = "False"
os.environ["CORE_MODEL_SAM3_ENABLED"] = "False"

import cv2
import supervision as sv
from dotenv import load_dotenv
from inference import InferencePipeline
from inference.core.interfaces.camera.entities import VideoFrame
import sys

# DLL Fix for Anaconda
env_path = r"C:\Users\jimen\miniconda3\envs\crowdfest\Library\bin"
if os.path.exists(env_path):
    os.add_dll_directory(env_path)

load_dotenv()
API_KEY = os.getenv("ROBOFLOW_API_KEY")

VIDEO_PATH = "test3.mp4"
OUTPUT_PATH = "output_festival.mp4"
video_info = sv.VideoInfo.from_video_path(VIDEO_PATH)

box_annotator = sv.BoxAnnotator()
label_annotator = sv.LabelAnnotator()
video_sink = sv.VideoSink(target_path=OUTPUT_PATH, video_info=video_info)

def on_prediction(predictions, video_frame: VideoFrame):
    detections = sv.Detections.from_inference(predictions)
    labels = [f"Person" for _ in range(len(detections))]

    annotated_frame = box_annotator.annotate(
        scene=video_frame.image.copy(), 
        detections=detections
    )
    annotated_frame = label_annotator.annotate(
        scene=annotated_frame, 
        detections=detections, 
        labels=labels
    )
    
    count_text = f"Crowd Count: {len(detections)}"
    cv2.putText(annotated_frame, count_text, (50, 80), 
                cv2.FONT_HERSHEY_SIMPLEX, 2.0, (0, 0, 255), 4)
    
    cv2.namedWindow("Festival Safety Monitor", cv2.WINDOW_NORMAL)
    display_frame = cv2.resize(annotated_frame, (1280, 720))
    cv2.imshow("Festival Safety Monitor", display_frame)
    
    video_sink.write_frame(annotated_frame)

    if cv2.waitKey(30) & 0xFF == ord('q'):
        print("\nStopping simulation...")
        cv2.destroyAllWindows()
        os._exit(0)


pipeline = InferencePipeline.init(
    model_id="crowd-counting-dataset-w3o7w/2",
    video_reference=VIDEO_PATH,
    on_prediction=on_prediction,
    api_key=API_KEY,
    confidence=0.15,
    max_fps=5
)

with video_sink:
    print(f"Processing {VIDEO_PATH}... Press 'q' to stop.")
    pipeline.start()
    pipeline.join()
    


print(f"Finished! Saved to: {OUTPUT_PATH}")