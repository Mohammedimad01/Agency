#!/usr/bin/env bash
# Loads the automated-test fixture into the LOCAL Supabase database.
# Usage: TEST_USER_PASSWORD='choose-one' npm run db:test-data
# Never point this at production.
set -euo pipefail
: "${TEST_USER_PASSWORD:?Set TEST_USER_PASSWORD to the password the test accounts should use}"
DB_URL="${TEST_DB_URL:-$(npx supabase status -o env 2>/dev/null | sed -n 's/^DB_URL="\(.*\)"$/\1/p')}"
case "$DB_URL" in
  *127.0.0.1*|*localhost*) ;;
  *) echo "Refusing to load test data into a non-local database: ${DB_URL:-<none>}" >&2; exit 1 ;;
esac
psql "$DB_URL" -v ON_ERROR_STOP=1 -q \
  -c "select set_config('fixture.password', '${TEST_USER_PASSWORD//\'/\'\'}', false);" \
  -f "$(dirname "$0")/../tests/fixtures/test-data.sql"
echo "Test data loaded."
