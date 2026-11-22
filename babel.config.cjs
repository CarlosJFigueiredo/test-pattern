// Necessário porque o package.json usa "type": "module" e o Jest precisa
// transformar a sintaxe ESM (import/export) antes de executar os testes.
module.exports = {
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
