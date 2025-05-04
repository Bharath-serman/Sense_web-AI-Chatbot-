# SenseWeb — AI Chatbot with DeepSeek-R1 + React

**SenseWeb** is an AI chatbot built with a **React frontend** and a **Python backend** that integrates the **DeepSeek-R1** language model locally using **Ollama**.  
This project allows users to chat with an LLM directly in their browser, with all processing done locally — no external APIs or cloud services.

---

## Powered By

- [Ollama](https://ollama.com/) – Run LLMs locally with ease
- [DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-LLM) – Open-source LLM
- [React.js](https://reactjs.org/) – Frontend interface
- Python + Flask/FastAPI – Backend integration (based on your stack)

---

## Features

- Interactive **React** UI for chatting
- **Ollama DeepSeek-R1** model runs locally
- Backend handles LLM response generation
- No API keys required, works fully offline
- Great as a starting point for building more advanced chatbots

---

## Prerequisites

- Python 3.8+
- Node.js & npm
- [Ollama](https://ollama.com/) installed and running locally
- Pull DeepSeek-R1 model:

```bash
ollama pull deepseek-r1

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/senseweb.git
cd senseweb
### 2. Set Up the Backend

```bash
cd server
pip install -r requirements.txt
python app.py
### 3. Set Up the Frontend

```bash
cd ../client
npm install
npm start
Your app should now be running at:  
[http://localhost:3000](http://localhost:3000)


