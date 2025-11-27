export type PixKeyType = 'telefone' | 'cpf' | 'cnpj' | 'email' | 'aleatoria';

export function formatPixKey(type: PixKeyType, value: string): string {
  const v = value.replace(/\D+/g, '');
  if (type === 'telefone') {
    const d = v.slice(0, 11);
    const p1 = d.slice(0, 2);
    const p2 = d.slice(2, 7);
    const p3 = d.slice(7, 11);
    const sep = d.length > 10 ? '-' : d.length >= 7 ? '-' : '';
    return d.length >= 2 ? `(${p1}) ${p2}${sep}${p3}`.trim() : value;
  }
  if (type === 'cpf') {
    const d = v.slice(0, 11);
    const p1 = d.slice(0, 3);
    const p2 = d.slice(3, 6);
    const p3 = d.slice(6, 9);
    const p4 = d.slice(9, 11);
    return [p1, p2, p3].filter(Boolean).join('.') + (p4 ? `-${p4}` : '');
  }
  if (type === 'cnpj') {
    const d = v.slice(0, 14);
    const p1 = d.slice(0, 2);
    const p2 = d.slice(2, 5);
    const p3 = d.slice(5, 8);
    const p4 = d.slice(8, 12);
    const p5 = d.slice(12, 14);
    const first = [p1, p2, p3].filter(Boolean).join('.');
    const second = p4 ? `/${p4}` : '';
    const third = p5 ? `-${p5}` : '';
    return `${first}${second}${third}`;
  }
  return value;
}

export function isValidPixKey(type: PixKeyType, value: string): boolean {
  if (type === 'telefone') {
    const d = value.replace(/\D+/g, '');
    return d.length === 10 || d.length === 11;
  }
  if (type === 'cpf') {
    const d = value.replace(/\D+/g, '');
    if (d.length !== 11 || /^([0-9])\1{10}$/.test(d)) return false;
    const calc = (sliceLen: number) => {
      let sum = 0;
      for (let i = 0; i < sliceLen; i++) sum += parseInt(d[i], 10) * (sliceLen + 1 - i);
      const r = (sum * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return calc(9) === parseInt(d[9], 10) && calc(10) === parseInt(d[10], 10);
  }
  if (type === 'cnpj') {
    const d = value.replace(/\D+/g, '');
    if (d.length !== 14 || /^([0-9])\1{13}$/.test(d)) return false;
    const calc = (base: number[]) => {
      let sum = 0;
      for (let i = 0; i < base.length; i++) sum += parseInt(d[i], 10) * base[i];
      const r = sum % 11;
      return r < 2 ? 0 : 11 - r;
    };
    const b1 = [5,4,3,2,9,8,7,6,5,4,3,2];
    const b2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
    return calc(b1) === parseInt(d[12], 10) && calc(b2) === parseInt(d[13], 10);
  }
  if (type === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  return value.trim().length > 0;
}
