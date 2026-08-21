#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# 1. Root Certificate Authority
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -subj "/O=ArchOS/CN=ArchOS Dev Root CA" -out ca.crt

# 2. Server Certificate (Broker & Edge NGINX)
openssl genrsa -out server.key 2048
openssl req -new -key server.key -subj "/O=ArchOS/CN=localhost" -out server.csr
printf "[ v3_req ]\nsubjectAltName = DNS:localhost,IP:127.0.0.1\nkeyUsage = digitalSignature,keyEncipherment\nextendedKeyUsage = serverAuth\n" > san.cnf
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 825 -sha256 -extfile san.cnf -extensions v3_req -out server.crt

# 3. Client Certificate (mTLS Gateway)
openssl genrsa -out client.key 2048
openssl req -new -key client.key -subj "/O=ArchOS/CN=telemetry-gw" -out client.csr
printf "[ v3_req ]\nextendedKeyUsage = clientAuth\n" > client.cnf
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 825 -sha256 -extfile client.cnf -extensions v3_req -out client.crt

echo "Generated ArchOS Sovereign Certificates in $(pwd)"
