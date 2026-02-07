// debug-gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
// Changed path to .env
require('dotenv').config({ path: '.env' });

async function debug() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('❌ NO API KEY FOUND in .env file');
    console.log(
      'Check if your .env file has the line: GEMINI_API_KEY=your_key_here',
    );
    return;
  }
  console.log(`🔑 Testing Key: ${key.substring(0, 10)}...`);

  try {
    // Direct Fetch to list models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
    );
    const data = await response.json();

    if (data.error) {
      console.error('\n❌ API ERROR DETAILS:');
      console.error(`Code: ${data.error.code}`);
      console.error(`Status: ${data.error.status}`);
      console.error(`Message: ${data.error.message}`);
      return;
    }

    console.log('\n✅ SUCCESS! Here are the models you can use:');
    if (data.models) {
      const names = data.models.map((m) => m.name);
      console.log(names);
    } else {
      console.log('No models returned. Your key might be restricted.');
    }
  } catch (err) {
    console.error('Network Error:', err);
  }
}

debug();
