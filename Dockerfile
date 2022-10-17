FROM mcr.microsoft.com/playwright:v1.27.0-focal

USER root
ENV CI=true

COPY . .

ENTRYPOINT [ "npx", "playwright", "test", "--reporter=line" ]
