# UNLV CS 469 Digital Image Processing Final Project
Author: Riley Ramos

Date: May 2025

## How to Compile
1. Clone the repository.
2. In the terminal, type `npm start`.
3. The web application should start in a separate window.
4. Some navigation features haven't been fully implemented. To ensure the best run-time experience, make sure to click "Go Back" to restart before testing another functionality or the same functionality again.
   - To test generate images multiple times: Start -> Generate Images -> Go Back -> Generate Images
   - To test upload images after testing generate images: Start -> Generate Images -> Go Back -> Upload Image
   - To test generate images after testing upload images: Start -> Upload Image -> Go Back -> Generate Images
   - To test upload images multiple times: Start -> Upload Image -> Go Back -> Upload Image

## Dataset
This project utilizes augmented images of various noteheads. This dataset was created by the script: `create_dataset.ipynb` and can be found in `images/training_data/`. 

## About the Files 
The following are the 5 most important scripting files in this project. Other scripting files in the repo that are not listed below were used for testing during the initial phases of the project; however, they are not essential to the end project's functionality.
### `create_dataset.ipynb`
- Generated training data found in `images/training/data`.
- Does *not* need to be executed with each web application execution.
- Only ran once.
### `make_model.ipynb`
- Creates a classifier ML model to identify note names based on training data, which is saved in the directory as `classifer_model.keras`.
- Does *not* need to be executed with each web application execution.
- Only ran once.
### `create_test_images.py`
- Generates 50 random augmented notehead images that are used in `generate_images.py`.
### `generate_images.py`
- Selects 5 augmented images from `create_test_images.py` at random, and displays them along with their predictions in the web application.
###`process_uploads.py`
- Accepts user-uploaded image of notehead and displays model prediction,
