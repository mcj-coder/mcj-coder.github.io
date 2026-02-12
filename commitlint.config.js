/**
 * Commitlint configuration for mcj-coder.github.io
 *
 * Enforces Conventional Commits format:
 *   <type>(<scope>): <description>
 *
 * @see https://www.conventionalcommits.org/
 * @see https://commitlint.js.org/
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of allowed values
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'refactor', // Code restructuring
        'test', // Test changes
        'chore', // Build/tooling
        'style', // Formatting
        'perf', // Performance
        'ci', // CI configuration
        'build', // Build system
        'content', // Blog content updates
        'asset', // Image or asset changes
        'revert', // Revert previous
      ],
    ],
    // Type is required
    'type-empty': [2, 'never'],
    // Subject is required
    'subject-empty': [2, 'never'],
    // Subject should not end with period
    'subject-full-stop': [2, 'never', '.'],
    // Subject max length
    'subject-max-length': [2, 'always', 100],
    // Header max length (type + scope + subject)
    'header-max-length': [2, 'always', 120],
    // Body should have blank line before it
    'body-leading-blank': [2, 'always'],
    // Footer should have blank line before it
    'footer-leading-blank': [2, 'always'],
  },
};
