export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'ci', 'style', 'perf']],
    'scope-enum': [1, 'always', ['auth', 'dashboard', 'inventory', 'deployment', 'compliance', 'account-service', 'analytics', 'search', 'infra', 'e2e', 'ui', 'api', 'core']],
    'subject-max-length': [2, 'always', 100],
    'references-empty': [1, 'never'],
  },
};
