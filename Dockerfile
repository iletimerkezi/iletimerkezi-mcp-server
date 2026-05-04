FROM node:20-alpine

ENV NODE_ENV=production

RUN npm install -g @iletimerkezi/mcp-server@1.0.0

ENTRYPOINT ["iletimerkezi-mcp-server"]
