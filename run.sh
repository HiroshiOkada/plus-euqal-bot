#!/bin/bash

docker build -t plus-euqal-bot .
docker run -d --name run-plus-euqal-bot plus-euqal-bot
