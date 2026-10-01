import express from 'express';
const app = express();
app.get('/', (req,res)=>res.send('BOT ONLINE - TESTE'));
app.listen(process.env.PORT||10000, ()=>console.log('WEB OK'));
