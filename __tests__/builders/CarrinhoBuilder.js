import { Carrinho } from '../../src/domain/Carrinho.js';
import { Item } from '../../src/domain/Item.js';
import { UserMother } from './UserMother.js';

/**
 * Data Builder: cria instâncias de Carrinho com valores padrão sensatos
 * e uma API fluente para customizar apenas o que importa em cada teste.
 */
export class CarrinhoBuilder {
    constructor() {
        // Valores padrão: um usuário padrão com 1 item padrão
        this.user = UserMother.umUsuarioPadrao();
        this.itens = [new Item('Produto Padrão', 100)];
    }

    comUser(user) {
        this.user = user;
        return this;
    }

    comItens(itens) {
        this.itens = itens;
        return this;
    }

    comItem(nome, preco) {
        this.itens = [...this.itens, new Item(nome, preco)];
        return this;
    }

    vazio() {
        this.itens = [];
        return this;
    }

    build() {
        return new Carrinho(this.user, [...this.itens]);
    }
}
