#!/bin/bash
docker build -t whatsapp-bot .
docker run -d --name whatsapp-bot-container \
 -v db:/usr/src/app/data \
 -v auth_data:/usr/src/app/.wwebjs_auth \
 -p 3000:3000 whatsapp-bot
docker inspect whatsapp-bot-container