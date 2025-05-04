document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('generate-btn');
    const clearBtn = document.getElementById('select-btn');
    const loadingImg = document.getElementById('loading-image');
    const imageContainer = document.getElementById('image-container');
    const labelListDiv = document.getElementById('label-list');
  
    labelListDiv.innerHTML = '';
    labelListDiv.style.display = 'none';
  
    if (runBtn && imageContainer) {
      runBtn.addEventListener('click', () => {
        labelListDiv.innerHTML = '';
        imageContainer.innerHTML = '';
        loadingImg.style.display = 'block';
        labelListDiv.style.display = 'none';
  
        console.log('🟡 Starting Python script...');
        window.pyBridge.runPython();
  
        const pollInterval = setInterval(() => {
          const imagePaths = window.pyBridge.getImagePaths();
          const labels = window.pyBridge.getLabels();
  
          console.log('📸 Found image paths:', imagePaths.length);
          console.log('📝 Found labels:', Object.keys(labels).length);
  
          if (imagePaths.length > 0 && Object.keys(labels).length > 0) {
            clearInterval(pollInterval);
            loadingImg.style.display = 'none';
            labelListDiv.style.display = 'block';
  
            imagePaths.forEach(src => {
              const fileName = src.split('/').pop();
              const label = labels[fileName] || 'Unknown'
              const prediction = label.label
              const confidence = label?.confidence !== undefined
              ? `Confidence: ${(label.confidence * 100).toFixed(1)}%`
              : '';

  
              console.log(`🖼 Displaying ${fileName} with label: ${prediction}`);
  
              const img = document.createElement('img');
              img.src = src;
              img.style.maxWidth = '300px';
              img.style.margin = '10px';
              img.onerror = () => console.error(`🚫 Failed to load image: ${src}`);
  
              const p = document.createElement('p');
              p.textContent = `Prediction: ${prediction}`;
              p.style.color = 'black';

              const conf = document.createElement('p');
              conf.textContent = confidence;
              conf.style.color = 'gray';
              conf.style.fontSize = '0.9em';
  
              const wrapper = document.createElement('div');
              wrapper.style.textAlign = 'center';
              wrapper.style.marginBottom = '20px';
              wrapper.appendChild(img);
              wrapper.appendChild(p);
              if (confidence) wrapper.appendChild(conf);
  
              imageContainer.appendChild(wrapper);
            });
          }
        }, 500);
      });
    }
  
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        console.log('🧹 Clear button clicked');
        window.pyBridge.clearGeneratedImages();
        imageContainer.innerHTML = '';
        labelListDiv.innerHTML = '';
        labelListDiv.style.display = 'none';
      });
    }

    const uploadBtn = document.getElementById('upload-btn');

    if (uploadBtn) {
        uploadBtn.addEventListener('click', async () => {
            console.log("📸 Upload button clicked!");
            const filePath = await window.electronAPI.openImageDialog();
            console.log('Saved image to:', filePath);
            if (filePath) {
                console.log("🖼️ Setting preview image:", filePath);
                console.log('Saved image to:', filePath);
                // Call different Python script after upload
                loadingImg.style.display = 'block';
                console.log("Calling uploadAndRunPython...");
                const result = await window.electronAPI.uploadAndRunPython(filePath);
                console.log("Python script returned:", result);
                const messageDiv = document.getElementById('predictionMessage');
                const imageContainer = document.getElementById('predictionImages');

                if (result && Array.isArray(result.images) && result.images.length > 0) {
                    loadingImg.style.display = 'none';
                    console.log("✅ Displaying returned images:", result.images);

                if (result && Array.isArray(result.images) && result.images.length > 0) {
                    // 1. Clear and render images horizontally
                    if (imageContainer) {
                      imageContainer.innerHTML = '';
                      result.images.forEach((imgPath, index) => {
                        const img = document.createElement('img');
                        img.src = `file://${imgPath}`;
                        img.style.maxWidth = '300px';
                        img.style.maxHeight = '300px';
                        img.style.objectFit = 'contain';
                        img.style.borderRadius = '10px';
                        img.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
                        imageContainer.appendChild(img);

                        const label = document.createElement('p');
                        label.textContent = result.text[index];
                        label.style.marginTop = '10px';
                        label.style.fontWeight = 'bold';

                        const wrapper = document.createElement('div');
                        wrapper.style.display = 'flex';
                        wrapper.style.flexDirection = 'column';
                        wrapper.style.alignItems = 'center';
                        wrapper.style.margin = '10px';

                        wrapper.appendChild(img);
                        wrapper.appendChild(label);
                        imageContainer.appendChild(wrapper);
                      });
                    }
                  
                    // 2. Show centered message
                    if (messageDiv) {
                      messageDiv.textContent = result.message;
                    }
                  } else {
                    console.warn("⚠️ No valid images array in result:", result);
                  }
                } else {
                console.warn("⚠️ No valid images array in result:", result);
                }
            }
        });    
    }

  });
  