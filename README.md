# 🤖 AI OCR VISION

A smart web app that opens your **camera**, detects visible text using **OCR**, sends it to **ChatGPT**, and displays the response — all in real-time.

---

## ✨ Features

- 📷 Live camera access
- 🔍 Real-time OCR (Optical Character Recognition) using `Tesseract.js`
- 💬 Smart responses from ChatGPT via OpenAI API
- ⚙️ Flask backend for secure API handling
- 🌐 Fully deployed frontend & backend (via Render)

---

## 🧠 Why I built this

Tbh, I was just too lazy to copy quiz text and paste it into ChatGPT every time 😅  
So I built this app to point my camera and get the answer instantly. Work smarter, not harder 😜

---

## 📁 Folder Structure

ai-ocr-vision/ 
│ 
├── client/# React frontend 
│   └── src/ 
│   └── public/ 
│   └── package.json 
│ 
├── server/# Flask backend 
│   └── app.py 
│   └── requirements.txt 
│   └── README.md

---

## ⚙️ Prerequisites

- Node.js & npm
- Python 3.x
- OpenAI API key

---

## 🚀 Getting Started

### ✅ 1. Clone the Repository

```bash
git clone https://github.com/your-username/AI-OCR-VISION.git
cd AI-OCR-VISION

Setup Frontend (React)

1. Navigate to frontend folder:



cd frontend

2. Install dependencies:



npm install

> ⚠️ node_modules is not uploaded to GitHub. You must run npm install to generate it.



3. Start the React app:



npm start

The app will run on http://localhost:3000


---

🐍 Setup Backend (Flask)

1. Navigate to backend folder:



cd ../backend

2. (Optional) Create virtual environment:



python -m venv venv
source venv/bin/activate   # macOS/Linux
venv\Scripts\activate      # Windows

3. Install Python dependencies:



pip install -r requirements.txt

4. Open app.py and replace the placeholder with your OpenAI API key:



openai.api_key = "your-openai-api-key"

5. Start the Flask backend:



python app.py

The server runs on http://localhost:5000


Both frontend and backend are deployed on Render.

Update frontend API calls from localhost to your Render backend URL when deploying.

Make sure CORS is configured in Flask to accept frontend domain.

Contributing

Feel free to fork, improve, or raise issues. Ideas and improvements are always welcome!

📝 License

Open-source and free to use — just give credit if you reuse it! 😉