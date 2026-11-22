import { User } from '../../src/domain/User.js';

/**
 * Object Mother: fábrica de usuários "prontos" e fixos.
 *
 * Usuários têm poucos arquétipos que quase nunca mudam entre os testes
 * (padrão e premium), então métodos estáticos nomeados são suficientes.
 * Para objetos com muitas variações (ex.: Carrinho), veja CarrinhoBuilder.
 */
export class UserMother {
    static umUsuarioPadrao() {
        return new User(1, 'Maria Padrão', 'padrao@email.com', 'PADRAO');
    }

    static umUsuarioPremium() {
        return new User(2, 'João Premium', 'premium@email.com', 'PREMIUM');
    }
}
