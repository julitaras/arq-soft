#!/bin/sh
set -e

redis-server --appendonly yes --dir /data &

until redis-cli ping 2>/dev/null; do sleep 0.1; done

if [ "$(redis-cli EXISTS state:accounts)" = "0" ]; then
  echo "Seeding Redis..."
  redis-cli SET state:accounts "$(cat /seeds/accounts.json)"
  redis-cli SET state:rates    "$(cat /seeds/rates.json)"
  echo "Seeding complete."
else
  echo "Redis already has data, skipping seed."
fi

wait
