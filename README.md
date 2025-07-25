# CamDistance: Camera Distance Detection Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DOI](https://joss.theoj.org/papers/10.21105/joss.XXXXX/status.svg)](https://doi.org/10.21105/joss.XXXXX)

## Overview

**CamDistance** is a web-based tool for automatic camera distance detection using facial landmark detection. Developed for experimental psychology research, this tool automatically measures the viewing distance between participants and their computer screens using real-time facial recognition technology.

### Key Features

- **Automatic Distance Measurement**: Uses MediaPipe Face Mesh for real-time facial landmark detection
- **High Accuracy**: Achieves ±2-3 cm precision for distances between 40-100 cm
- **Web-Based**: No software installation required, works in any modern browser
- **Framework Integration**: Built as a jsPsych plugin with JATOS compatibility
- **Real-Time Feedback**: Provides live measurement feedback to participants
- **Stabilization Algorithms**: Temporal smoothing and outlier rejection for reliable measurements

## What is Camera Distance Detection?

In psychological experiments, particularly those involving visual stimuli, the distance between the participant and the screen critically affects:

- **Visual Angle**: The apparent size of stimuli on the retina
- **Stimulus Perception**: How participants perceive and interact with visual elements
- **Data Validity**: Ensuring consistent experimental conditions across participants

Traditional methods rely on manual measurement with rulers, which is time-consuming, error-prone, and impossible in remote experiments. CamDistance automates this process using computer vision technology.

## How It Works

1. **Face Detection**: Uses MediaPipe to detect 468 facial landmarks in real-time
2. **Interpupillary Distance (IPD) Measurement**: Calculates pixel distance between eye landmarks
3. **Geometric Calculation**: Applies pinhole camera model: `Distance = (Real_IPD × Focal_Length) / Pixel_IPD`
4. **Stabilization**: Averages measurements over time and filters outliers
5. **Result Display**: Shows measured distance in centimeters

## Installation

### Direct Usage (Recommended)

Simply include the required JavaScript files in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Distance Detection</title>
  <link rel="stylesheet" href="./dist/jspsych.css">
  <script src="./dist/face_mesh.min.js"></script>
  <script src="./dist/camera_utils.js"></script>
  <script src="./dist/jspsych.js"></script>
  <script src="./dist/jspsych-camera-distance-detection.js"></script>
</head>
<body></body>

<script>
  const jsPsych = initJsPsych({
    on_finish: function() {
      var detectionData = jsPsych.data.get().values();
      var distance = detectionData.find(d => d.viewing_distance_cm);
      console.log('Measured distance:', distance.viewing_distance_cm, 'cm');
    }
  });

  jsPsych.run([
    {
      type: jsPsychCameraDistanceDetection,
      width_cm: 6.3  // Assumed interpupillary distance
    }
  ]);
</script>
</html>
```

### Integration with Existing Experiments

Add to your jsPsych timeline:

```javascript
const distance_detection = {
  type: jsPsychCameraDistanceDetection,
  width_cm: 6.3,
  instruction_text: "Please look at the camera and click 'Start Detection'",
  on_finish: function(data) {
    console.log('Measured distance:', data.viewing_distance_cm, 'cm');
  }
};

const timeline = [
  distance_detection,
  // ... your other trials
];
```

## Dependencies

- **MediaPipe Face Mesh**: Facial landmark detection
- **jsPsych**: Experimental framework integration
- **WebRTC**: Camera access through modern browsers

## Browser Compatibility

- Chrome/Chromium 60+
- Firefox 55+
- Safari 11+
- Edge 79+

**Note**: Requires HTTPS for camera access (except on localhost)

## Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `width_cm` | number | 6.3 | Assumed interpupillary distance in cm |
| `instruction_text` | string | Default instructions | Custom instruction text |
| `stabilization_threshold` | number | 2.0 | Distance variation threshold for stability |
| `min_measurements` | number | 30 | Minimum measurements before reporting result |
| `max_measurements` | number | 100 | Maximum measurements to collect |

## Use Cases

### Laboratory Experiments
- Standardize viewing distance across participants
- Eliminate manual measurement errors
- Improve experimental workflow efficiency

### Remote Experiments
- Enable distance detection in online studies
- Maintain experimental validity in remote settings
- Provide consistent spatial parameters

### Adaptive Experiments
- Dynamically adjust stimulus size based on viewing distance
- Implement distance-dependent experimental manipulations
- Create responsive experimental designs

## Accuracy and Validation

CamDistance has been tested under various conditions:

- **Distance Range**: 40-100 cm (optimal performance)
- **Accuracy**: ±2-3 cm under good lighting conditions
- **Lighting**: Requires adequate frontal illumination
- **Camera Quality**: Works with standard webcams (720p or higher recommended)

### Factors Affecting Accuracy

- **Lighting Conditions**: Better lighting improves landmark detection
- **Camera Quality**: Higher resolution cameras provide better precision
- **Head Position**: Frontal view provides best results
- **Individual Variation**: IPD assumptions may vary across populations

## Research Applications

CamDistance is particularly valuable for:

- **Visual Perception Studies**: Where stimulus size and visual angle matter
- **Attention Research**: Requiring precise spatial control
- **Eye Tracking Experiments**: For accurate gaze-to-stimulus mapping
- **Remote Testing**: Where traditional measurement is impossible
- **Developmental Studies**: Reducing experimenter interaction with children

## Example Output

```json
{
  "viewing_distance_cm": 65.2,
  "confidence": 0.92,
  "measurements_count": 45,
  "stabilization_time_ms": 3200,
  "face_detection_quality": "good"
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository
2. Make your changes to the JavaScript files
3. Test with the provided HTML examples
4. Submit a pull request

## Citation

If you use CamDistance in your research, please cite:

```bibtex
@article{khodami2025camdistance,
  title={CamDistance: A Web-Based Tool for Automatic Camera Distance Detection Using Facial Landmark Detection},
  author={Khodami, Mohammad Ahsan},
  journal={Journal of Open Source Software},
  year={2025},
  publisher={The Open Journal}
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [Coming Soon]
- **Issues**: Please report bugs and feature requests on GitHub
- **Contact**: Mohammad Ahsan Khodami (ORCID: 0000-0003-0130-7752)

## Acknowledgments

- **University of Padova**: Department of General Psychology for research support
- **MediaPipe Team**: For providing the facial landmark detection framework
- **jsPsych Community**: For the experimental framework that makes integration possible

---

**Keywords**: experimental psychology, computer vision, facial landmarks, distance measurement, web-based experiments, jsPsych, MediaPipe
