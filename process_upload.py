# process_upload.py
import sys
import cv2
import os
import numpy as np
import json
from tensorflow.keras.models import load_model

# File paths
img_filepath = sys.argv[1]
gen_images = []
gen_filepath = 'images/app_images/uploaded_images/gen_images/'
os.makedirs(gen_filepath, exist_ok=True)

# Read in image
try:
    img = cv2.imread(img_filepath)
    print("Image was successfully read.")
    input_path = os.path.abspath(os.path.join(gen_filepath, "input.png"))
    cv2.imwrite(input_path, img)
except Exception as e:
    print("Error reading image:", e)
    result = {
        "images": [],
        "message": f"Error reading image: {str(e)}"
    }
    print(json.dumps(result))
    sys.exit(1)

# Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Apply binary threshold (Otsu)
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
binary2 = cv2.bitwise_not(binary)
binary_path = os.path.abspath(os.path.join(gen_filepath, "binary_output.png"))
success = cv2.imwrite(binary_path, binary2)
if success:
    print(f"Binary written successfully")

# Find the largest contour — assume it's the note
contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

if contours:
    # Get the bounding box of the largest contour
    largest = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest)

    # Crop around the note
    cropped = binary[y:y+h, x:x+w]

    # Center in square white canvas
    size = max(w, h) + 10  # add padding
    centered = np.ones((size, size), dtype=np.uint8) * 255  # white canvas

    # Compute offsets to center
    y_offset = (size - h) // 2
    x_offset = (size - w) // 2
    centered[y_offset:y_offset+h, x_offset:x_offset+w] = cropped

    # Save centered image
    centered_path = os.path.abspath(os.path.join(gen_filepath, "centered.png"))
    centered2 = cv2.bitwise_not(centered)
    cv2.imwrite(centered_path, centered2)

    # Get target dimensions
    test_img = cv2.imread("images/original_notes_images/A4.png")
    target_h, target_w, _ = test_img.shape

    # Set label map
    label_map = {
        'C4': 0, 'D4': 1, 'E4': 2, 'F4': 3, 'G4': 4, 'A4': 5, 'B4': 6, 'C5': 7, 
        'D5': 8, 'E5': 9, 'F5': 10, 'G5': 11, 'A5': 12, 'B5': 13, 'C6': 14
    }

    # Load model
    model = load_model('classifier_model.keras')

    # Predict note
    img = centered
    img = cv2.resize(img, (target_w, target_h))
    img = img / 255.0
    img = img.reshape(1, target_h, target_w, 1)
    prediction = model.predict(img)
    pred = np.argmax(prediction)
    pitch = list(label_map.keys())[pred]
    conf = float(prediction[0][pred])
    label = pitch

    # Save the result
    text_result = f"Prediction: {pitch}\nConfidence: {conf:.2f}"

    # Prepare JSON 
    result = {
        "images": [input_path, binary_path, centered_path],
        "text": ["Input Image", "Binary Image", "Centered Image"],
        "message": text_result
    }

else:
    print("No note detected.")
    result = {
        "images": [binary_path],
        "message": "No note detected."
    }

# Final output to Electron
print(json.dumps(result))