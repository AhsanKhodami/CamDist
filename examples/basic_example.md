# Example: Basic Distance Detection

This example shows the simplest way to use CamDistance for measuring viewing distance.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Basic Distance Detection Example</title>
  <link rel="stylesheet" href="../dist/jspsych.css">
  <script src="../dist/face_mesh.min.js"></script>
  <script src="../dist/camera_utils.js"></script>
  <script src="../dist/jspsych.js"></script>
  <script src="../dist/jspsych-camera-distance-detection.js"></script>
</head>
<body></body>

<script>
  const jsPsych = initJsPsych({
    override_safe_mode: true,
    on_finish: function() {
      // Get detection data
      var allData = jsPsych.data.get().values();
      var detectionData = allData.find(d => d.hasOwnProperty('viewing_distance_cm'));
      
      if (detectionData) {
        var distance = detectionData.viewing_distance_cm;
        console.log('Detection complete! Distance:', distance, 'cm');
        
        // Show result
        document.body.innerHTML = `
          <div style="max-width: 600px; margin: 50px auto; text-align: center; font-family: Arial, sans-serif;">
            <h1 style="color: #2c3e50;">Distance Detection Complete</h1>
            <div style="background: #d4edda; padding: 30px; border-radius: 10px; margin: 20px 0;">
              <h2 style="color: #155724;">Measured Distance</h2>
              <p style="font-size: 28px; font-weight: bold; color: #155724;">
                ${distance ? distance.toFixed(1) + ' cm' : 'Measurement failed'}
              </p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <p><strong>What this means:</strong></p>
              <p>You are sitting approximately ${distance ? distance.toFixed(1) : 'unknown'} centimeters away from your screen.</p>
              <p>This distance will be used to ensure accurate stimulus presentation in psychological experiments.</p>
            </div>
          </div>
        `;
      }
    }
  });

  // Run the detection
  jsPsych.run([
    {
      type: jsPsychCameraDistanceDetection,
      width_cm: 6.3,  // Average interpupillary distance
      instruction_text: `
        <h2>Camera Distance Detection</h2>
        <p>This tool will automatically measure your distance from the screen using your camera.</p>
        <p><strong>Instructions:</strong></p>
        <ul style="text-align: left; display: inline-block;">
          <li>Make sure your face is well-lit</li>
          <li>Look directly at the camera</li>
          <li>Keep your head still during measurement</li>
          <li>Click "Start Detection" when ready</li>
        </ul>
      `
    }
  ]);
</script>
</html>
```

## Usage

1. Save this code as an HTML file
2. Make sure the required JavaScript files are in the `../dist/` directory
3. Open the HTML file in a web browser
4. Allow camera access when prompted
5. Follow the on-screen instructions

## Expected Output

The tool will:
1. Display detection instructions
2. Activate your camera
3. Detect your face and measure interpupillary distance
4. Calculate viewing distance using geometric principles
5. Display the result in centimeters

## Customization

You can modify:
- `width_cm`: Adjust the assumed interpupillary distance
- `instruction_text`: Customize the instruction message
- Styling: Change the appearance of results display
- Error handling: Add custom error messages

This basic example provides a foundation for integrating CamDistance into your psychological experiments.
