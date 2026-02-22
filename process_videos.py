import cv2
import os
import glob

# -----------------------------
# CONFIGURATION
# -----------------------------
VIDEO_FOLDER = "videos"              # folder containing all videos
CLIP_DURATION_SECONDS = 120           # each clip is x seconds long

# -----------------------------
# PROCESS A SINGLE VIDEO
# -----------------------------
def process_video(video_path):
    print(f"\n=== Processing: {video_path} ===")

    # Create base folder for this video
    base_name = os.path.splitext(os.path.basename(video_path))[0]
    base_dir = os.path.join("output", base_name)
    clips_dir = os.path.join(base_dir, "clips")

    os.makedirs(clips_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    clip_length_frames = int(fps * CLIP_DURATION_SECONDS)

    clip_count = 0

    # -----------------------------
    # CLIP EXTRACTION
    # -----------------------------
    print("Extracting clips...")

    for start_frame in range(0, total_frames, clip_length_frames):
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

        clip_path = f"{clips_dir}/clip_{clip_count:03d}.mp4"
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(
            clip_path,
            fourcc,
            fps,
            (
                int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            )
        )

        for _ in range(clip_length_frames):
            ret, frame = cap.read()
            if not ret:
                break
            out.write(frame)

        out.release()
        clip_count += 1

    cap.release()
    print(f"Finished: {video_path}")

# -----------------------------
# MAIN LOOP — PROCESS ALL VIDEOS
# -----------------------------
def process_all_videos():
    video_files = glob.glob(os.path.join(VIDEO_FOLDER, "*.*"))
    video_files = [v for v in video_files if v.lower().endswith((".mp4", ".mov", ".avi"))]

    if not video_files:
        print("No video files found in folder.")
        return

    print(f"Found {len(video_files)} videos.")

    for video in video_files:
        process_video(video)

    print("\nAll videos processed!")

# -----------------------------
# RUN
# -----------------------------
if __name__ == "__main__":
    process_all_videos()