# Android LLM Chat App 🤖

A React Native mobile application that provides a chat interface for Google's Gemini AI models, built with Expo.

## Features

- 💬 Chat interface for Gemini AI models
- 🔑 Secure API key management
- 💾 Local chat history storage
- 🎨 Modern UI with Tamagui components
- 🎯 NativeWind styling (Tailwind CSS for React Native)

## Prerequisites

- Node.js installed on your machine
- Gemini API key ([Get it here](https://makersuite.google.com/app/apikey))

## Get Started

1. Install dependencies
   ```bash
   npm install
   ```

2. Start the development server
   ```bash
   npx expo start
   ```

3. Enter your Gemini API key in the app settings

## Running the App

You can run the app using:
- Android Emulator
- iOS Simulator
- Expo Go app on your physical device

## Technologies Used

- React Native with Expo
- Tamagui UI Components
- NativeWind (Tailwind CSS)
- Google Gemini API
- React Context API
- Local encrypted storage

## Project Structure

```
androidLLM/
├── components/    # Reusable UI components
├── context/      # React Context providers
├── services/     # External services (Gemini API)
├── utils/        # Utility functions
└── screens/      # Application screens
```

## Security

This app stores your Gemini API key and chat history locally on your device using encryption for security.
