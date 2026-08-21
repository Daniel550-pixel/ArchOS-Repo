terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
  }
}

provider "azurerm" {
  features {}
}

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "archos" {
  name     = "archos-rg"
  location = "uaenorth"
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = "archos-aks"
  location            = azurerm_resource_group.archos.location
  resource_group_name = azurerm_resource_group.archos.name
  dns_prefix          = "archos"

  default_node_pool {
    name       = "system"
    node_count = 3
    vm_size    = "Standard_D4s_v3"
  }

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_postgresql_flexible_server" "db" {
  name                   = "archos-db"
  location               = azurerm_resource_group.archos.location
  resource_group_name    = azurerm_resource_group.archos.name
  version                = "15"
  sku_name               = "GP_Standard_D4s_v3"
  administrator_login    = "archosadmin"
  administrator_password = "SecureSovereignPassword2026!"
}

resource "azurerm_key_vault" "vault" {
  name                = "archos-vault"
  location            = azurerm_resource_group.archos.location
  resource_group_name = azurerm_resource_group.archos.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "premium"
}
