# Android LLM Chat App 🤖

A React Native mobile application providing a modern, multi-provider chat interface for leading Large Language Models (LLMs) including Google Gemini, Groq, and OpenRouter. Built with Expo, Tamagui, and NativeWind, inspired by the best UX patterns from ChatGPT and Perplexity.

## Features

- 💬 Chat with Gemini, Groq, and OpenRouter LLMs
- 🔄 Quick provider/model switching
- 🔑 Secure, local API key management (never sent to any backend)
- 💾 Local encrypted chat history storage
- 📝 Markdown & code block rendering with syntax highlighting
- 📋 Copy code and responses easily
- ⚡ Streaming LLM responses for fast feedback
- 🛑 Stop and regenerate responses (where supported)
- 🗂️ Multi-chat support with history, rename, and delete
- 🎨 Modern, accessible UI (Tamagui + NativeWind)
- 🌗 Light & dark mode, responsive layout
- 🛡️ Transparent security: API keys stored locally, never transmitted externally

## Prerequisites

- Node.js installed on your machine
- API keys for your chosen providers:
  - [Gemini API key](https://makersuite.google.com/app/apikey)
  - [Groq API key](https://console.groq.com/keys)
  - [OpenRouter API key](https://openrouter.ai/keys)

## Get Started

1. Install dependencies
   ```bash
   npm install
   ```

2. Start the development server
   ```bash
   npx expo start
   ```

3. Open the app and configure your API keys in Settings (sidebar > Manage API Keys)

## Running the App

You can run the app using:
- Android Emulator
- iOS Simulator
- Expo Go app on your physical device

## Technologies Used

- React Native with Expo
- Tamagui UI Components
- NativeWind (Tailwind CSS for React Native)
- Google Gemini, Groq, OpenRouter APIs
- React Context API
- Local encrypted storage
- Markdown & syntax highlighting libraries

## Project Structure

```
androidLLM/
├── app/         # App entry, navigation, global styles
├── components/  # Reusable UI components (Chat, Sidebar, Settings, etc.)
├── context/     # React Context providers (data, theme)
├── services/    # LLM API service integrations
├── utils/       # Utility functions (encryption, markdown, config)
├── assets/      # Fonts and static assets
└── ...          # Config and environment files
```

## Security & Privacy

- Your API keys and chat history are stored **locally** on your device using encryption.
- **Keys are never sent to any backend or third-party server.**
- You can add, edit, or remove keys at any time via the app settings.
- See the in-app security notice for more details.

## UX Principles & Design

- Inspired by ChatGPT (sidebar, chat flow) and Perplexity (clean layout, source handling)
- Accessible, responsive, and keyboard-friendly
- Clear feedback for errors, connection status, and API usage
- See `/tailwind.config.js` for the color palette and design tokens

## Roadmap

- [ ] Add more LLM providers
- [ ] Advanced chat context management
- [ ] User feedback and analytics (opt-in, privacy-first)
- [ ] More customization options
- [ ] LaTeX support
- [ ] Better code highlighthing

---

_This project is in active development. Contributions and feedback are welcome!_
