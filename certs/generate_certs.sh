#!/bin/bash
# certs/generate_certs.sh
# Generate Sovereign TLS 1.3 ECDSA/RSA Certificates for Mosquitto WSS (Port 8884)

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "=== [ArchOS] Generating Sovereign TLS 1.3 Certificates ==="

# 1. Generate Root CA Key and Certificate
if [ ! -f "ca.key" ]; then
  openssl ecparam -name prime256v1 -genkey -noout -out ca.key
  openssl req -new -x509 -days 1095 -key ca.key -out ca.crt \
    -subj "/C=AE/ST=Dubai/L=Downtown Dubai/O=ArchOS Sovereign Enclave Authority/CN=ArchOS Sovereign Root CA G4"
  echo "✓ Created ca.crt & ca.key"
fi

# 2. Generate Server Key & CSR
if [ ! -f "server.key" ]; then
  openssl ecparam -name prime256v1 -genkey -noout -out server.key
  openssl req -new -key server.key -out server.csr \
    -subj "/C=AE/ST=Dubai/L=Downtown Dubai/O=ArchOS Telemetry Systems/CN=broker.archos.ae"

  # SAN Configuration for localhost and production domains
  cat > server_ext.cnf <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = broker.archos.ae
DNS.2 = localhost
DNS.3 = telemetry.b4471.archos.ae
IP.1 = 127.0.0.1
IP.2 = 0.0.0.0
EOF

  openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out server.crt -days 730 -extfile server_ext.cnf

  rm -f server.csr server_ext.cnf
  echo "✓ Created server.crt & server.key (SAN: localhost, 127.0.0.1, broker.archos.ae)"
fi

echo "=== [ArchOS] Sovereign TLS Certificates Ready in $DIR ==="
