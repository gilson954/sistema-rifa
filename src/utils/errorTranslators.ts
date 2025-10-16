// src/utils/errorTranslators.ts

export const translateAuthError = (errorMessage: string): string => {
  switch (errorMessage) {
    case 'Invalid login credentials':
      return 'Credenciais de login inválidas. Verifique seu e-mail e senha.';
    case 'User not found':
      return 'Usuário não encontrado. Verifique seu e-mail.';
    case 'Account not confirmed':
      return 'Conta não confirmada. Verifique seu e-mail para ativar sua conta.';
    case 'Network error':
      return 'Erro de rede. Verifique sua conexão e tente novamente.';
    case 'Email link is invalid or has expired':
      return 'O link de e-mail é inválido ou expirou. Solicite um novo link.';
    case 'Password should be at least 6 characters':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'User already registered':
      return 'Este e-mail já está registado. Tente fazer login ou recuperar a senha.';
    case 'Email not confirmed':
      return 'E-mail não confirmado. Verifique sua caixa de entrada.';
    case 'For security purposes, you can only request a password reset once every 60 seconds.':
      return 'Por motivos de segurança, você só pode solicitar a redefinição de senha uma vez a cada 60 segundos.';
    case 'Unable to send confirmation email':
      return 'Não foi possível enviar o e-mail de confirmação. Tente novamente mais tarde.';
    case 'Email already registered': // Pode vir de algumas APIs
      return 'Este e-mail já está registado.';
    case 'User has active campaigns': // Erro da função Edge delete-user-account
      return 'Não é possível excluir conta com campanhas ativas ou em rascunho.';
    case 'Product not found': // Erro da API Stripe
      return 'Produto não encontrado.';
    case 'Checkout creation failed': // Erro da API Stripe
      return 'Falha ao criar sessão de pagamento.';
    case 'URL de checkout não encontrada': // Erro da API Stripe
      return 'URL de checkout não encontrada.';
    case 'Campaign not found': // Erro da API Campaign
      return 'Campanha não encontrada.';
    case 'Campaign publication fee already paid': // Erro da API Campaign
      return 'A taxa de publicação da campanha já foi paga.';
    case 'Internal server error': // Erro genérico de funções Edge
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    // Adicione mais casos conforme identificar novas mensagens em inglês
    default:
      return `Ocorreu um erro: ${errorMessage}. Tente novamente.`;
  }
};
