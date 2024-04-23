import sys
import time
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/recog', methods=['POST'])
def recog():
    if request.is_json:
        try:
            data = request.headers.get('dat')
            print(data)
            return jsonify({'message': f'Hello, {data}!'})
        except Exception as e:
            return jsonify({'error': 'couldnt get dat.: '+str(e)}), 400
    else:
        return jsonify({'error': 'Invalid JSON in the request.'}), 400