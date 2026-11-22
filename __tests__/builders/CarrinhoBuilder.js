import { Carrinho } from '../../src/domain/Carrinho.js';
import { Item } from '../../src/domain/Item.js';
import { UserMother } from './UserMother.js';

/**
 * Data Builder: monta um Carrinho de forma fluente.
 *
 * Por padrão constrói um carrinho válido (usuário padrão + 1 item de R$ 100,00).
 * Cada teste só declara o que é relevante para o seu cenário, por exemplo:
 *
 *   new CarrinhoBuilder().comUser(UserMother.umUsuarioPremium()).build();
 */
export class CarrinhoBuilder {
    constructor() {
        this.user = UserMother.umUsuarioPadrao();
        this.itens = [new Item('Item Padrão', 100)];
    }

    comUser(user) {
        this.user = user;
        return this;
    }

    comItens(itens) {
        this.itens = itens;
        return this;
    }

    vazio() {
        this.itens = [];
        return this;
    }

    build() {
        // Copia o array para que builds diferentes não compartilhem estado.
        return new Carrinho(this.user, [...this.itens]);
    }
}
