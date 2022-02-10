import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import Amplify, { Storage, Predictions } from 'aws-amplify';
import { AmazonAIPredictionsProvider } from '@aws-amplify/predictions';
import awsconfig from './aws-exports';
import mic from 'microphone-stream';
import axios from 'axios';
Amplify.configure(awsconfig);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

function App() {

  function SpeechToText(props) {
    const [response, setResponse] = useState("Press 'start recording' to begin your transcription. Press STOP recording once you finish speaking.")
  
    function AudioRecorder(props) {
      const [recording, setRecording] = useState(false);
      const [micStream, setMicStream] = useState();
      const [audioBuffer] = useState(
        (function() {
          let buffer = [];
          function add(raw) {
            buffer = buffer.concat(...raw);
            return buffer;
          }
          function newBuffer() {
            console.log("resetting buffer");
            buffer = [];
          }
  
          return {
            reset: function() {
              newBuffer();
            },
            addData: function(raw) {
              return add(raw);
            },
            getData: function() {
              return buffer;
            }
          };
        })()
      );
  
      async function startRecording() {
        console.log('start recording');
        audioBuffer.reset();
  
        window.navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream) => {
          const startMic = new mic();
  
          startMic.setStream(stream);
          startMic.on('data', (chunk) => {
            var raw = mic.toRaw(chunk);
            if (raw == null) {
              return;
            }
            audioBuffer.addData(raw);
  
          });
  
          setRecording(true);
          setMicStream(startMic);
        });
      }
  
      async function stopRecording() {
        console.log('stop recording');
        const { finishRecording } = props;
  
        micStream.stop();
        setMicStream(null);
        setRecording(false);
  
        const resultBuffer = audioBuffer.getData();
  
        if (typeof finishRecording === "function") {
          finishRecording(resultBuffer);
        }
  
      }
  
      return (
        <div className="audioRecorder">
          <div>
            {recording && <button onClick={stopRecording}>Stop recording</button>}
            {!recording && <button onClick={startRecording}>Start recording</button>}
          </div>
        </div>
      );
    }

    function getFullText(textToInterpret){
      console.log(textToInterpret)
      setResponse(textToInterpret)
      Predictions.interpret({
        text: {
          source: {
            text: textToInterpret,
          },
          type: "ALL"
        }
      })
      .then(result => test(textToInterpret,result))
      .catch(err => console.log({ err }));
    }


    function test(text,sentiment){
      // console.log(text)
      console.log(sentiment['textInterpretation']['sentiment'])
      storeResponse(text, sentiment['textInterpretation']['sentiment'])
    }

    async function storeResponse(text, sentiment){
      var response = await axios.post( // Call storage endpoint to store tokens in dynamoDB
        'https://8dc3yts0yj.execute-api.us-east-1.amazonaws.com/ramtest/response',
        {
            text: text,
            predominant: sentiment['predominant'],
            mixed: sentiment['mixed'],
            negative: sentiment['negative'],
            neutral: sentiment['neutral'],
            positive: sentiment['positive']
        },
        { headers: { 'Content-Type': 'application/json' } }
    )
    return response;
    }
  
    function convertFromBuffer(bytes) {
      setResponse('Converting text...');
  
      Predictions.convert({
        transcription: {
          source: {
            bytes
          },
          language: "en-US", 
        },
      }).then(({ transcription: { fullText } }) => {getFullText(fullText)})
        .catch(err => setResponse(JSON.stringify(err, null, 2)))
    }
    
  
    return (
      <div className="Text">
        <div>
          <h3>Speech to text</h3>
          <AudioRecorder finishRecording={convertFromBuffer} />
          <p>{response}</p>
        </div>
      </div>
    );
  }



  return (
    <div className="App">

      Transcribe Audio
      <SpeechToText />
    </div>
  );
}

export default App;
