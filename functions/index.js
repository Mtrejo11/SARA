/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 */

"use strict";

// Messenger API integration example
// We assume you have:
// * a Wit.ai bot setup (https://wit.ai/docs/quickstart)
// * a Messenger Platform setup (https://developers.facebook.com/docs/messenger-platform/quickstart)
//
// 4. WIT_TOKEN=your_access_token FB_APP_SECRET=your_app_secret FB_PAGE_TOKEN=your_page_token node examples/messenger.js
// 5. Subscribe your page to the Webhooks using verify_token and `https://<your_ngrok_io>/webhook` as callback URL.
// 6. Talk to your bot on Messenger!

const bodyParser = require("body-parser");
const crypto = require("crypto");
const express = require("express");
const fetch = require("node-fetch");
const handler = require("./wit_handler");
const functions = require("firebase-functions");
const globalsSecret = require("./globalsSecret");
const cors = require("cors");

let Wit = null;
let log = null;
try {
  // if running from repo
  Wit = require("../").Wit;
  log = require("../").log;
} catch (e) {
  Wit = require("node-wit").Wit;
  log = require("node-wit").log;
}

// Webserver parameter
// const PORT = 8082;
const { FB_PAGE_TOKEN, WIT_TOKEN, FB_VERIFY_TOKEN } = globalsSecret.globals;
// Wit.ai paramete
// ----------------------------------------------------------------------------
// Messenger API specific code

// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference

const fbMessage = (id, text) => {
  const body = JSON.stringify({
    recipient: { id },
    message: { text },
  });
  console.log("SENDER ID", id);
  const qs = "access_token=" + encodeURIComponent(FB_PAGE_TOKEN);
  return fetch("https://graph.facebook.com/me/messages?" + qs, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })
    .then((rsp) => rsp.json())
    .then((json) => {
      if (json.error && json.error.message) {
        throw new Error(json.error.message);
      }
      return json;
    });
};

// ----------------------------------------------------------------------------
// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach((k) => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = { fbid: fbid, context: {} };
  }
  return sessionId;
};

// Setting up our bot
const wit = new Wit({
  accessToken: WIT_TOKEN,
  logger: new log.Logger(log.INFO),
});

// Starting our webserver and putting it all together
const app = express();
app.use(cors({ origin: true })); // Allowing Cross-Origin Requests

app.use(({ method, url }, rsp, next) => {
  rsp.on("finish", () => {});
  next();
});
app.use(bodyParser.json());

// Webhook setup
app.get("/webhook", (req, res) => {
  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === FB_VERIFY_TOKEN
  ) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(400);
  }
});

// Message handler
app.post("/webhook", (req, res) => {
  // Parse the Messenger payload
  // See the Webhook reference
  // https://developers.facebook.com/docs/messenger-platform/webhook-reference
  const data = req.body;
  console.log("IT WAS CALLED", JSON.stringify(data));
  if (data.object === "page") {
    data.entry.forEach((entry) => {
      console.log(JSON.stringify(entry));
      entry.messaging.forEach((event) => {
        if (event.message && !event.message.is_echo) {
          // Yay! We got a new message!
          // We retrieve the Facebook user ID of the sender
          const sender = event.sender.id;

          // We could retrieve the user's current session, or create one if it doesn't exist
          // This is useful if we want our bot to figure out the conversation history
          // const sessionId = findOrCreateSession(sender);

          // We retrieve the message content
          const { text, attachments } = event.message;

          if (attachments) {
            // We received an attachment
            // Let's reply with an automatic message
            fbMessage(
              sender,
              "Sorry I can only process text messages for now."
            ).catch(console.error);
          } else if (text) {
            wit
              .message(text)
              .then((res) => handler.responseFromWit(res))
              // eslint-disable-next-line promise/always-return
              .then((msg) => {
                fbMessage(sender, msg);
              })
              .catch((err) => {
                console.error(
                  "Oops! Got an error from Wit: ",
                  err.stack || err
                );
              });
          }
        }
      });
    });
  }
  res.sendStatus(200);
});

// app.listen(PORT);

exports.SaraAPI = functions.https.onRequest(app);
