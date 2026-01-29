// backend/routes/testRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Test Gemini API endpoint
router.get('/test-gemini', async (req, res) => {
  console.log('🔍 Testing Gemini API...');
  
  // Check if API key exists
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    return res.status(500).json({
      success: false,
      message: 'GEMINI_API_KEY not configured in .env file',
      suggestion: 'Add GEMINI_API_KEY=your_key_here to your .env file'
    });
  }

  console.log('✅ GEMINI_API_KEY found (first 10 chars):', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
  console.log('✅ GEMINI_API_KEY length:', process.env.GEMINI_API_KEY.length);

  try {
    // Test with a simple request
    console.log('🌐 Making test request to Gemini API...');
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
    console.log('🌐 API URL (without key):', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=****');
    
    const response = await axios.post(
      apiUrl,
      {
        contents: [{
          parts: [{
            text: 'Say "Hello World" in JSON format like this: {"message": "your response here"}'
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 100,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Gemini API Response Status:', response.status);
    console.log('✅ Gemini API Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      console.log('✅ AI Response:', aiResponse);

      res.status(200).json({
        success: true,
        message: 'Gemini API is working correctly!',
        apiKeyInfo: {
          hasKey: true,
          keyLength: process.env.GEMINI_API_KEY.length,
          firstChars: process.env.GEMINI_API_KEY.substring(0, 5) + '****'
        },
        testResponse: aiResponse,
        fullResponse: response.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gemini API responded but no valid content',
        data: response.data
      });
    }

  } catch (error) {
    console.error('❌ Gemini API Test Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url?.replace(process.env.GEMINI_API_KEY, '****')
    });

    let errorMessage = error.message;
    let detailedError = '';

    if (error.response?.status === 404) {
      errorMessage = 'Gemini API endpoint not found (404). Check the model name.';
      detailedError = 'Try using gemini-pro instead of gemini-1.5-pro';
    } else if (error.response?.status === 400) {
      errorMessage = 'Bad request to Gemini API (400). Invalid parameters.';
      detailedError = JSON.stringify(error.response.data, null, 2);
    } else if (error.response?.status === 403) {
      errorMessage = 'Access forbidden (403). Invalid or expired API key.';
      detailedError = 'Please check your API key in Google AI Studio';
    } else if (error.response?.status === 429) {
      errorMessage = 'Rate limit exceeded (429). Too many requests.';
      detailedError = 'Wait a few minutes and try again';
    }

    res.status(error.response?.status || 500).json({
      success: false,
      message: errorMessage,
      detailedError,
      statusCode: error.response?.status,
      suggestion: 'Check your API key at https://makersuite.google.com/app/apikey'
    });
  }
});

// Test environment variables
router.get('/check-env', (req, res) => {
  const envVars = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY 
      ? `Present (length: ${process.env.GEMINI_API_KEY.length}, first 5: ${process.env.GEMINI_API_KEY.substring(0, 5)}...)` 
      : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not Set',
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not Set'
  };

  res.json({
    success: true,
    message: 'Environment Variables Check',
    environment: envVars,
    timestamp: new Date().toISOString()
  });
});

router.get('/list-models', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'API key not configured'
      });
    }

    console.log('📋 Listing available Gemini models...');
    
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Models retrieved successfully');
    
    // Filter and format models
    const models = response.data.models || [];
    const geminiModels = models.filter(model => 
      model.name.includes('gemini') || model.name.includes('models/gemini')
    ).map(model => ({
      name: model.name,
      displayName: model.displayName || model.name,
      description: model.description || 'No description',
      supportedGenerationMethods: model.supportedGenerationMethods || []
    }));

    res.status(200).json({
      success: true,
      message: 'Available Gemini Models',
      totalModels: geminiModels.length,
      models: geminiModels,
      allModelsCount: models.length
    });

  } catch (error) {
    console.error('❌ Error listing models:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list models',
      error: error.message,
      suggestion: 'Check API key permissions'
    });
  }
});

module.exports = router;