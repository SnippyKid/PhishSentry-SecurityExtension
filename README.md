# PhishSentry Frontend

A clean, modern web interface for the PhishSentry email phishing detection system.

## Overview

This frontend application provides a user-friendly interface for interacting with the PhishSentry API to detect potential phishing emails.

## Features

- Simple, intuitive interface for email analysis
- Real-time feedback on phishing detection
- Visual indicators for safe vs. suspicious emails
- Confidence score display

## Setup Instructions

1. Make sure the PhishSentry backend server is running (typically on http://localhost:5000)
2. Open `index.html` in a modern web browser, or serve the folder using a simple HTTP server

### Using Python to serve the app locally

```bash
# Using Python 3
python -m http.server

# Using Python 2
python -m SimpleHTTPServer
```

Navigate to http://localhost:8000 in your browser

## Usage

1. Paste the email content you want to analyze into the text area
2. Click the "Analyze Email" button
3. View the analysis results showing whether the email appears safe or potentially suspicious
4. See the confidence score for the prediction

## API Integration

This frontend communicates with the PhishSentry backend API running at http://localhost:5000/predict. If your backend is running on a different endpoint, update the `API_URL` variable in `script.js`.

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+) 