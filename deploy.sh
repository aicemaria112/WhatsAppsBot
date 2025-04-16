#!/bin/bash
docker build -t whatsapp-bot .
docker run -d --name whatsapp-bot-container -p 3000:3000 whatsapp-bot
docker inspect whatsapp-bot-container