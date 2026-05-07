FROM node:22.22.2-alpine3.22
RUN mkdir /opt/app
WORKDIR /opt/app
COPY * ./
RUN npm install
ENTRYPOINT [ "node", "app.js" ]