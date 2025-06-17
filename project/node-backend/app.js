// server.js
const express = require('express');
const cors = require('cors');
const chatbotRouter = require('./routes/chatbot');
const logsRouter = require('./routes/logs');
const convoRouter = require('./routes/convo');
const ttsRouter = require('./routes/tts');
const sttRouter = require('./routes/stt');
const coachRouter = require('./routes/coach');
const actualsRouter = require('./routes/actuals');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 라우터 접두어는 그대로
app.use('/api/chat', chatbotRouter);
app.use('/api/logs', logsRouter);
app.use('/api/log-convo', convoRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/stt', sttRouter);
app.use('/api/coach', coachRouter);
app.use('/api/actuals', actualsRouter);

app.listen(8000, () => {
  console.log('✅ Node.js API Gateway on http://13.237.236.117:8000');
});
