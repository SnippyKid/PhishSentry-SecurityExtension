// Main functionality for PhishSentry frontend
document.addEventListener('DOMContentLoaded', () => {
    const analyzeButton = document.getElementById('analyze-btn');
    const emailContentTextarea = document.getElementById('email-content');
    const resultArea = document.getElementById('result-area');
    const loadingElement = document.getElementById('loading');
    const resultElement = document.getElementById('result');
    const verdictIcon = document.getElementById('verdict-icon');
    const verdictText = document.getElementById('verdict-text');
    const confidenceValue = document.getElementById('confidence-value');

    // API endpoint
    const API_URL = 'http://localhost:5000/predict';

    // Analyze button click handler
    analyzeButton.addEventListener('click', async () => {
        const emailContent = emailContentTextarea.value.trim();
        
        // Validate email content
        if (!emailContent) {
            alert('Please enter email content to analyze.');
            return;
        }

        // Show loading state
        loadingElement.classList.remove('hidden');
        resultElement.classList.add('hidden');
        
        try {
            // Call the API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: emailContent })
            });

            // Check if response is ok
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // Process the response
            const data = await response.json();
            console.log("API Response:", data); // Debug: Log the API response
            displayResult(data);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while analyzing the email. Please try again later.');
        } finally {
            // Hide loading state
            loadingElement.classList.add('hidden');
        }
    });

    // Function to display the analysis result
    function displayResult(data) {
        // In the backend model: 1 = phishing, 0 = safe
        const isPossiblePhishing = data.prediction === 1;
        
        // Update UI based on prediction
        if (isPossiblePhishing) {
            verdictIcon.className = 'phishing';
            verdictText.className = 'text-phishing';
            verdictText.textContent = 'Potential Phishing Detected';
        } else {
            verdictIcon.className = 'safe';
            verdictText.className = 'text-safe';
            verdictText.textContent = 'Email Appears Safe';
        }

        // Update confidence score
        confidenceValue.textContent = `${data.confidence}%`;
        
        // Show result
        resultElement.classList.remove('hidden');
    }
}); 