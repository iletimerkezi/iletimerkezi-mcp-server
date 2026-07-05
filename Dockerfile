FROM node:20-alpine

ENV NODE_ENV=production

ARG MCP_VERSION=1.0.2
RUN npm install -g @iletimerkezi/mcp-server@${MCP_VERSION}

ENTRYPOINT ["iletimerkezi-mcp-server"]
