# Customized Research Feed Demo

An intelligent research filtering and summarization system that automatically processes academic studies and generates personalized summaries based on user interests and roles.

## What?
- 📚 Loads research studies from a database (currently local, manually set files)
- 🎯 Finds relevant studies based on the user profile
- 🤖 Generates summaries of the relevant studies

### What do I need?

1. **Node.js** (version 14 or higher)
2. **OpenAI API Key** 

### How to run?

1. **Clone and install dependencies:**
  - npm install

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```
   OPENAI_API_KEY=your_key
   ```

3. **Start the web interface:**
```bash
node server.js
```

4. Open `http://localhost:3000`

That's it for now. Advanced CLI options are not needed for most use cases. 
