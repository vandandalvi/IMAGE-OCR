from flask import Flask, request, jsonify
from flask_cors import CORS
import openai

app = Flask(__name__)
CORS(app)

openai.api_key = "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"  # Replace with your actual key

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        print("Received text:", data)

        user_text = data.get("text", "")

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # or "gpt-4" if you have access
            messages=[{"role": "user", "content": user_text}]
        )

        reply = response['choices'][0]['message']['content']
        return jsonify({"reply": reply})
    
    except Exception as e:
        print("Error occurred:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)


