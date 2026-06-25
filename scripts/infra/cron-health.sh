#!/bin/bash
# Health check periódico (opcional: crontab -e)
# 0 */6 * * * /root/scripts/infra/cron-health.sh >> /var/log/precivox-health-cron.log 2>&1
exec /root/scripts/infra/precivox-health.sh >> /var/log/precivox-health-cron.log 2>&1
