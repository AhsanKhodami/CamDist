var jsPsychCameraDistanceDetection = (function (jspsych) {
  'use strict';

  var version = "1.0.0";

  const info = {
    name: "camera-distance-detection",
    version,
    parameters: {
      /**
       * The instruction text to display above the video feed.
       */
      instruction_text: {
        type: jspsych.ParameterType.HTML_STRING,
        default: 'Position your face in the camera view and click Start Detection.'
      },
      /**
       * The actual width of the interpupillary distance in centimeters.
       */
      width_cm: {
        type: jspsych.ParameterType.FLOAT,
        default: 6.3
      }
    },
    data: {
      /** The estimated viewing distance in centimeters. */
      viewing_distance_cm: {
        type: jspsych.ParameterType.FLOAT
      },
      /** Any error that occurred during detection. */
      error: {
        type: jspsych.ParameterType.STRING
      }
    }
  };

  class CameraDistanceDetectionPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    static {
      this.info = info;
    }

    trial(display_element, trial) {
      // Helper to clear video/camera
      function stopStream(stream) {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }

      // Create video container with overlay
      const container = document.createElement('div');
      container.style.cssText = `
        position: relative;
        max-width: 640px;
        margin: 0 auto;
        border: 2px solid #333;
        border-radius: 8px;
        overflow: hidden;
      `;

      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.style.cssText = `
        width: 100%;
        height: auto;
        display: block;
      `;

      // Face guide overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
      `;

      // Smaller oval for better accuracy and face stabilization
      const faceGuide = document.createElement('div');
      faceGuide.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 280px;
        height: 350px;
        border: 4px solid #00ff00;
        border-radius: 50% / 45%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
      `;

      // Status text
      const statusText = document.createElement('div');
      statusText.style.cssText = `
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 15px;
        font-weight: bold;
        text-align: center;
      `;
      statusText.textContent = 'Position your face in the oval and keep your head stable';

      overlay.appendChild(faceGuide);
      overlay.appendChild(statusText);
      container.appendChild(video);
      container.appendChild(overlay);

      const btn = document.createElement('button');
      btn.textContent = 'Start Detection';
      btn.style.cssText = `
        margin-top: 20px;
        padding: 12px 24px;
        font-size: 16px;
        background: #007cba;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      `;

      // Rerun button (hidden by default)
      const rerunBtn = document.createElement('button');
      rerunBtn.textContent = 'Re-run Detection';
      rerunBtn.style.cssText = `
        margin-top: 20px;
        margin-left: 20px;
        padding: 12px 24px;
        font-size: 16px;
        background: #ff9500;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: none;
      `;

      display_element.innerHTML = `<p style="text-align: center; font-size: 18px; margin-bottom: 20px;">${trial.instruction_text}</p>`;
      display_element.appendChild(container);
      display_element.appendChild(btn);
      display_element.appendChild(rerunBtn);

      let detectionCount = 0;
      let isDetecting = false;
      let stream = null;
      let attemptCount = 0;
      let camera = null;
      let faceMesh = null;
      let stabilizationTimer = null;
      let isStabilizing = false;

      const resetDetection = () => {
        detectionCount = 0;
        isDetecting = false;
        isStabilizing = false;
        attemptCount = 0;
        if (stabilizationTimer) {
          clearTimeout(stabilizationTimer);
          stabilizationTimer = null;
        }
        stopStream(stream);
        if (camera && camera.stop) camera.stop();
        if (faceMesh && faceMesh.close) faceMesh.close();
        // Clear jsPsych data for this trial
        if (window.jsPsych && jsPsych.data) jsPsych.data.reset();
        // Remove all children and rerender
        display_element.innerHTML = '';
        setTimeout(() => {
          this.trial(display_element, trial);
        }, 100);
      };

      rerunBtn.onclick = resetDetection;

      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Starting...';
        isDetecting = true;
        
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: 640, 
              height: 480,
              facingMode: 'user'
            } 
          });
          video.srcObject = stream;
          
          // Wait for video to load
          await new Promise(resolve => {
            video.onloadedmetadata = resolve;
          });
          
        } catch (e) {
          display_element.innerHTML = `<p>Error accessing camera: ${e.message}</p>`;
          this.jsPsych.finishTrial({ error: e.message });
          return;
        }

        faceMesh = new FaceMesh({
          locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });
        
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        });

        faceMesh.onResults(results => {
          if (!isDetecting) return;
          
          const landmarks = results.multiFaceLandmarks?.[0];
          if (!landmarks) {
            statusText.textContent = 'No face detected - position your face in the oval and keep head stable';
            statusText.style.color = '#ff6b6b';
            faceGuide.style.borderColor = '#ff6b6b';
            detectionCount = 0;
            isStabilizing = false;
            if (stabilizationTimer) {
              clearTimeout(stabilizationTimer);
              stabilizationTimer = null;
            }
            return;
          }

          // Even more margin for face positioning (very lenient)
          const [left, right] = [landmarks[33], landmarks[263]]; // Left and right eye corners
          const [top, bottom] = [landmarks[10], landmarks[152]]; // Top forehead and chin
          
          const faceWidth = Math.abs(right.x - left.x);
          const faceHeight = Math.abs(bottom.y - top.y);
          const centerX = (left.x + right.x) / 2;
          const centerY = (top.y + bottom.y) / 2;
          
          // More precise positioning requirements for better accuracy
          const isWellPositioned = 
            centerX > 0.2 && centerX < 0.8 && // More centered horizontally
            centerY > 0.15 && centerY < 0.85 && // More centered vertically  
            faceWidth > 0.08 && faceWidth < 0.6 && // More controlled size range
            faceHeight > 0.12 && faceHeight < 0.8; // More controlled size range

          if (isWellPositioned) {
            detectionCount++;
            
            // Start stabilization phase after 5 good detections
            if (detectionCount >= 5 && !isStabilizing) {
              isStabilizing = true;
              let countdown = 5; // 7 second countdown
              
              const updateCountdown = () => {
                statusText.textContent = `Face detected! Keep head stable for ${countdown} seconds...`;
                statusText.style.color = '#ffa500';
                faceGuide.style.borderColor = '#ffa500';
                countdown--;
                
                if (countdown > 0) {
                  stabilizationTimer = setTimeout(updateCountdown, 1000);
                } else {
                  // After countdown, measure distance
                  statusText.textContent = 'Measuring distance...';
                  statusText.style.color = '#4ecdc4';
                  faceGuide.style.borderColor = '#4ecdc4';
                  
                  // Measure distance after stabilization
                  setTimeout(() => {
                    const dx = right.x - left.x;
                    const dy = right.y - left.y;
                    const pixelDistance = Math.hypot(dx, dy) * video.videoWidth;
                    
                    // Improved formula with better focal length estimation
                    const FOCAL_LENGTH = 834; // Optimized for better accuracy
                    const distance = (trial.width_cm * FOCAL_LENGTH) / pixelDistance;
                    
                    console.log('Debug:', { pixelDistance, distance, videoWidth: video.videoWidth, focalLength: FOCAL_LENGTH });
                    
                    // Accept any reasonable distance (10cm to 500cm)
                    if (distance >= 10 && distance <= 500) {
                      isDetecting = false;
                      stopStream(stream);
                      if (camera && camera.stop) camera.stop();
                      display_element.innerHTML = `
                        <div style="text-align: center;">
                          <h2>✅ Detection Complete!</h2>
                          <p style="font-size: 24px;">Viewing Distance: <strong>${distance.toFixed(1)} cm</strong></p>
                          <div style="margin-top: 20px;">
                            <button id="rerunBtn2" style="padding:12px 24px;font-size:16px;background:#ff9500;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:10px;">🔄 Retry Detection</button>
                            <button id="continueBtn2" style="padding:12px 24px;font-size:16px;background:#4ecdc4;color:white;border:none;border-radius:4px;cursor:pointer;">✓ Continue</button>
                          </div>
                          <p style="margin-top: 15px; color: #666;">Click Retry to measure again, or Continue to proceed</p>
                        </div>
                      `;
                      document.getElementById('rerunBtn2').onclick = resetDetection;
                      document.getElementById('continueBtn2').onclick = () => {
                        this.jsPsych.finishTrial({ viewing_distance_cm: distance });
                      };
                    } else {
                      // If still out of range, just accept it anyway after 1 attempt
                      attemptCount++;
                      if (attemptCount >= 1) {
                        isDetecting = false;
                        stopStream(stream);
                        if (camera && camera.stop) camera.stop();
                        display_element.innerHTML = `
                          <div style="text-align: center;">
                            <h2>⚠️ Detection Complete!</h2>
                            <p style="font-size: 24px;">Viewing Distance: <strong>${distance.toFixed(1)} cm</strong></p>
                            <p style="color: #666;">Note: Estimated distance (may be less accurate)</p>
                            <div style="margin-top: 20px;">
                              <button id="rerunBtn3" style="padding:12px 24px;font-size:16px;background:#ff9500;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:10px;">🔄 Retry Detection</button>
                              <button id="continueBtn3" style="padding:12px 24px;font-size:16px;background:#4ecdc4;color:white;border:none;border-radius:4px;cursor:pointer;">✓ Continue</button>
                            </div>
                            <p style="margin-top: 15px; color: #666;">Recommend retrying for better accuracy</p>
                          </div>
                        `;
                        document.getElementById('rerunBtn3').onclick = resetDetection;
                        document.getElementById('continueBtn3').onclick = () => {
                          this.jsPsych.finishTrial({ viewing_distance_cm: distance, accuracy: 'estimated' });
                        };
                      } else {
                        statusText.textContent = `Distance: ${distance.toFixed(1)}cm. Trying again...`;
                        statusText.style.color = '#ff9500';
                        faceGuide.style.borderColor = '#ff9500';
                        detectionCount = 0;
                        isStabilizing = false;
                      }
                    }
                  }, 500); // Small delay before measuring
                }
              };
              
              updateCountdown();
              
            } else if (detectionCount < 5) {
              statusText.textContent = `Face detected! Hold position... (${detectionCount}/5)`;
              statusText.style.color = '#4ecdc4';
              faceGuide.style.borderColor = '#4ecdc4';
            }
            
          } else {
            statusText.textContent = 'Position your face in the oval and keep head stable';
            statusText.style.color = '#ff9500';
            faceGuide.style.borderColor = '#ff9500';
            detectionCount = Math.max(0, detectionCount - 1);
            isStabilizing = false;
            if (stabilizationTimer) {
              clearTimeout(stabilizationTimer);
              stabilizationTimer = null;
            }
          }
        });

        camera = new Camera(video, {
          onFrame: async () => {
            if (isDetecting && video.readyState === 4) {
              await faceMesh.send({ image: video });
            }
          },
          width: 640,
          height: 480
        });
        
        camera.start();
        btn.textContent = 'Detecting...';
        
        // Add timeout after 30 seconds
        setTimeout(() => {
          if (isDetecting) {
            stopStream(stream);
            if (camera && camera.stop) camera.stop();
            display_element.innerHTML = `<p>Detection timeout. Please try again.</p>`;
            rerunBtn.style.display = '';
            this.jsPsych.finishTrial({ error: 'timeout' });
          }
        }, 30000);
      });
    }
  }

  return CameraDistanceDetectionPlugin;

})(jsPsychModule);
