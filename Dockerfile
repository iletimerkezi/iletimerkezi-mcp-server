FROM node:20-alpine

ENV NODE_ENV=production

RUN npm install -g @iletimerkezi/mcp-server@0.1.0

ENTRYPOINT ["iletimerkezi-mcp-server"]
