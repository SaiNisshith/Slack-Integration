const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
app.use(bodyParser.json());

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

app.post('/slack/events', async (req, res) => {
  const { type, event } = req.body;

  if (type === 'url_verification') {
    return res.send({ challenge: req.body.challenge });
  }

  if (event && event.type === 'message' && !event.bot_id) {
    const { channel, ts, thread_ts } = event;

    try {
      await axios.post('https://slack.com/api/chat.postMessage', {
        channel,
        text: "👋 Hi, we have received your message. Our team will get back to you soon.",
        thread_ts: thread_ts || ts
      }, {
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      res.sendStatus(200);
    } catch (err) {
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
