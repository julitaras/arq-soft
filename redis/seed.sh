#!/bin/sh
set -e

redis-server --daemonize yes --logfile /tmp/redis-seed.log

until redis-cli ping 2>/dev/null; do sleep 0.1; done

redis-cli SET state:accounts "$(cat /seeds/accounts.json)"
redis-cli SET state:rates    "$(cat /seeds/rates.json)"
redis-cli SET state:log      "$(cat /seeds/log.json)"

redis-cli BGSAVE
sleep 1
redis-cli SHUTDOWN NOSAVE 2>/dev/null || true