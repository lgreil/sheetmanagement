#!/usr/bin/env bash
# Checks a deployment from the outside: is it up, does sign-in start, are pages protected?
# Usage: smoke-test.sh https://noten.example.workers.dev
set -euo pipefail

BASE="${1%/}"
failures=0

# A new version can take a few seconds to reach every Cloudflare location.
for attempt in $(seq 1 10); do
	if [ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/health")" = "200" ]; then break; fi
	echo "Waiting for $BASE/api/health (attempt $attempt)…"
	sleep 3
done

check() {
	local name="$1" path="$2" want_status="$3" want_location="${4:-}"
	local out status location
	out=$(curl -s -o /dev/null -m 30 -w '%{http_code} %{redirect_url}' "$BASE$path")
	status="${out%% *}"
	location="${out#* }"
	if [ "$status" != "$want_status" ] || { [ -n "$want_location" ] && [[ "$location" != "$want_location"* ]]; }; then
		echo "FAIL  $name: $path → $status ${location:-}(expected $want_status ${want_location})"
		failures=$((failures + 1))
	else
		echo "ok    $name: $path → $status"
	fi
}

check "health"           /api/health          200
check "sign-in page"     /anmelden            200
check "privacy notice"   /datenschutz         200
check "terms of use"     /nutzungsbedingungen 200
check "pages need login" /stuecke             303 "$BASE/anmelden"
check "Google sign-in"   /auth/login          303 "https://accounts.google.com/"

if [ "$failures" -gt 0 ]; then
	echo "$failures check(s) failed"
	exit 1
fi
echo "All checks passed for $BASE"
