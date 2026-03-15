export interface BancoInterPagador {
  cpfCnpj: string;
  tipoPessoa: 'FISICA' | 'JURIDICA';
  nome: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  email: string;
  ddd: string;
  telefone: string;
  numero: string;
  complemento: string;
  bairro: string;
}

export interface BancoInterPagadorBase {
  nome: string;
  cpfCnpj: string;
}

export interface BancoInterDesconto {
  quantidadeDias: number;
  taxa: number;
  codigo: 'PERCENTUALDATAINFORMADA' | 'VALORFIXODATAINFORMADA';
}

export interface BancoInterMulta {
  codigo: 'PERCENTUAL' | 'VALORFIXO';
  taxa: string;
}

export interface BancoInterMora {
  codigo: 'TAXAMENSAL' | 'VALORFIXO';
  taxa: string;
}

export interface BancoInterMensagem {
  linha1?: string;
  linha2?: string;
  linha3?: string;
}

export type BancoInterFormaRecebimentoEnum = 'BOLETO' | 'PIX';

export interface BancoInterRequestBoleto {
  seuNumero: string; // <= 15 characters
  valorNominal: string; // [2.5 .. 99999999.99]
  dataVencimento: string; // YYYY-MM-DD
  numDiasAgenda?: string; // [0 .. 60]
  pagador: BancoInterPagador;
  desconto?: BancoInterDesconto;
  multa?: BancoInterMulta;
  mora?: BancoInterMora;
  mensagem?: BancoInterMensagem;
  beneficiarioFinal?: BancoInterPagadorBase;
  formasRecebimento?: BancoInterFormaRecebimentoEnum[]; // Default: ["BOLETO", "PIX"]
}
