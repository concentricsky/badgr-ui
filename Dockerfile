FROM node:10

WORKDIR /usr/ui

RUN git clone https://github.com/concentricsky/badgr-ui.git .

RUN npm install

COPY ./config.js ./src/config.js

EXPOSE 4200

CMD ["npm", "run", "start-docker"]