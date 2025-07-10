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
          thread_ts: thread_ts || ts,
          blocks: [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "👋 Hi, we have received your message. Our team will get back to you soon."
              }
            },
            {
              "type": "actions",
              "elements": [
                {
                  "type": "button",
                  "text": {
                    "type": "plain_text",
                    "text": "Create Ticket"
                  },
                  "value": JSON.stringify({ user: event.user, text: event.text }),
                  "action_id": "create_ticket"
                }
              ]
            }
          ]
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

app.use('/slack/interactions', bodyParser.urlencoded({ extended: true }));

app.post('/slack/interactions', async (req, res) => {
  const payload = JSON.parse(req.body.payload);

  if (payload.type === 'block_actions' && payload.actions[0].action_id === 'create_ticket') {
    const { user, text } = JSON.parse(payload.actions[0].value);
    const ticketChannel = 'C0951LWBXEJ';

    try {
      await axios.post('https://slack.com/api/chat.postMessage', {
        channel: ticketChannel,
        text: `*New Ticket Created*\n\n*User ID:* <@${user}>\n*Message:* ${text}`
      }, {
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      res.send({
        text: "Ticket created successfully!",
        replace_original: false
      });
    } catch (error) {
      res.send({
        text: "Failed to create ticket. Please try again.",
        replace_original: false
      });
    }
  } else {
    res.sendStatus(200);
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT);
