import { User } from '../../src/domain/User.js';

/**
 * Object Mother: fornece instâncias fixas e prontas de User.
 * Útil porque os tipos de usuário são simples e raramente mudam entre os testes.
 */
export class UserMother {
    static umUsuarioPadrao() {
        return new User(1, 'Usuário Padrão', 'padrao@email.com', 'PADRAO');
    }

    static umUsuarioPremium() {
        return new User(2, 'Usuário Premium', 'premium@email.com', 'PREMIUM');
    }
}
