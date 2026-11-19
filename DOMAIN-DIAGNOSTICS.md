# Production domain diagnostics — SELAMCHAT

**Host tested:** `https://selamchat.fun/`
**Tested:** 17 November 2026 (UTC)
**Scope:** Live published host, not the development preview. A post-publication retest will be appended after the SELAMCHAT version is published.

## DNS and edge routing

System DNS and Google Public DNS-over-HTTPS returned these addresses for the exact hostname:

- **A:** `104.19.168.112`, `104.19.169.112` (Google DNS-over-HTTPS TTL 300 seconds).
- **AAAA:** `2606:4700::6813:a970`, `2606:4700::6813:a870` (TTL 300 seconds).
- **CNAME:** the DNS-over-HTTPS CNAME query returned no answer; the hostname resolves directly to Cloudflare edge A/AAAA addresses in the queried view.

The production response includes `Server: cloudflare` and a `CF-Ray` request ID, confirming the request passed through Cloudflare’s edge. Manus reports the domain as public and published, with container deployment status `success` on revision `e5481cef3ca670fdac4f1283642289be0bf4f924` before the new brand/leave fix.

DNS sources queried directly during the test: system resolver (`getent`) and Google Public DNS-over-HTTPS at `https://dns.google/resolve?name=selamchat.fun&type=A`, with `type=AAAA` and `type=CNAME` for the corresponding records.

## TLS certificate and HTTPS

A direct TLS handshake to the exact hostname over IPv4 completed with SNI for `selamchat.fun`:

- TLS 1.3 negotiated with `TLS_AES_256_GCM_SHA384`; certificate verification succeeded.
- TLS 1.2 handshake also succeeded with `Verify return code: 0 (ok)`.
- Leaf certificate subject: `CN=manus.space`; issuer: `WE1` (Google Trust Services).
- SANs: `manus.space` and `*.manus.space`; the wildcard covers `selamchat.fun`.
- Certificate validity: 13 October 2026 through 12 January 2027.

A verified Python TLS client reported `verify: ok`; OpenSSL with `-verify_return_error` completed the handshake and reported success. HTTPS port 443 returned **HTTP 200** on `/` and `/api/health` returned **HTTP 200**.

## HTTP redirect

A request to `http://selamchat.fun/` returned **HTTP 301 Moved Permanently** with `Location: https://selamchat.fun/`.

## IPv6 test limitation

DNS publishes two Cloudflare AAAA records. The current Sandbox host has no IPv6 network route (`curl -6` failed to connect and Python returned `OSError: [Errno 101] Network is unreachable`), so an IPv6 TLS handshake could not be executed from this test environment. This is a limitation of the available test network, not evidence that the published AAAA endpoint is broken. The current external browser/API test can separately verify page access, but does not expose which IP family it used.

## Current conclusion

At the time tested, the published IPv4 TLS endpoint and HTTP-to-HTTPS redirect were functioning, with a valid wildcard certificate and a successful HTTPS response. The reported browser `ERR_SSL_PROTOCOL_ERROR` was **not reproduced** from the direct IPv4 TLS probe or the HTTPS HTTP request. This does not prove every external IPv6 path or every ISP can connect. The exact production hostname and the newly published version must be retested after deployment before calling the issue resolved.
