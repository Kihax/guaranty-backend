FROM node:20-alpine

WORKDIR /home/node/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN npm run build

EXPOSE 3333

CMD ["node", "build/server.js"]