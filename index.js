const path = require("path");
const fs = require("fs");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { execFile } = require('child_process');

console.log('Using preload path:', path.join(__dirname, 'preload.js'));

function createWindow() {
  const win = new BrowserWindow({
    width: 550,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

ipcMain.handle('dialog:openImage', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select an Image',
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'bmp'] }],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const originalPath = result.filePaths[0];

    // Set destination directory (e.g., inside app folder)
    const destDir = path.join(__dirname, 'images', 'app_images', 'uploaded_images');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    // Generate a destination file path (e.g., keep original filename)
    const fileName = path.basename(originalPath);
    const destPath = path.join(destDir, fileName);

    console.log("Original path:", originalPath);
    console.log("Saving to:", destPath);

    // Return destination path
    try {
      fs.copyFileSync(originalPath, destPath);
      console.log("✅ Done saving");
      return destPath;
    } catch (err) {
      console.error("❌ Failed to copy file:", err);
      return null;
    }
  }

  return null;
});

ipcMain.handle('run-upload-script', async (event, imagePath) => {
  const scriptPath = path.join(__dirname, 'process_upload.py');
  console.log("Looking for script at:", scriptPath);
  console.log("🟡 Calling Python script:", scriptPath, "with image:", imagePath);

  return new Promise((resolve, reject) => {
    execFile('python3', [scriptPath, imagePath], (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Python error:', error.message);
        reject(error.message);
      } else {
        console.log('✅ Python stdout:', stdout);
        try {
          // ✅ Extract the last line that contains JSON
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const result = JSON.parse(lastLine);
          resolve(result);
        } catch (parseErr) {
          console.error("❌ Failed to parse Python output:", parseErr);
          console.error("Received stdout:", stdout);
          reject("Invalid JSON from Python script.");
        }
      }
    });
  });
});



app.on('will-quit', () => {
  const dirPath1 = path.join(__dirname, 'images', 'app_images', 'gen_images');
  const dirPath2 = path.join(__dirname, 'images', 'app_images', 'selected_images');
  const labelsPath = path.join(__dirname, 'labels.json');

  try {
    fs.writeFileSync(labelsPath, JSON.stringify([])); // for an empty array
    console.log('🧹 Cleared labels.json');
  } catch (err) {
    console.error('❌ Failed to clear labels.json:', err);
  }

  if (fs.existsSync(dirPath1)) {
    fs.readdirSync(dirPath1).forEach(file => {
      const filePath = path.join(dirPath1, file);
      try {
        fs.unlinkSync(filePath); // delete the file
      } catch (err) {
        console.error(`Failed to delete ${filePath}:`, err);
      }
    });
    console.log('Cleaned up gen_images directory');
  }

  if (fs.existsSync(dirPath2)) {
    fs.readdirSync(dirPath2).forEach(file => {
      const filePath = path.join(dirPath2, file);
      try {
        fs.unlinkSync(filePath); // delete the file
      } catch (err) {
        console.error(`Failed to delete ${filePath}:`, err);
      }
    });
    console.log('Cleaned up selected_images directory');
  }
});