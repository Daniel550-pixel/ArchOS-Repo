import os

def secret(name: str, default: str = "") -> str:
    v = os.getenv(name)
    if v:
        return v
    try:  # Prod: Azure Key Vault
        from azure.identity import DefaultAzureCredential
        from azure.keyvault.secrets import SecretClient
        vault_url = os.environ.get("KEY_VAULT_URL")
        if vault_url:
            return SecretClient(vault_url, DefaultAzureCredential()).get_secret(name).value
    except Exception:
        pass
    if default:
        return default
    return os.getenv(name, "")
