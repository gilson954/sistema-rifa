import { supabase } from '../supabase';

export interface CustomDomain {
  id: string;
  domain_name: string;
  campaign_id: string | null;
  user_id: string;
  is_verified: boolean;
  ssl_status: 'pending' | 'active' | 'failed';
  dns_instructions: any;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomDomainInput {
  domain_name: string;
  campaign_id?: string;
}

export interface UpdateCustomDomainInput {
  id: string;
  campaign_id?: string;
  is_verified?: boolean;
  ssl_status?: 'pending' | 'active' | 'failed';
  dns_instructions?: any;
}

export class CustomDomainsAPI {
  /**
   * Cria um novo domínio personalizado
   */
  static async createCustomDomain(
    data: CreateCustomDomainInput, 
    userId: string
  ): Promise<{ data: CustomDomain | null; error: any }> {
    try {
      // Normaliza o domínio (remove protocolo, www, etc.)
      const normalizedDomain = this.normalizeDomain(data.domain_name);

      // Valida o formato do domínio após normalização
      if (!this.isValidDomain(normalizedDomain)) {
        return { 
          data: null, 
          error: { message: 'Formato de domínio inválido' } 
        };
      }

      const domainData = {
        domain_name: normalizedDomain,
        campaign_id: data.campaign_id || null,
        user_id: userId,
        is_verified: false,
        ssl_status: 'pending' as const,
        dns_instructions: this.generateDNSInstructions(normalizedDomain)
      };

      const { data: domain, error } = await supabase
        .from('custom_domains')
        .insert(domainData)
        .select()
        .single();

      return { data: domain, error };
    } catch (error) {
      console.error('Error creating custom domain:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca domínios personalizados do usuário
   */
  static async getUserCustomDomains(userId: string): Promise<{ data: CustomDomain[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('custom_domains')
        .select(`
          *,
          campaigns!inner(id, title, status)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error fetching user custom domains:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca um domínio personalizado por nome
   */
  static async getCustomDomainByName(domainName: string): Promise<{ data: CustomDomain | null; error: any }> {
    try {
      const normalizedDomain = this.normalizeDomain(domainName);
      
      const { data, error } = await supabase
        .from('custom_domains')
        .select('*')
        .eq('domain_name', normalizedDomain)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching custom domain by name:', error);
      return { data: null, error };
    }
  }

  /**
   * Atualiza um domínio personalizado
   */
  static async updateCustomDomain(data: UpdateCustomDomainInput): Promise<{ data: CustomDomain | null; error: any }> {
    try {
      const { id, ...updateData } = data;

      const { data: domain, error } = await supabase
        .from('custom_domains')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      return { data: domain, error };
    } catch (error) {
      console.error('Error updating custom domain:', error);
      return { data: null, error };
    }
  }

  /**
   * Deleta um domínio personalizado
   */
  static async deleteCustomDomain(id: string, userId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('custom_domains')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      console.error('Error deleting custom domain:', error);
      return { error };
    }
  }

  /**
   * Verifica o status DNS de um domínio
   */
  static async verifyDNS(domainId: string): Promise<{ data: { verified: boolean; ssl_ready: boolean } | null; error: any }> {
    try {
      // Esta função faria uma verificação DNS real
      // Por enquanto, simula a verificação
      // Em produção, você usaria uma API de verificação DNS ou um serviço como o Netlify
      
      const { data: domain, error: fetchError } = await supabase
        .from('custom_domains')
        .select('domain_name')
        .eq('id', domainId)
        .single();

      if (fetchError || !domain) {
        return { data: null, error: fetchError || new Error('Domínio não encontrado') };
      }

      // Simula verificação DNS (em produção, fazer verificação real)
      const verified = await this.checkDNSPointing(domain.domain_name);
      
      if (verified) {
        // Atualiza o status no banco
        await this.updateCustomDomain({
          id: domainId,
          is_verified: true,
          ssl_status: 'active'
        });
      }

      return { 
        data: { 
          verified, 
          ssl_ready: verified 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error verifying DNS:', error);
      return { data: null, error };
    }
  }

  /**
   * Valida se um domínio tem formato válido
   */
  private static isValidDomain(domain: string): boolean {
    if (!domain || typeof domain !== 'string') {
      return false;
    }

    // Remove protocolo se presente
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Regex básica para validar domínio
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}\.?)+$/;
    
    return domainRegex.test(cleanDomain) && cleanDomain.length <= 253;
  }

  /**
   * Normaliza um domínio removendo protocolo, www, etc.
   */
  private static normalizeDomain(domain: string): string {
    if (!domain) return '';

    let normalized = domain.toLowerCase().trim();
    
    // Remove protocolo
    normalized = normalized.replace(/^https?:\/\//, '');
    
    // Remove www
    normalized = normalized.replace(/^www\./, '');
    
    // Remove barra final
    normalized = normalized.replace(/\/$/, '');
    
    // Remove porta se presente
    normalized = normalized.replace(/:\d+$/, '');

    return normalized;
  }

  /**
   * Gera instruções DNS para o usuário
   */
  private static generateDNSInstructions(domain: string): any {
    // Em produção, você substituiria 'meuapp.com' pelo seu domínio real
    const targetDomain = 'meuapp.com'; // ou o domínio do seu app no Netlify
    
    return {
      type: 'CNAME',
      name: domain,
      value: targetDomain,
      instructions: {
        pt: `Crie um registro CNAME para ${domain} apontando para ${targetDomain}`,
        en: `Create a CNAME record for ${domain} pointing to ${targetDomain}`
      },
      steps: [
        'Acesse o painel do seu provedor de DNS (ex: GoDaddy, Cloudflare)',
        `Crie um novo registro CNAME`,
        `Nome/Host: ${domain.split('.')[0]} (ou @ se for domínio raiz)`,
        `Valor/Target: ${targetDomain}`,
        'Salve as alterações e aguarde a propagação DNS (pode levar até 24h)'
      ]
    };
  }

  /**
   * Verifica se o DNS está apontando corretamente
   * Em produção, esta função faria uma verificação DNS real
   */
  private static async checkDNSPointing(domain: string): Promise<boolean> {
    try {
      // Esta é uma implementação simulada
      // Em produção, você usaria uma API de verificação DNS
      // ou integraria com o serviço do seu provedor de hospedagem
      
      console.log(`Verificando DNS para ${domain}...`);
      
      // Simula uma verificação que às vezes passa, às vezes falha
      // Em produção, substituir por verificação real
      return Math.random() > 0.3; // 70% de chance de sucesso para demonstração
      
      // Exemplo de verificação real usando fetch (não funcionará no browser devido a CORS):
      // const response = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`);
      // const data = await response.json();
      // return data.Answer && data.Answer.some(record => record.data.includes('meuapp.com'));
      
    } catch (error) {
      console.error('Erro na verificação DNS:', error);
      return false;
    }
  }
}