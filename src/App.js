import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import Amplify, { Predictions } from 'aws-amplify';
import { AmazonAIPredictionsProvider } from '@aws-amplify/predictions';
import {FaMicrophone} from 'react-icons/fa';
import awsconfig from './aws-exports';
import mic from 'microphone-stream';
import axios from 'axios';
Amplify.configure(awsconfig);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

function App() {

  function SpeechToText(props) {
    const [response, setResponse] = useState("Click to start recording")
    const [processing, setProcessing] = useState(false);
  
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
        setProcessing(true);
  
        const resultBuffer = audioBuffer.getData();
  
        if (typeof finishRecording === "function") {
          finishRecording(resultBuffer);
        }
      }
  
      return (
        <div className="audioRecorder">
          <div>
            {(!recording && !processing) && <p>Click to Start Recording</p>}
            {(recording && !processing) && <p>Recording. Click to Stop Recording</p>}
            {recording && <button className="mic2"onClick={stopRecording}><FaMicrophone/></button>}
            {(!recording && !processing) && <button className="mic"onClick={startRecording}><FaMicrophone/></button>}
            {processing && <p>Thank you for your feedback. Your response has been recorded</p>}
          </div>
        </div>
      );
    }

    function getFullText(textToInterpret){
      console.log(textToInterpret)
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
        'https://52p77ag187.execute-api.us-east-1.amazonaws.com/sacapstone/response',
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
    setProcessing(false);
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
          <AudioRecorder finishRecording={convertFromBuffer} />
          {/* <p>{response}</p> */}
        </div>
      </div>
    );
  }




  
  return (
    <div className="App">
    <header className="App-header">
      <p>
        VoxLoreum
      </p>
      </header>
    <div className="App-body">
    <div className="logo">
        <img src={logo} />
      </div>
      <div className="App-body-description">
      
      <p>
      Thank you for using AnyCompany SaaS. We appreciate you!
       We have simplified our feedback process. 
       Please share your thoughts using your voice and we’ll take it from there!
      </p>
        </div> 
    <p>
      </p>
      <div>
      <SpeechToText />
      </div>
    </div>
  </div>
  );
}

export default App;
