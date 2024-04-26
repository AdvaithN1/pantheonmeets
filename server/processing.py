import sys
import timeit
import pickle
import random as rand
from collections import deque
import numpy as np
import os

from flask import Flask, request, jsonify
app = Flask(__name__)

# CONSTANTS
TOT = 20
EPENTHESIS_CONFIDENCE = 20
MVMT_WEIGHT = 3

dirname = os.path.dirname(__file__)

model_dict = pickle.load(open(os.path.join(dirname, 'model.p'), 'rb'))
model = model_dict['model']

prev_character = 0

labels_dict = {0: 'NO', 1: 'YES', 2: 'HELLO', 3: 'WHO', 4: 'YOU', 5: 'I', 6: 'WATER', 7: 'DRINK', 8: 'HUNGRY'}
labels_dict_char = {0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G', 7: 'H', 8: 'I', 9: 'SPACE', 10: 'K', 
               11: 'L', 12: 'M', 13: 'N', 14: 'O', 15: 'P', 16: 'Q', 17: 'R', 18: 'S', 19: 'T', 20: 'U', 
               21: 'V', 22: 'W', 23: 'X', 24: 'Y', 25: 'NEXT'}
buffer = deque([i for i in range(TOT)])
coordinateBuffer = deque([])

current_epenthesis_score = 0
in_epenthesis = False

START_DATA = []
START_DATA_ABSOLUTE = []
START_LANDMARKS = []
# prev_character = [0 for _ in range(6)]
# buffer = [deque([i for i in range(TOT)]) for _ in range(6)]
# coordinateBuffer = [deque([]) for _ in range(6)]
# current_epenthesis_score = [0 for _ in range(6)]
# in_epenthesis = [False for _ in range(6)]
# START_DATA = [[] for _ in range(6)]
# START_DATA_ABSOLUTE = [[] for _ in range(6)]
# START_LANDMARKS = [[] for _ in range(6)]


