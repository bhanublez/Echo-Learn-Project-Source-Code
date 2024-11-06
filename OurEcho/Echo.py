
from flask import Flask, render_template, request
import webbrowser
import os
from flask_cors import CORS
import json

import MyTTS
import GetScore
import GetSamples

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = '*'

rootPath = ''


@app.route(rootPath+'/')
def main():
    return render_template('index.html')


# @app.route(rootPath+'/getAudioFromText', methods=['POST'])
# def getAudioFromText():
#     event = {'body': json.dumps(request.get_json(force=True))}
#     return lambdaTTS.lambda_handler(event, [])


@app.route(rootPath+'/getSample', methods=['POST'])
def getNext():
    event = {'body':  json.dumps(request.get_json(force=True))}
    return GetSamples.lambda_handler(event, [])

def load_sample_data():
    """
    Load and parse the data from sample_data.txt.
    """
    with open('sample_data.txt', 'r') as f:
        # Read and parse the stored data
        data = json.load(f)
        
        # The base64Audio might include "data:audio/ogg;base64," prefix, so we need to remove that
        if "base64Audio" in data:
            data["base64Audio"] = data["base64Audio"].split(",")[1]  # Extract actual base64 content

    return data

@app.route(rootPath+'/initialize', methods=['POST','GET'])
def GetAccuracyFromRecordedAudio():
    # print("HEllo")
    if(request.method=='GET'):
        return "Sample data via GET request"

    event = {'body': json.dumps(request.get_json(force=True))}#It used to be request.get_json(force=True) for the body
    #Store the data in sample_data.txt file first clear the file then write the data
    with open('sample_data.txt', 'w') as f:
        f.write(json.dumps(json.loads(event['body'])))

    sample_data = load_sample_data()
    lambda_event = {
        "body": json.dumps(sample_data)  # JSON string of the sample data
    }


    lambda_correct_output = GetScore.lambda_handler(lambda_event)
    return lambda_correct_output


if __name__ == "__main__":
    language = 'en'
    print(os.system('pwd'))
    webbrowser.open_new('http://127.0.0.1:3000/')
    app.run(host="0.0.0.0", port=3000)