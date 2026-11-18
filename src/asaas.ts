// Hosted payment links supplied by the business. They do not synchronize portal access.
const offers = {
  LAUNCH: {
    name: 'Sócio Xnamai', original: 29999, card: 14997, pix: 19999, boleto: 19999,
    cardUrl: 'https://www.asaas.com/000/c/dyt747auecm0y89b',
    pixUrl: 'https://www.asaas.com/000/c/o1ec2qy62xy2osok',
    boletoUrl: 'https://www.asaas.com/000/c/o1ec2qy62xy2osok',
  },
  PRIORITY: {
    name: 'Sócio Xnamai Prime', original: 59999, card: 29797, pix: 34999, boleto: 34999,
    cardUrl: 'https://www.asaas.com/000/c/h0k06a6rr4d00swi',
    pixUrl: 'https://www.asaas.com/000/c/dh2huehi75bvitg5',
    boletoUrl: 'https://www.asaas.com/000/c/dh2huehi75bvitg5',
  },
};

const tironiTechPixUrl = {
  LAUNCH: 'https://www.asaas.com/000/c/abss5rfg4vf41yac',
  PRIORITY: 'https://www.asaas.com/000/c/c63rxqscnk2q6q6n',
};

/** PIX stays on the XNaMai Asaas account. Tironi Tech is not used for checkout. */
export const pixTironiTechAsaas = false;

export function asaasOffer(code: string) {
  if (code !== 'LAUNCH' && code !== 'PRIORITY') return null;
  const offer = offers[code];
  if (!pixTironiTechAsaas) return offer;
  return { ...offer, pixUrl: tironiTechPixUrl[code] };
}
