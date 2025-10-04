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
    // Buscar primeiro ticket com o telefone fornecido
    const { data, error } = await supabase
      .from('tickets')
      .select('customer_name, customer_email, customer_phone')
      .eq('customer_phone', phoneNumber)
      .in('status', ['comprado', 'reservado'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking customer by phone:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error checking customer:', error);
    return { data: null, error };
  }
}
