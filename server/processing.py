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


# sys.stderr.write("running")
# with open("a.txt", "w") as file:
#     # Write some content to the file
#     file.write("Hello, world!")

# def process_message(message):
#     print('Message received:', message, "From client")

# if __name__ == '__main__':

#     print("running")
#     sys.stderr.write("running")
#     while True:
#         message = sys.stdin.readline().strip()
#         if message:            
#             # Process the message
#             process_message(message)
            
#             sys.stdout.flush() # NEEDED TO SEND IMMEDIATELY

#         time.sleep(0.001) # STOP FOR 100 MILLISECONDS