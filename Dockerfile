FROM node:alpine

RUN mkdir /badgr && \
    adduser -D -h /badgr badgr && \
    chown -R badgr /badgr && \
    apk update && \
    apk add nginx

WORKDIR /badgr

ADD package.json .
ADD package-lock.json .

RUN npm install

ENTRYPOINT docker/entrypoint.sh

ADD . .

RUN touch nginx.conf && \
    mkdir dist && \
    chown -R badgr src/environments/ nginx.conf dist && \
    rm -f /var/lib/nginx/nginx.conf && \
    ln -sT /badgr/nginx.conf /var/lib/nginx/nginx.conf && \
    mkdir -p /run/nginx && \
    touch /run/nginx/nginx.pid

# TODO: use a user to execute the command
# USER badgr


