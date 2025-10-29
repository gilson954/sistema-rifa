import { supabase } from '../lib/supabase';

export interface CustomerData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

/**
 * Verifica se um cliente já existe na tabela tickets pelo número de telefone
 * 
 * ✅ CORREÇÃO APLICADA: Remove normalização duplicada de phoneNumber
 * O número já deve chegar normalizado dos componentes de UI (ReservationModal)
 * A função RPC 'get_tickets_by_phone' do banco de dados já faz a normalização
 * interna para comparação, então não é necessário normalizar aqui.
 * 
 * @param phoneNumber - Número de telefone JÁ NORMALIZADO (formato: +[código][número])
 * @returns Dados do cliente se encontrado, null caso contrário
 */
export async function checkCustomerByPhone(
  phoneNumber: string
): Promise<{ data: CustomerData | null; error: any }> {
  try {
    console.log('checkCustomerByPhone - Input phone (already normalized):', phoneNumber);

    // ✅ CORREÇÃO: NÃO normaliza novamente - assume que o número já vem normalizado
    // O componente ReservationModal já chama formatPhoneNumber antes de chamar esta função
    // A função RPC do banco de dados faz a normalização interna para comparação
    
    // Usa a função do banco que normaliza números de telefone internamente
    const { data, error } = await supabase
      .rpc('get_tickets_by_phone', { 
        p_phone_number: phoneNumber // ✅ Usa diretamente, já normalizado
      });

    if (error) {
      console.error('Error checking customer by phone:', error);
      return { data: null, error };
    }

    console.log('checkCustomerByPhone - Results:', data);

    // Retorna o primeiro resultado (mais recente)
    if (data && data.length > 0) {
      const firstTicket = data[0];
      return {
        data: {
          customer_name: firstTicket.customer_name,
          customer_email: firstTicket.customer_email,
          customer_phone: firstTicket.customer_phone
        },
        error: null
      };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Unexpected error checking customer:', error);
    return { data: null, error };
  }
}