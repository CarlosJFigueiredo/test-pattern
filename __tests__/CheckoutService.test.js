import { CheckoutService } from '../src/services/CheckoutService.js';
import { Item } from '../src/domain/Item.js';
import { Pedido } from '../src/domain/Pedido.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';
import { UserMother } from './builders/UserMother.js';

// Dummy: o valor do cartão não importa para nenhum cenário; só precisa existir.
const CARTAO_DE_CREDITO = 'CARTAO-DE-TESTE';

// Stub do PedidoRepository: devolve o pedido recebido já com um ID atribuído,
// simulando o banco. Assim o `totalFinal` retornado vem do cálculo do SUT e
// não de um valor fixo escrito no próprio teste.
function criarRepositoryStub(idGerado) {
    return {
        salvar: jest.fn(async (pedido) =>
            new Pedido(idGerado, pedido.carrinho, pedido.totalFinal, pedido.status)
        ),
    };
}

describe('CheckoutService', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('quando o pagamento falha', () => {
        it('deve retornar null', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder().build();
            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ success: false }),
            };
            const repositoryDummy = {}; // nunca deve ser usado
            const emailDummy = {}; // nunca deve ser usado
            const checkoutService = new CheckoutService(gatewayStub, repositoryDummy, emailDummy);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, CARTAO_DE_CREDITO);

            // Assert (verificação de estado)
            expect(pedido).toBeNull();
        });

        it('não deve salvar o pedido nem enviar e-mail', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder().build();
            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ success: false }),
            };
            const repositoryMock = { salvar: jest.fn() };
            const emailMock = { enviarEmail: jest.fn() };
            const checkoutService = new CheckoutService(gatewayStub, repositoryMock, emailMock);

            // Act
            await checkoutService.processarPedido(carrinho, CARTAO_DE_CREDITO);

            // Assert (verificação de comportamento)
            expect(repositoryMock.salvar).not.toHaveBeenCalled();
            expect(emailMock.enviarEmail).not.toHaveBeenCalled();
        });
    });

    describe('quando um cliente padrão finaliza a compra', () => {
        it('deve retornar o pedido salvo com o total sem desconto', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder()
                .comUser(UserMother.umUsuarioPadrao())
                .comItens([new Item('Livro', 60), new Item('Caneta', 40)])
                .build();
            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ success: true }),
            };
            const repositoryStub = criarRepositoryStub(10);
            const emailStub = { enviarEmail: jest.fn().mockResolvedValue() };
            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailStub);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, CARTAO_DE_CREDITO);

            // Assert (verificação de estado)
            expect(pedido).toBeInstanceOf(Pedido);
            expect(pedido.id).toBe(10);
            expect(pedido.totalFinal).toBe(100);
            expect(pedido.status).toBe('PROCESSADO');
            expect(pedido.carrinho).toBe(carrinho);
        });
    });

    describe('quando um cliente Premium finaliza a compra', () => {
        it('deve cobrar no gateway o valor com 10% de desconto', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder()
                .comUser(UserMother.umUsuarioPremium())
                .comItens([new Item('Monitor', 200)])
                .build();
            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ success: true }),
            };
            const repositoryStub = criarRepositoryStub(42);
            const emailStub = { enviarEmail: jest.fn().mockResolvedValue() };
            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailStub);

            // Act
            await checkoutService.processarPedido(carrinho, CARTAO_DE_CREDITO);

            // Assert (verificação de comportamento)
            expect(gatewayStub.cobrar).toHaveBeenCalledTimes(1);
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, CARTAO_DE_CREDITO);
        });

        it('deve enviar um único e-mail de confirmação com os dados corretos', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder()
                .comUser(UserMother.umUsuarioPremium())
                .comItens([new Item('Monitor', 200)])
                .build();
            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ success: true }),
            };
            const repositoryStub = criarRepositoryStub(42);
            const emailMock = { enviarEmail: jest.fn().mockResolvedValue() };
            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailMock);

            // Act
            await checkoutService.processarPedido(carrinho, CARTAO_DE_CREDITO);

            // Assert (verificação de comportamento)
            expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                'premium@email.com',
                'Seu Pedido foi Aprovado!',
                expect.stringContaining('Pedido 42 no valor de R$180')
            );
        });
    });

    describe('quando o envio de e-mail falha', () => {
        it('não deve falhar o checkout e deve retornar o pedido salvo', async () => {
            // Arrange
            jest.spyOn(console, 'error').mockImplementation(() => {}); // silencia o log esperado
            const carrinho = new CarrinhoBuilder().build();
            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ success: true }),
            };
            const repositoryStub = criarRepositoryStub(7);
            const emailStub = {
                enviarEmail: jest.fn().mockRejectedValue(new Error('SMTP indisponível')),
            };
            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailStub);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, CARTAO_DE_CREDITO);

            // Assert (verificação de estado)
            expect(pedido).not.toBeNull();
            expect(pedido.id).toBe(7);
        });
    });
});
