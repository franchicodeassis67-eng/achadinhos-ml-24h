import express from 'express';
const app = express();
app.get('/', (req,res)=>res.send('ERICA BOT TA ON - AGORA VAI'));
app.listen(process.env.PORT || 10000, ()=>console.log('ON'));
