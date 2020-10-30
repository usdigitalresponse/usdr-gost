module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        "type-enum": [2, 'always', [
            'fix',
            'feat',
            'docs',
            'task',
            'refactor',
            'test',
            'build',
        ]],
    }
}