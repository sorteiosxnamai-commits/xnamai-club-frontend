// Hosted payment links supplied by the business. They do not synchronize portal access.
const offers = {
  LAUNCH: {
    name: 'Plano Basic', original: 29999, card: 14997, pix: 19999,
    cardUrl: 'https://www.asaas.com/000/c/dyt747auecm0y89b',
    pixUrl: 'https://www.asaas.com/000/c/o1ec2qy62xy2osok',
  },
  PRIORITY: {
    name: 'Plano Fast Pass', original: 59999, card: 29797, pix: 34999,
    cardUrl: 'https://www.asaas.com/000/c/h0k06a6rr4d00swi',
    pixUrl: 'https://www.asaas.com/000/c/dh2huehi75bvitg5',
  },
};

export function asaasOffer(code: string) {
  return code === 'LAUNCH' || code === 'PRIORITY' ? offers[code] : null;
}
