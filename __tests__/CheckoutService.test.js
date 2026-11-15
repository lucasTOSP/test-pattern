import { CheckoutService } from '../src/services/CheckoutService.js';
import { Item } from '../src/domain/Item.js';
import { Pedido } from '../src/domain/Pedido.js';
import { UserMother } from './builders/UserMother.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';

describe('CheckoutService', () => {
    const cartaoCredito = { numero: '4111111111111111', cvv: '123' };

    describe('quando o pagamento falha', () => {
        it('deve retornar null e não salvar o pedido nem enviar e-mail', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder().build();

            // Stub: apenas fornece uma resposta pré-definida
            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: false }) };

            // Dummies: dependências que não devem ser usadas neste cenário
            const repositoryDummy = { salvar: jest.fn() };
            const emailDummy = { enviarEmail: jest.fn() };

            const checkoutService = new CheckoutService(gatewayStub, repositoryDummy, emailDummy);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, cartaoCredito);

            // Assert (Verificação de Estado)
            expect(pedido).toBeNull();
            expect(repositoryDummy.salvar).not.toHaveBeenCalled();
            expect(emailDummy.enviarEmail).not.toHaveBeenCalled();
        });
    });

    describe('quando um cliente Premium finaliza a compra', () => {
        it('deve cobrar com 10% de desconto e enviar e-mail de confirmação', async () => {
            // Arrange
            const usuarioPremium = UserMother.umUsuarioPremium();
            const carrinho = new CarrinhoBuilder()
                .comUser(usuarioPremium)
                .comItens([new Item('Fone de Ouvido', 150), new Item('Capa de Celular', 50)]) // R$ 200,00
                .build();

            // Stubs: controlam o fluxo devolvendo respostas pré-definidas
            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const pedidoSalvo = new Pedido(123, carrinho, 180, 'PROCESSADO');
            const repositoryStub = { salvar: jest.fn().mockResolvedValue(pedidoSalvo) };

            // Mock: queremos verificar SE foi chamado e COM QUAIS argumentos
            const emailMock = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailMock);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, cartaoCredito);

            // Assert (Verificação de Comportamento)
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, cartaoCredito);
            expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                'premium@email.com',
                'Seu Pedido foi Aprovado!',
                'Pedido 123 no valor de R$180'
            );
            expect(pedido).toBe(pedidoSalvo);
        });
    });

    describe('quando um cliente Padrão finaliza a compra', () => {
        it('deve cobrar o valor total sem desconto', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder()
                .comUser(UserMother.umUsuarioPadrao())
                .comItens([new Item('Teclado', 200)])
                .build();

            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const repositoryStub = {
                salvar: jest.fn().mockResolvedValue(new Pedido(1, carrinho, 200, 'PROCESSADO')),
            };
            const emailMock = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailMock);

            // Act
            await checkoutService.processarPedido(carrinho, cartaoCredito);

            // Assert
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(200, cartaoCredito);
            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                'padrao@email.com',
                'Seu Pedido foi Aprovado!',
                expect.any(String)
            );
        });
    });

    describe('quando o envio de e-mail falha', () => {
        it('não deve falhar o checkout e deve retornar o pedido salvo', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder().build();
            const pedidoSalvo = new Pedido(7, carrinho, 100, 'PROCESSADO');

            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const repositoryStub = { salvar: jest.fn().mockResolvedValue(pedidoSalvo) };
            const emailStub = {
                enviarEmail: jest.fn().mockRejectedValue(new Error('SMTP indisponível')),
            };
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailStub);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, cartaoCredito);

            // Assert
            expect(pedido).toBe(pedidoSalvo);
            consoleSpy.mockRestore();
        });
    });
});
