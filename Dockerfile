FROM node:lts

WORKDIR /usr/src/app

RUN apt-get update || : && apt-get install python -y
RUN apt-get install ffmpeg -y

COPY package*.json ./

RUN npm ci

COPY . .
CMD ["./wait-for-it.sh", "localhost:3306"]
CMD [ "node", "index.js" ]