@app.route('/recog', methods=['POST'])
def recog():
    global START_DATA, START_DATA_ABSOLUTE, START_LANDMARKS, buffer, coordinateBuffer, prev_character, current_epenthesis_score, in_epenthesis
    if request.is_json:
        try:
            data = request.json

            # print("New num"+str(testingnum))
            # print("\n")
            if data.get('array') == None:
                return
            for frame in data.get('array'):
                if frame == None:
                    continue
                data_aux = []
                x_ = []
                y_ = []

                thisCoordinateData = []

                FRAME_END = False
                FRAME_START = False
                # print(len(data['array']))
                for node in frame:
                    x_.append(node.get('x'))
                    y_.append(node.get('y'))
                    thisCoordinateData.append(node.get('x'))
                    thisCoordinateData.append(node.get('y'))
                for node in frame:
                    data_aux.append(node.get('x') - min(x_))
                    data_aux.append(node.get('y') - min(y_))

                coordinateBuffer.append(thisCoordinateData)
                if len(coordinateBuffer) > EPENTHESIS_CONFIDENCE:
                    coordinateBuffer.popleft()

                try:
                    # phrasal epenthesis logic
                    if len(coordinateBuffer) > 5:
                        array = np.subtract(coordinateBuffer[0], thisCoordinateData)
                        netDelta = 0
                        for delta in array:
                            netDelta += abs(delta)
                        if netDelta < 2:
                            if len(coordinateBuffer) > 5:
                                array = np.subtract(coordinateBuffer[int(len(coordinateBuffer) / 3)], thisCoordinateData)
                                netDelta = 0
                                for delta in array:
                                    netDelta += abs(delta)
                                if netDelta < 2:
                                    if len(coordinateBuffer) > 5:
                                        array = np.subtract(coordinateBuffer[int(2 * len(coordinateBuffer) / 3)], thisCoordinateData)
                                        netDelta = 0
                                        for delta in array:
                                            netDelta += abs(delta)
                                        if netDelta < 2:
                                            print(f"STATIONARY EPENTHESIS WITH SCORE {netDelta}")
                                            current_epenthesis_score += 2
                                        else:
                                            current_epenthesis_score = 0
                                else:
                                    current_epenthesis_score = 0
                        else:
                            if len(coordinateBuffer) > 5:
                                array = np.subtract(coordinateBuffer[int(len(coordinateBuffer) - 2)], thisCoordinateData)
                                netDelta = 0
                                for delta in array:
                                    netDelta += abs(delta)
                                if netDelta < 0.4:
                                    if len(coordinateBuffer) > 5:
                                        array = np.subtract(coordinateBuffer[int(len(coordinateBuffer) - 3)], thisCoordinateData)
                                        netDelta = 0
                                        for delta in array:
                                            netDelta += abs(delta)
                                        if netDelta < 0.6:
                                            if len(coordinateBuffer) > 5:
                                                array = np.subtract(coordinateBuffer[int(len(coordinateBuffer) - 4)], thisCoordinateData)
                                                netDelta = 0
                                                for delta in array:
                                                    netDelta += abs(delta)
                                                if netDelta < 0.6:
                                                    current_epenthesis_score += 1
                                                    print(f"STATIONARY EPENTHESIS WITH SCORE {netDelta}")
                                                else:
                                                    current_epenthesis_score -= 2
                                        else:
                                            current_epenthesis_score -= 2
                                else:
                                    current_epenthesis_score = 0
                                    if netDelta > 2.5:
                                        print("PRUNED WITH SEED", netDelta)
                                        in_epenthesis = True
                                        START_DATA = []
                                        START_DATA_ABSOLUTE = []
                                        START_LANDMARKS = []
                                        continue
                                        
                    if current_epenthesis_score >= 10:
                        if not in_epenthesis:
                            FRAME_END = True
                            in_epenthesis = True
                    else:
                        if in_epenthesis:
                            FRAME_START = True
                            in_epenthesis = False

                    if FRAME_START:
                        print("Starting new phrase: phrasal epenthesis period ended")
                        START_DATA = data_aux
                        START_DATA_ABSOLUTE = thisCoordinateData

                    # PROCESS DATA
                    START_FRAME_CLONE = START_DATA

                    for i in range(len(data_aux)):
                        try:
                            START_FRAME_CLONE[i] -= data_aux[i]
                        except:
                            print(f"Exception in processer, line 165: data frames are jagged with score {len(data_aux)} {len(START_FRAME_CLONE)}")
                    data_aux_clone = []
                    data_aux_clone.extend(START_FRAME_CLONE)
                    data_aux_clone.extend(data_aux)

                    # PROCESS MOVEMENT VECTORS
                    xDisplacement = 0
                    yDisplacement = 0
                    for i in range(0, len(thisCoordinateData), 2):
                        xDisplacement += thisCoordinateData[i] - START_DATA_ABSOLUTE[i]
                    for i in range(1, len(thisCoordinateData), 2):
                        yDisplacement += thisCoordinateData[i] - START_DATA_ABSOLUTE[i]
                    
                    if yDisplacement <= -20:
                        for i in range(MVMT_WEIGHT):
                            data_aux_clone.append(1)
                    elif yDisplacement >= 20:
                        for i in range(MVMT_WEIGHT):
                            data_aux_clone.append(-1)
                    else:
                        for i in range(MVMT_WEIGHT):
                            data_aux_clone.append(0)

                    
                    if xDisplacement <= -20:
                        for i in range(MVMT_WEIGHT):
                            data_aux_clone.append(1)
                    elif xDisplacement >= 20:
                        for i in range(MVMT_WEIGHT):
                            data_aux_clone.append(-1)
                    else:
                        for i in range(MVMT_WEIGHT):
                            data_aux_clone.append(0)

                    prediction = model.predict([np.asarray(data_aux_clone)])
                    predicted_character = labels_dict[int(prediction[0])]
                    buffer.popleft()
                    buffer.append(prediction[0])
                    currCount = buffer.count(prediction[0])
                    prevCount = buffer.count(str(prev_character))

                    if (FRAME_END):
                        print("Exiting phrase: epenthesis period started. Detected: ", predicted_character)
                        return f' {[predicted_character]}'
                except Exception as e:
                    raise e
                

            # print(data)
            return ' default'
        except Exception as e:
            print(e)
            return jsonify({'error': 'couldnt get dat.: '+str(e)}), 400
    else:
        return jsonify({'error': 'Invalid JSON in the request.'}), 400