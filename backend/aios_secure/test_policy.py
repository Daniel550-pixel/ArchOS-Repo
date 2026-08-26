from .policy import SecureAction, SecureDecision, SecurePolicy


def test_read_and_analysis_are_allowed():
    policy = SecurePolicy()
    assert policy.decide(SecureAction.READ) is SecureDecision.ALLOW
    assert policy.decide(SecureAction.ANALYZE) is SecureDecision.ALLOW


def test_consequential_actions_require_explicit_approval():
    policy = SecurePolicy()
    assert policy.decide(SecureAction.MODIFY) is SecureDecision.REVIEW
    assert policy.decide(SecureAction.EXECUTE) is SecureDecision.REVIEW
    assert policy.decide(SecureAction.EXECUTE, approved=True) is SecureDecision.ALLOW
