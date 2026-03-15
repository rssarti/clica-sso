import { useState } from 'react';
import type { Invoice } from '../types/billing';

interface InvoiceViewerProps {
  invoice: Invoice;
  onDownloadPDF: () => void;
  onSendEmail: (email?: string) => void;
  loading?: boolean;
}

const InvoiceViewer = ({ invoice, onDownloadPDF, onSendEmail, loading = false }: InvoiceViewerProps) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState(invoice.payer.email);

  const formatCurrency = (amount: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDocument = (document: string) => {
    if (document.length === 11) {
      // CPF
      return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (document.length === 14) {
      // CNPJ
      return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return document;
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'issued': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'issued': return 'Emitido';
      case 'overdue': return 'Vencido';
      case 'cancelled': return 'Cancelado';
      default: return 'Rascunho';
    }
  };

  return (
    <>
      <div className="bg-white border border-google-gray-300 rounded-lg overflow-hidden">
        {/* Header da Nota Fiscal */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">Nota Fiscal</h1>
              <div className="space-y-1">
                <p className="text-blue-100">Número: {invoice.series}-{invoice.number}</p>
                <p className="text-blue-100">Emissão: {new Date(invoice.issueDate).toLocaleDateString('pt-BR')}</p>
                <p className="text-blue-100">Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                {getStatusLabel(invoice.status)}
              </span>
              <div className="mt-3">
                <p className="text-blue-100 text-sm">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(invoice.totalAmount, invoice.currency)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onDownloadPDF}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              📄 Baixar PDF
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              📧 Enviar por E-mail
            </button>
          </div>
        </div>

        {/* Conteúdo da Nota Fiscal */}
        <div className="p-6">
          {/* Informações das Empresas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Emitente */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                🏢 Emitente
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {invoice.issuer.logo && (
                  <img src={invoice.issuer.logo} alt="Logo" className="h-12 mb-3" />
                )}
                <h4 className="font-semibold text-gray-900">{invoice.issuer.name}</h4>
                <p className="text-gray-600 text-sm">CNPJ: {formatDocument(invoice.issuer.document)}</p>
                <p className="text-gray-600 text-sm">{invoice.issuer.email}</p>
                <div className="mt-2 text-sm text-gray-600">
                  <p>{invoice.issuer.address.street}, {invoice.issuer.address.number}</p>
                  {invoice.issuer.address.complement && <p>{invoice.issuer.address.complement}</p>}
                  <p>{invoice.issuer.address.neighborhood}</p>
                  <p>{invoice.issuer.address.city}/{invoice.issuer.address.state}</p>
                  <p>CEP: {invoice.issuer.address.zipCode}</p>
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                👤 Cliente
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">{invoice.payer.name}</h4>
                <p className="text-gray-600 text-sm">
                  {invoice.payer.document.length === 11 ? 'CPF' : 'CNPJ'}: {formatDocument(invoice.payer.document)}
                </p>
                <p className="text-gray-600 text-sm">{invoice.payer.email}</p>
                <div className="mt-2 text-sm text-gray-600">
                  <p>{invoice.payer.address.street}, {invoice.payer.address.number}</p>
                  {invoice.payer.address.complement && <p>{invoice.payer.address.complement}</p>}
                  <p>{invoice.payer.address.neighborhood}</p>
                  <p>{invoice.payer.address.city}/{invoice.payer.address.state}</p>
                  <p>CEP: {invoice.payer.address.zipCode}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Itens da Nota Fiscal */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              📋 Itens
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Descrição</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Qtd</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Valor Unit.</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.totalPrice, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Impostos */}
            {invoice.taxes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  💰 Impostos
                </h3>
                <div className="space-y-2">
                  {invoice.taxes.map((tax, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{tax.type} ({tax.rate}%)</span>
                      <span className="text-gray-900 font-medium">
                        {formatCurrency(tax.amount, invoice.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totais */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                🧮 Resumo
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900 font-medium">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </span>
                </div>
                {invoice.taxes.map((tax, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{tax.type}</span>
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(tax.amount, invoice.currency)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-blue-600">
                      {formatCurrency(invoice.totalAmount, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          {invoice.notes && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                📝 Observações
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Envio por E-mail */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Enviar Nota Fiscal por E-mail</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail de destino
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onSendEmail(emailAddress);
                  setShowEmailModal(false);
                }}
                disabled={loading || !emailAddress}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InvoiceViewer;
