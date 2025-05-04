# generate.py
from PIL import Image
from tensorflow.keras.models import load_model
import os    
import shutil
from make_test_images import create_dataset
import random
import cv2
import numpy as np
import json

def run():
    # Get directories
    os.makedirs("images", exist_ok=True)
    base_dir = 'images/original_notes_images/'
    test_ds_dir = 'images/app_images/gen_images/'
    num_variants = 1
    max_pad = 400
    file_paths = []

    # Read in files
    for filename in os.listdir(base_dir):
        if filename.endswith('.png'):
            file_paths.append(os.path.join(base_dir, filename))

    # Create training dataset
    create_dataset(num_variants, max_pad, file_paths, test_ds_dir)

    # Pick 5 to display
    file_paths = []
    for filename in os.listdir(test_ds_dir):
        if filename.endswith('.png'):
            file_paths.append(os.path.join(test_ds_dir, filename))
    selected_files = random.sample(file_paths, 5)

    # Save path
    save_dir = 'images/app_images/selected_images/'

    # Copy over selected files
    for filepath in selected_files:
        filename = os.path.basename(filepath)
        dst_path = os.path.join(save_dir, filename)
        shutil.copy(filepath, dst_path)

    # Load model
    model = load_model('classifier_model.keras')

    # Set label map
    label_map = {
    'C4': 0, 'D4': 1, 'E4': 2, 'F4': 3, 'G4': 4, 'A4': 5, 'B4': 6, 'C5': 7, 
    'D5': 8, 'E5': 9, 'F5': 10, 'G5': 11, 'A5': 12, 'B5': 13,'C6': 14
    }

    # Get desired dimensions
    test_img = cv2.imread("images/original_notes_images/A4.png")
    target_h, target_w, _ = test_img.shape

    # Create dictionary: { "image_1.png": "A4", ... }
    label_dict = {}
    for i, image_file in enumerate(selected_files):
        key = os.path.basename(image_file).strip()  # "image_1.png"

        # Predict
        img = cv2.imread(image_file, 0)
        img = cv2.resize(img, (target_w, target_h))
        img = img / 255.0
        img = img.reshape(1, target_h, target_w, 1)
        prediction = model.predict(img)
        pred = np.argmax(prediction)
        pitch = list(label_map.keys())[np.argmax(prediction)]
        conf = float(prediction[0][pred])
        label = pitch
        
        # Save prediction in JSON
        label_dict[key] = {
            "label": label,
            "confidence": conf
        }

    # Save all predictions to labels.json
    labels_path = os.path.join(os.path.dirname(__file__), 'labels.json')
    with open(labels_path, 'w') as f:
        json.dump(label_dict, f, indent=2)

if __name__ == '__main__':
    run()