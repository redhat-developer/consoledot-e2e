# https://github.com/nodejs/docker-node/issues/1734#issuecomment-1274343563
# this ships with node 16.14
FROM mcr.microsoft.com/playwright:v1.30.0-focal
# FROM mcr.microsoft.com/playwright:v1.27.0-focal

RUN curl -sL https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 -o /usr/local/bin/jq && chmod a+x /usr/local/bin/jq

ENV CI=true
RUN useradd --no-log-init -rm -d /tmp/playwright -s /bin/bash -g root -o -u 1000 playwright

COPY . /tmp/playwright

RUN chown -R playwright:root /tmp/playwright && \
    chgrp -R 0 /tmp/playwright && \
    chmod -R 775 /tmp/playwright && \
    chown -R playwright:root /ms-playwright && \
    chgrp -R 0 /ms-playwright && \
    chmod -R 775 /ms-playwright

USER 1000
WORKDIR /tmp/playwright
ENV HOME=/tmp/playwright

RUN npm ci
RUN npx playwright install

ENTRYPOINT [ "npx", "playwright", "test", "--reporter=line" ]
