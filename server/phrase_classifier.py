###############################
# Phrase Classifier with 
# Movement Epenthesis
#
# TODO:
#   Add phrase support
#   Dynamic data updates
###############################


import pickle

import cv2
import mediapipe as mp
import numpy as np
import random as rand
from collections import deque


# CONSTANTS
TOT = 20
EPENTHESIS_CONFIDENCE = 20
MVMT_WEIGHT = 3


model_dict = pickle.load(open('./model.p', 'rb'))
model = model_dict['model']

cap = cv2.VideoCapture(0)

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
prev_character = 0

hands = mp_hands.Hands(static_image_mode=True, min_detection_confidence=0.3)

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
while True:
    data_aux = []
    x_ = []
    y_ = []

    FRAME_END = False
    FRAME_START = False

    ret, frame = cap.read()

    H, W, _ = frame.shape

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    results = hands.process(frame_rgb)
    if results.multi_hand_landmarks:
        thisCoordinateData = []
        for hand_landmarks in results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(
                frame,  # image to draw
                hand_landmarks,  # model output
                mp_hands.HAND_CONNECTIONS,  # hand connections
                mp_drawing_styles.get_default_hand_landmarks_style(),
                mp_drawing_styles.get_default_hand_connections_style())

        for hand_landmarks in results.multi_hand_landmarks:
            for i in range(len(hand_landmarks.landmark)):
                x = hand_landmarks.landmark[i].x
                y = hand_landmarks.landmark[i].y

                x_.append(x)
                y_.append(y)
                thisCoordinateData.append(x)
                thisCoordinateData.append(y)

            for i in range(len(hand_landmarks.landmark)):
                x = hand_landmarks.landmark[i].x
                y = hand_landmarks.landmark[i].y
                data_aux.append(x - min(x_))
                data_aux.append(y - min(y_))

        x1 = int(min(x_) * W) - 10
        y1 = int(min(y_) * H) - 10

        x2 = int(max(x_) * W) - 10
        y2 = int(max(y_) * H) - 10
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
                                    # print("STATIONARY")
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
                                            # print("STATIONARY")
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
                                cv2.rectangle(frame, (x1, y1), (x2, y2), (20, 20, 90), 4)
                                cv2.putText(frame, "Movement pruned", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (20, 20, 90), 3, cv2.LINE_AA)
                                cv2.imshow('frame', frame)
                                cv2.waitKey(1)
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
                START_LANDMARKS = results.multi_hand_landmarks
            else:
                for hand_landmarks in START_LANDMARKS:
                    mp_drawing.draw_landmarks(
                        frame,  # image to draw
                        hand_landmarks,  # model output
                        mp_hands.HAND_CONNECTIONS,  # hand connections
                        mp_drawing_styles.get_default_hand_landmarks_style(),
                        mp_drawing_styles.get_default_hand_connections_style())


            # PROCESS DATA
            START_FRAME_CLONE = START_DATA

            for i in range(len(data_aux)):
                try:
                    START_FRAME_CLONE[i] -= data_aux[i]
                except:
                    print("Exception in processer, line 173: data frames are jagged")
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
            
            # print("{}, {}, {}, {}, {}".format(currCount, prevCount, prev_character, labels_dict[int(prediction[0])], labels_dict[prev_character]))
            # print(buffer)
            if currCount / TOT >= prevCount / TOT and currCount / TOT >= 0.25:
                if currCount / TOT >= 0.6:
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (20, 90, 20), 4)
                    cv2.putText(frame, "I KNOW it's:", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (20, 90, 20), 3, cv2.LINE_AA)
                    prev_character = int(prediction[0])
                else:
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (20, 20, 20), 4)
                    cv2.putText(frame, "I think it's:", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (20, 20, 20), 3, cv2.LINE_AA)
            else:
                last_char = labels_dict[prev_character]
                if currCount / TOT >= 0.6:
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (20, 90, 20), 4)
                    cv2.putText(frame, "I know it's:", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (20, 90, 20), 3, cv2.LINE_AA)

                else:
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (20, 20, 20), 4)
                    cv2.putText(frame, "I think it's:", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (20, 20, 20), 3, cv2.LINE_AA)
                if prevCount / TOT >= 0.5:
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (20, 90, 20), 4)
                    cv2.putText(frame, "I know it's:", (x1, y2 + 40), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (20, 90, 20), 3, cv2.LINE_AA)
                    cv2.putText(frame, last_char, (x1 + 250, y2 + 40), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (10, 250, 10), 3, cv2.LINE_AA)
                else:
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (20, 20, 20), 4)
                    cv2.putText(frame, "I think it's:", (x1, y2 + 40), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (20, 20, 20), 3, cv2.LINE_AA)
                    cv2.putText(frame, last_char, (x1 + 250, y2 + 40), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (10, 250, 10), 3, cv2.LINE_AA)

            cv2.putText(frame, predicted_character, (x1 + 250, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (10, 250, 10), 3, cv2.LINE_AA)

        except Exception as e:
            print(str(e))
            cv2.rectangle(frame, (x1, y1), (x2, y2), (240, 0, 20), 4)
            cv2.putText(frame, "EXCEPTION", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (240, 0, 0), 3, cv2.LINE_AA)

    cv2.imshow('frame', frame)
    cv2.waitKey(1)


cap.release()
cv2.destroyAllWindows()
