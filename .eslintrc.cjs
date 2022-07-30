require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
    // root: true,
    extends: ['../eslint-config-vanarok/index.js'],
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: [
            'tsconfig.json',
            'tsconfig.node.json',
            'tsconfig.nodenext.json',
        ],
        ecmaVersion: 'latest',
    },
};
