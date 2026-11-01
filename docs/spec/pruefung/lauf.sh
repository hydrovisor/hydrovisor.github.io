#!/usr/bin/env bash
# Prüflauf des Datenmodell-Entwurfs gegen PostgreSQL 17 in Docker (06_tests.md Abschnitt 9).
# Aufruf aus dem Repository-Wurzelverzeichnis: bash docs/spec/pruefung/lauf.sh [skript.sql ...]
# Jedes Skript läuft in einer eigenen, frischen Datenbank (stub.sql, 02_datenmodell.sql, rechte.sql).
set -euo pipefail
export MSYS_NO_PATHCONV=1
cd "$(dirname "$0")"
c=hv-pg
if ! docker ps --format '{{.Names}}' | grep -qx "$c"; then
  docker run -d --name "$c" -e POSTGRES_PASSWORD=test postgres:17-alpine >/dev/null
  until docker exec "$c" pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
fi
skripte=("$@")
[ ${#skripte[@]} -eq 0 ] && skripte=(smoke.sql smoke2.sql smoke3.sql)
for f in stub.sql rechte.sql ../02_datenmodell.sql "${skripte[@]}"; do docker cp "$f" "$c:/tmp/$(basename "$f")"; done
for s in "${skripte[@]}"; do
  db="p_$(basename "$s" .sql)"
  docker exec "$c" psql -U postgres -qtAc "drop database if exists $db" >/dev/null
  docker exec "$c" psql -U postgres -qtAc "create database $db" >/dev/null
  for f in stub.sql 02_datenmodell.sql rechte.sql; do
    docker exec "$c" psql -U postgres -d "$db" -v ON_ERROR_STOP=1 -q -f "/tmp/$f" >/dev/null
  done
  echo "=== $s"
  docker exec "$c" psql -U postgres -d "$db" -v ON_ERROR_STOP=1 -qtA -F ' | ' -f "/tmp/$(basename "$s")" 2>&1
  if [ "$(basename "$s")" = smoke3.sql ]; then
    # C11: Datendump als backup_leser mit Zeilensicherheit (Rückfall ohne BYPASSRLS)
    tabellen=$(docker exec "$c" psql -U postgres -d "$db" -qtAc "select count(*) from pg_tables where schemaname = 'public'")
    kopien=$(docker exec "$c" pg_dump -U backup_leser -d "$db" -n public -a --enable-row-security 2>/dev/null | grep -c '^COPY public\.')
    echo "C11 pg_dump --enable-row-security als backup_leser: $kopien von $tabellen Tabellen"
    [ "$kopien" = "$tabellen" ]
  fi
done
