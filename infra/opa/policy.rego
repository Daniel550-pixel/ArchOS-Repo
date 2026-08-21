package archos

default allow = false

# Admins have full access
allow {
    input.role == "admin"
}

# Tenant isolation check
allow {
    input.action == "read"
    input.resource_tenant == input.tenant
}

# Analyst restriction on sensitive components
allow {
    input.action == "read"
    input.role == "analyst"
    input.scale != "COMPONENT"
}
