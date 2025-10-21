import { supabase } from '../lib/supabase';

export interface CustomerData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

/**
 * Verifica se um cliente já existe na tabela tickets pelo número de telefone
 * @param phoneNumber - Número de telefone completo (com código do país)
 * @returns Dados do cliente se encontrado, null caso contrário
 */
export async function checkCustomerByPhone(
  phoneNumber: string
): Promise<{ data: CustomerData | null; error: any }> {
  try {
    console.log('checkCustomerByPhone - Input phone:', phoneNumber);

    // Normaliza o número removendo caracteres não numéricos
    const normalizedPhone = phoneNumber.replace(/[^0-9]/g, '');
    console.log('checkCustomerByPhone - Normalized phone:', normalizedPhone);

    // Usa a função do banco que normaliza números de telefone
    const { data, error } = await supabase
      .rpc('get_tickets_by_phone', { p_phone_number: phoneNumber });

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
