// Requirements
const { contextBridge, ipcRenderer } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Directories
const imageDir1 = path.join(__dirname, 'images', 'app_images', 'selected_images');
const imageDir2 = path.join(__dirname, 'images', 'app_images', 'gen_images');
const imageDir3 = path.join(__dirname, 'images', 'app_images', 'uploaded_images');
const labelsPath = path.join(__dirname, 'labels.json');

// API Calls
contextBridge.exposeInMainWorld('electronAPI', {
  openImageDialog: () => ipcRenderer.invoke('dialog:openImage'),
  uploadAndRunPython: (imagePath) => ipcRenderer.invoke('run-upload-script', imagePath)
});

// Python Calls
contextBridge.exposeInMainWorld('pyBridge', {
  // Run the Python script
  runPython: () => {
    const scriptPath = path.join(__dirname, 'generate_images.py');
    exec(`python3 "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Python error:', error.message);
        return;
      }
      if (stderr) console.error('Python stderr:', stderr);
      if (stdout) console.log('Python stdout:', stdout);
    });
  },

  // Get image paths from selected_images folder
  getImagePaths: () => {
    if (!fs.existsSync(imageDir1)) return [];

    return fs.readdirSync(imageDir1)
      .filter(file => file.endsWith('.png'))
      .map(file => `file://${path.join(imageDir1, file)}`);
  },

  // Get parsed label predictions from labels.json
  getLabels: () => {
    if (!fs.existsSync(labelsPath)) return {};
    try {
      const raw = fs.readFileSync(labelsPath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse labels.json:', err);
      return {};
    }
  },

  // Clear generated images from both folders
  clearGeneratedImages: () => {
    [imageDir1, imageDir2, imageDir3].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
          const filePath = path.join(dir, file);
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error(`Failed to delete ${filePath}:`, err);
          }
        });
        console.log(`Cleared contents of ${dir}`);
      }
    });

    // Clear labels.json
    if (fs.existsSync(labelsPath)) {
      try {
        fs.writeFileSync(labelsPath, JSON.stringify({}));
        console.log('Cleared labels.json');
      } catch (err) {
        console.error('Failed to clear labels.json:', err);
      }
    }
  }
});