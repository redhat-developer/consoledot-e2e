# https://github.com/nodejs/docker-node/issues/1734#issuecomment-1274343563
# this ships with node 16.14
FROM mcr.microsoft.com/playwright:v1.20.0-focal
# FROM mcr.microsoft.com/playwright:v1.27.0-focal

ENV CI=true
RUN useradd --no-log-init -rm -d /opt/playwright -s /bin/bash -g root -u 1001 playwright

COPY . /opt/playwright

RUN chown -R playwright:root /opt/playwright && \
    chgrp -R 0 /opt/playwright && \
    chmod -R 775 /opt/playwright && \
    chown -R playwright:root /ms-playwright && \
    chgrp -R 0 /ms-playwright && \
    chmod -R 775 /ms-playwright

USER 1001
WORKDIR /opt/playwright
ENV HOME=/opt/playwright

RUN npx playwright install

ENTRYPOINT [ "npx", "playwright", "test", "--reporter=line" ]
