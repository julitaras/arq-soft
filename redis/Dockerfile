FROM redis:8.6.2-alpine

COPY entrypoint.sh /entrypoint.sh
COPY seeds/accounts.json /seeds/accounts.json
COPY seeds/rates.json     /seeds/rates.json

RUN chmod +x /entrypoint.sh && mkdir -p /data

ENTRYPOINT ["/entrypoint.sh"]
