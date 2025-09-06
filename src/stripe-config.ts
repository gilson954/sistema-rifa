export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
  minRevenue?: number; // Minimum estimated revenue for this tier
  maxRevenue?: number; // Maximum estimated revenue for this tier
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_Rifaqui_7',
    priceId: 'price_1S3AwiPYLlPdMwZvznZO3bEZ',
    name: 'Rifaqui - Taxa de Publicação (R$ 0-100)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 7.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 0,
    maxRevenue: 100
  },
  {
    id: 'prod_Rifaqui_17',
    priceId: 'price_1S3nhFPYLlPdMwZv4p3CafZN',
    name: 'Rifaqui - Taxa de Publicação (R$ 100-200)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 17.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 100.01,
    maxRevenue: 200
  },
  {
    id: 'prod_Rifaqui_27',
    priceId: 'price_1S3sFlPYLlPdMwZvrFuyetkG',
    name: 'Rifaqui - Taxa de Publicação (R$ 200-400)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 27.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 200.01,
    maxRevenue: 400
  },
  {
    id: 'prod_Rifaqui_37',
    priceId: 'price_1S3sG8PYLlPdMwZvw7DLj5yc',
    name: 'Rifaqui - Taxa de Publicação (R$ 400-701)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 37.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 400.01,
    maxRevenue: 701
  },
  {
    id: 'prod_Rifaqui_47',
    priceId: 'price_PLACEHOLDER_47', // Placeholder for missing Price ID
    name: 'Rifaqui - Taxa de Publicação (R$ 701-1.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 47.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 701.01,
    maxRevenue: 1000
  },
  {
    id: 'prod_Rifaqui_67',
    priceId: 'price_1S3sGVPYLlPdMwZvOFJgsJ70',
    name: 'Rifaqui - Taxa de Publicação (R$ 1.000-2.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 67.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 1000.01,
    maxRevenue: 2000
  },
  {
    id: 'prod_Rifaqui_77',
    priceId: 'price_1S3sGfPYLlPdMwZv5PPGuyfa',
    name: 'Rifaqui - Taxa de Publicação (R$ 2.000-4.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 77.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 2000.01,
    maxRevenue: 4000
  },
  {
    id: 'prod_Rifaqui_127',
    priceId: 'price_1S3sGqPYLlPdMwZvfHwHorbm',
    name: 'Rifaqui - Taxa de Publicação (R$ 4.000-7.100)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 127.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 4000.01,
    maxRevenue: 7100
  },
  {
    id: 'prod_Rifaqui_197',
    priceId: 'price_1S3sGyPYLlPdMwZvRaZ6GPdM',
    name: 'Rifaqui - Taxa de Publicação (R$ 7.100-10.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 197.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 7100.01,
    maxRevenue: 10000
  },
  {
    id: 'prod_Rifaqui_247',
    priceId: 'price_1S3sHBPYLlPdMwZvmdYwtV9r',
    name: 'Rifaqui - Taxa de Publicação (R$ 10.000-20.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 247.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 10000.01,
    maxRevenue: 20000
  },
  {
    id: 'prod_Rifaqui_497',
    priceId: 'price_1S3sHKPYLlPdMwZvMv75xOns',
    name: 'Rifaqui - Taxa de Publicação (R$ 20.000-30.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 497.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 20000.01,
    maxRevenue: 30000
  },
  {
    id: 'prod_Rifaqui_997',
    priceId: 'price_1S3sHSPYLlPdMwZv9w4Ieuec',
    name: 'Rifaqui - Taxa de Publicação (R$ 30.000-50.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 997.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 30000.01,
    maxRevenue: 50000
  },
  {
    id: 'prod_Rifaqui_1497',
    priceId: 'price_PLACEHOLDER_1497', // Placeholder for missing Price ID
    name: 'Rifaqui - Taxa de Publicação (R$ 50.000-70.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 1497.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 50000.01,
    maxRevenue: 70000
  },
  {
    id: 'prod_Rifaqui_1997',
    priceId: 'price_1S3sHnPYLlPdMwZvvNESi00P',
    name: 'Rifaqui - Taxa de Publicação (R$ 70.000-100.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 1997.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 70000.01,
    maxRevenue: 100000
  },
  {
    id: 'prod_Rifaqui_2997',
    priceId: 'price_1S3sHwPYLlPdMwZvsqMRRhEs',
    name: 'Rifaqui - Taxa de Publicação (R$ 100.000-150.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 2997.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 100000.01,
    maxRevenue: 150000
  },
  {
    id: 'prod_Rifaqui_3997',
    priceId: 'price_1S3sI4PYLlPdMwZvhhe0gN2N',
    name: 'Rifaqui - Taxa de Publicação (Acima de R$ 150.000)',
    description: 'Taxa de publicação para ativar sua campanha na plataforma Rifaqui',
    price: 3997.00,
    currency: 'BRL',
    mode: 'payment',
    minRevenue: 150000.01,
    maxRevenue: Infinity // Represents "Acima de"
  }
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};

export const getPublicationProductByRevenue = (estimatedRevenue: number): StripeProduct | undefined => {
  // Filter for products that are payment mode and have revenue ranges
  const publicationProducts = STRIPE_PRODUCTS.filter(p => p.mode === 'payment' && p.minRevenue !== undefined && p.maxRevenue !== undefined);

  // Find the product that matches the estimated revenue range
  for (const product of publicationProducts) {
    if (estimatedRevenue >= product.minRevenue! && estimatedRevenue <= product.maxRevenue!) {
      return product;
    }
  }
  // Fallback for very high revenue if no specific tier is defined (e.g., if maxRevenue is not Infinity for the last tier)
  const highestTier = publicationProducts.reduce((prev, current) => (prev.price > current.price ? prev : current));
  if (estimatedRevenue > highestTier.maxRevenue!) {
    return highestTier;
  }

  return undefined;
};

export const formatPrice = (price: number, currency: string = 'BRL'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price);
};