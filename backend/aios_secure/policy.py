"""Provider-independent defensive authorization primitives."""
from dataclasses import dataclass
from enum import Enum

class SecureAction(str, Enum):
    READ = "READ"
    ANALYZE = "ANALYZE"
    MODIFY = "MODIFY"
    EXECUTE = "EXECUTE"

class SecureDecision(str, Enum):
    ALLOW = "ALLOW"
    REVIEW = "REVIEW"
    DENY = "DENY"

@dataclass(frozen=True)
class SecurePolicy:
    allow_read: bool = True
    allow_analyze: bool = True
    require_review_for_modify: bool = True
    require_review_for_execute: bool = True

    def decide(self, action: SecureAction, *, approved: bool = False) -> SecureDecision:
        if action is SecureAction.READ and self.allow_read:
            return SecureDecision.ALLOW
        if action is SecureAction.ANALYZE and self.allow_analyze:
            return SecureDecision.ALLOW
        if action is SecureAction.MODIFY and self.require_review_for_modify and not approved:
            return SecureDecision.REVIEW
        if action is SecureAction.EXECUTE and self.require_review_for_execute and not approved:
            return SecureDecision.REVIEW
        return SecureDecision.ALLOW if approved else SecureDecision.DENY
