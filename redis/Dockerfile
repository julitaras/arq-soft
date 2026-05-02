FROM redis:8.6.2-alpine

COPY seed.sh /seed.sh
COPY seeds/accounts.json /seeds/accounts.json
COPY seeds/rates.json     /seeds/rates.json

RUN chmod +x /seed.sh && \
    mkdir -p /data && \
    /seed.sh