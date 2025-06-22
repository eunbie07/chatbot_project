// app.js
const express = require('express');
const cors = require('cors');
const chatbotRouter = require('./routes/chatbot');
const logsRouter = require('./routes/logs');
const convoRouter = require('./routes/convo');
const ttsRouter = require('./routes/tts');
const ttsUploadRouter = require('./routes/tts_upload');
const ttsReplayRouter = require('./routes/tts_replay');
const sttRouter = require('./routes/stt');
const coachRouter = require('./routes/coach');
const actualsRouter = require('./routes/actuals');
const summaryRouter = require('./routes/summary');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 라우터 접두어는 그대로
app.use('/api/chat', chatbotRouter);
app.use('/api/logs', logsRouter);
app.use('/api/log-convo', convoRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/tts_upload', ttsUploadRouter);
app.use('/api/tts_replay', ttsReplayRouter);
app.use('/api/stt', sttRouter);
app.use('/api/coach', coachRouter);
app.use('/api/actuals', actualsRouter);
app.use('/api/summary', summaryRouter);

app.listen(8000, () => {
  console.log('✅ Node.js API Gateway on http://13.237.236.117:8000');
});


