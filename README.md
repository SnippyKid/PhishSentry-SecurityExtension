# PhishSentry - Email Phishing Detection Extension

PhishSentry is a browser extension that automatically detects and warns users about potential phishing content in emails. Using machine learning, it provides real-time protection while browsing email platforms like Gmail, Outlook, and Yahoo Mail.

## Features

- **Real-time Email Analysis**: Automatically scans emails as you open them
- **ML-powered Detection**: Uses a trained machine learning model to identify phishing attempts
- **Visual Warnings**: Clear warning banners for suspicious content
- **Cross-platform**: Works on Gmail, Outlook, and Yahoo Mail
- **Lightweight**: Minimal performance impact on browser

## Screenshots

### Safe Email Detection
![Safe Email Detection](https://raw.githubusercontent.com/username/PhishSentry/main/screenshots/safe-email-detection.png)

### Phishing Email Detection
![Phishing Email Detection](https://raw.githubusercontent.com/username/PhishSentry/main/screenshots/phishing-email-detection.png)

## Architecture

PhishSentry consists of two main components:

1. **Browser Extension (Frontend)**: 
   - Monitors email content in supported webmail clients
   - Sends email text to the backend API
   - Displays appropriate warnings

2. **API Server (Backend)**:
   - Flask-based REST API
   - Loads ML model trained on phishing emails
   - Analyzes content and returns prediction results

## Installation

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/username/PhishSentry.git

# Navigate to the backend directory
cd PhishSentry/Backend

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```

### Extension Setup
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `PhishSentryExtension` folder
4. Make sure the backend server is running

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python, Flask
- **ML Model**: scikit-learn, TF-IDF Vectorization, Naive Bayes

## Future Improvements

- Add support for more email providers
- Implement link analysis to detect malicious URLs
- Create options for customizing sensitivity levels
- Add user feedback mechanism to improve the model

## License

[MIT License](LICENSE)

---

*Note: This extension is a proof-of-concept and should be used for educational purposes.* 