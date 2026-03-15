import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import { connectedAppsService } from '../services/connectedAppsService';
import { profileService } from '../services/profileService';
import type { UserProfile } from '../types/profile';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import Icon from '../components/Icon';
import { useSocketContext } from '../hooks/useSocketContext';
import BoletoBarcode from '../components/BoletoBarcode';

interface PaymentData {
  paymentId?: number;
  qrCode?: string;
  qrCodeBase64?: string;
  pixCode?: string;
  boletoCode?: string;
  boletoBarCode?: string;
  boletoBarcode?: string; // Alias para compatibilidade
  boletoUrl?: string;
  codigoSolicitacao?: string;
  amount: number;
  dueDate?: string;
  planName?: string;
  contractId?: string;
  status?: string;
  qrCodeImage?: string;
  boletoQrCodeImage?: string;
}

interface PlanData {
  id: number;
  name: string;
  price: number;
  billingCycle: string;
}

interface ProductData {
  id: number;
  name: string;
}

interface PixStatusData {
  status: 'processing' | 'success' | 'error';
  message: string;
  contractId: number;
  qrCode?: string;
  txid?: string;
  amount?: number;
  expiresIn?: number;
}

interface BoletoStatusData {
  contractId: number;
  paymentId: number;
  boleto: {
    nossoNumero: string;
    codigoBarras: string;
    linhaDigitavel: string;
    pixCopiaECola: string;
    codigoSolicitacao: string;
    boletoUrl: string;
  };
}

interface LocationState {
  plan?: PlanData;
  product?: ProductData;
}

const PaymentConfirmation = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocketContext();
  
  // Dados passados pela navegação
  const { plan, product } = (location.state as LocationState) || {};

  // Função para calcular módulo 10 (usado na linha digitável)
  const calculateMod10 = useCallback((sequence: string): string => {
    const digits = sequence.split('').reverse();
    let sum = 0;
    
    for (let i = 0; i < digits.length; i++) {
      let digit = parseInt(digits[i]) * ((i % 2) + 1);
      if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10);
      sum += digit;
    }
    
    const remainder = sum % 10;
    return remainder === 0 ? '0' : (10 - remainder).toString();
  }, []);

  // Função para calcular módulo 11 (usado no código de barras)
  const calculateMod11 = useCallback((sequence: string): string => {
    const digits = sequence.split('').reverse();
    let sum = 0;
    let multiplier = 2;
    
    for (let i = 0; i < digits.length; i++) {
      sum += parseInt(digits[i]) * multiplier;
      multiplier = multiplier === 9 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const dv = 11 - remainder;
    
    if (dv === 0 || dv === 10 || dv === 11) return '1';
    return dv.toString();
  }, []);

  // Função para gerar código de barras no formato padrão brasileiro
  const generateBankBarcode = useCallback((amount: number, dueDate?: string): string => {
    const banco = "033"; // Santander (exemplo)
    const moeda = "9"; // Real
    const fatorVencimento = dueDate ? 
      Math.floor((new Date(dueDate).getTime() - new Date('1997-10-07').getTime()) / (1000 * 60 * 60 * 24)) : 
      Math.floor((new Date().getTime() - new Date('1997-10-07').getTime()) / (1000 * 60 * 60 * 24)) + 30;
    const valor = Math.floor(amount * 100).toString().padStart(10, '0');
    const agencia = "0001";
    const conta = "000000123";
    const nossoNumero = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    
    // Formato: BBBBMFVVVVVVVVVVEEEEEEEEEEEEEEEEEEEEEEEEEE
    // BBBB = Banco, M = Moeda, F = Fator vencimento, VVVVVVVVVV = Valor, EEEE... = Campo livre
    const campoLivre = `${agencia}${conta}${nossoNumero}00`;
    const codigoSemDV = `${banco}${moeda}${fatorVencimento.toString().padStart(4, '0')}${valor}${campoLivre}`;
    
    // Cálculo do dígito verificador (módulo 11)
    const digitoVerificador = calculateMod11(codigoSemDV.substring(0, 4) + codigoSemDV.substring(5));
    
    return `${banco}${moeda}${digitoVerificador}${fatorVencimento.toString().padStart(4, '0')}${valor}${campoLivre}`;
  }, [calculateMod11]);

  // Função para gerar linha digitável a partir do código de barras
  const generateDigitableLine = useCallback((barcode: string): string => {
    if (barcode.length !== 44) return '';
    
    // Campo 1: posições 0-3, 32-42 do código de barras
    const campo1Codigo = barcode.substring(0, 4) + barcode.substring(32, 37);
    const campo1DV = calculateMod10(campo1Codigo);
    const campo1 = `${campo1Codigo.substring(0, 5)}.${campo1Codigo.substring(5)}${campo1DV}`;
    
    // Campo 2: posições 37-47 do código de barras
    const campo2Codigo = barcode.substring(37, 47);
    const campo2DV = calculateMod10(campo2Codigo);
    const campo2 = `${campo2Codigo.substring(0, 5)}.${campo2Codigo.substring(5)}${campo2DV}`;
    
    // Campo 3: posições 47-57 do código de barras (se existir)
    let campo3 = '';
    if (barcode.length > 47) {
      const campo3Codigo = barcode.substring(47, Math.min(57, barcode.length));
      if (campo3Codigo.length >= 10) {
        const campo3DV = calculateMod10(campo3Codigo);
        campo3 = `${campo3Codigo.substring(0, 5)}.${campo3Codigo.substring(5)}${campo3DV}`;
      }
    }
    
    // Campo 4: dígito verificador (posição 4 do código de barras)
    const campo4 = barcode.substring(4, 5);
    
    // Campo 5: fator de vencimento + valor (posições 5-19 do código de barras)
    const campo5 = barcode.substring(5, 19);
    
    return `${campo1} ${campo2} ${campo3 ? campo3 + ' ' : ''}${campo4} ${campo5}`.trim();
  }, [calculateMod10]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'boleto' | 'pix' | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [boletoQrCodeDataUrl, setBoletoQrCodeDataUrl] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'payment'>('select');
  const [pixGenerationStatus, setPixGenerationStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [pixStatusMessage, setPixStatusMessage] = useState<string>('');
  const [isExistingPayment, setIsExistingPayment] = useState(false);
  // const [checkingPendingPayments, setCheckingPendingPayments] = useState(false);
  // const [hasPendingPayments, setHasPendingPayments] = useState(false);

  const generateQRCodeImage = useCallback(async (qrCodeText: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(qrCodeText, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  }, []);

  const generateBoletoQRCodeImage = useCallback(async (qrCodeText: string) => {
    try {
      if (!qrCodeText || qrCodeText.trim() === '') {
        return;
      }
      
      const dataUrl = await QRCode.toDataURL(qrCodeText, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setBoletoQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Erro ao gerar QR Code do boleto:', error);
    }
  }, []);

  const checkForPendingPayments = useCallback(async () => {
    if (!contractId) return;
    
    try {
      const response = await connectedAppsService.getPendingPayments(parseInt(contractId));
      
      if (response.success && response.hasPendingPayments) {
        setIsExistingPayment(true);
        const oldestPayment = response.oldestPayment;
        
        if (oldestPayment) {
          console.log('💳 Pagamento pendente encontrado:', {
            id: oldestPayment.id,
            method: oldestPayment.method,
            amount: oldestPayment.amount,
            hasPixCode: !!oldestPayment.pixQrCode,
            hasBoletoCode: !!oldestPayment.boletoBarcode
          });
          
          // Carregar dados do pagamento pendente mais antigo
          let boletoBarCode = oldestPayment.boletoBarcode;
          let boletoCode = oldestPayment.metadata?.boletoCode;
          
          // Verificar se existem dados do banco_inter nos metadados
          if (oldestPayment.metadata?.banco_inter?.boletoDetails?.boleto) {
            const boletoDetails = oldestPayment.metadata.banco_inter.boletoDetails.boleto;
            boletoBarCode = boletoDetails.codigoBarras || boletoBarCode;
            boletoCode = boletoDetails.linhaDigitavel || boletoCode;
            console.log('🏦 Dados do banco_inter encontrados:', { 
              codigoBarras: boletoDetails.codigoBarras, 
              linhaDigitavel: boletoDetails.linhaDigitavel 
            });
          } else {
            // Fallback para metadados simples
            boletoBarCode = boletoBarCode || oldestPayment.metadata?.codigoBarras;
            boletoCode = boletoCode || oldestPayment.metadata?.linhaDigitavel;
          }
          
          // Se não tiver códigos válidos e for boleto, gerar códigos no formato padrão
          if (oldestPayment.method === 'boleto' && (!boletoBarCode || !boletoCode)) {
            console.log('🏦 Gerando códigos de boleto no formato padrão brasileiro...');
            boletoBarCode = generateBankBarcode(oldestPayment.amount, oldestPayment.dueDate);
            boletoCode = generateDigitableLine(boletoBarCode);
            console.log('📄 Códigos gerados:', { boletoBarCode, boletoCode });
          }
          
          const paymentData: PaymentData = {
            amount: oldestPayment.amount,
            boletoCode: boletoCode,
            boletoBarCode: boletoBarCode,
            boletoUrl: oldestPayment.boletoUrl,
            codigoSolicitacao: oldestPayment.externalId || oldestPayment.metadata?.codigoSolicitacao || oldestPayment.metadata?.banco_inter?.codigoSolicitacao,
            pixCode: oldestPayment.pixQrCode || oldestPayment.metadata?.pixCopiaECola || oldestPayment.metadata?.banco_inter?.boletoDetails?.pix?.pixCopiaECola,
            qrCode: oldestPayment.pixQrCode || oldestPayment.metadata?.pixCopiaECola || oldestPayment.metadata?.banco_inter?.boletoDetails?.pix?.pixCopiaECola,
            dueDate: oldestPayment.dueDate,
          };
          
          setPaymentData(paymentData);
          
          // Determinar o método de pagamento baseado no método definido no backend
          console.log('🎯 Determinando método de pagamento:', oldestPayment.method);
          
          if (oldestPayment.method === 'pix') {
            setSelectedPaymentMethod('pix');
            console.log('✅ Método selecionado: PIX');
            if (paymentData.pixCode) {
              generateQRCodeImage(paymentData.pixCode);
            }
          } else if (oldestPayment.method === 'boleto') {
            setSelectedPaymentMethod('boleto');
            console.log('✅ Método selecionado: Boleto');
            // Gerar QR Code do boleto se tiver pixCode para pagamento instantâneo
            if (paymentData.pixCode && paymentData.pixCode.trim() !== '') {
              generateBoletoQRCodeImage(paymentData.pixCode);
            }
          } else {
            // Para outros métodos (credit_card, debit_card, bank_transfer)
            setSelectedPaymentMethod(oldestPayment.method);
            console.log('✅ Método selecionado:', oldestPayment.method);
          }
          
          setStep('payment');
          setLoading(false); // Remover loading quando carregar pagamento existente
        }
      } else {
        // Nenhum pagamento pendente encontrado - continuar fluxo normal
      }
    } catch {
      // Não mostrar erro para o usuário, apenas continuar normalmente
    }
  }, [contractId, generateQRCodeImage, generateBoletoQRCodeImage, generateBankBarcode, generateDigitableLine]);

  useEffect(() => {
    loadUserProfile();
    checkForPendingPayments();
  }, [contractId, checkForPendingPayments]);

  useEffect(() => {
    if (socket) {
      // Escutar atualizações de status do PIX
      socket.on('pix_generation_status', (data: PixStatusData) => {
        if (data.contractId === parseInt(contractId || '0')) {
          setPixGenerationStatus(data.status);
          setPixStatusMessage(data.message);
          
          if (data.status === 'success') {
            const paymentDataTemp = {
              qrCode: data.qrCode,
              qrCodeBase64: '', // Será gerado pelo componente se necessário
              pixCode: data.qrCode,
              amount: data.amount || 0,
              dueDate: new Date(Date.now() + (data.expiresIn || 172800) * 1000).toISOString(),
            };
            setPaymentData(paymentDataTemp);
            
            // Gerar QR Code como imagem
            if (data.qrCode) {
              generateQRCodeImage(data.qrCode);
            }
            
            setLoading(false);
          } else if (data.status === 'error') {
            setError(data.message);
            setLoading(false);
          }
        }
      });

      // Escutar dados do boleto gerado
      socket.on('boleto-generated', (data: BoletoStatusData) => {
        if (data.contractId === parseInt(contractId || '0')) {
          // Criar paymentData completo com dados do Socket.IO
          const newPaymentData: PaymentData = {
            amount: plan?.price || 0,
            boletoCode: data.boleto.linhaDigitavel,
            boletoBarCode: data.boleto.codigoBarras,
            boletoUrl: data.boleto.boletoUrl,
            codigoSolicitacao: data.boleto.codigoSolicitacao,
            pixCode: data.boleto.pixCopiaECola, // PIX do boleto para pagamento instantâneo
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          };
          
          setPaymentData(newPaymentData);
          
          // Gerar QR Code do boleto se tiver pixCopiaECola
          if (data.boleto.pixCopiaECola && data.boleto.pixCopiaECola.trim() !== '') {
            generateBoletoQRCodeImage(data.boleto.pixCopiaECola);
          }
          
          setLoading(false);
        }
      });

      return () => {
        socket.off('pix_generation_status');
        socket.off('boleto-generated');
      };
    }
  }, [socket, contractId, plan?.price, generateQRCodeImage, generateBoletoQRCodeImage]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await profileService.getProfile();
      setUserProfile(profile);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setError('Erro ao carregar informações do usuário');
    } finally {
      setLoading(false);
    }
  };

  const canUseBoleto = () => {
    if (!userProfile) return false;
    const hasDocument = userProfile.document && userProfile.document.trim() !== '';
    const hasAddress = userProfile.address_json || userProfile.addressData || 
                     (userProfile.address && userProfile.address.trim() !== '');
    return hasDocument && hasAddress;
  };

  const canUsePix = () => {
    if (!userProfile) return false;
    const hasDocument = userProfile.document && userProfile.document.trim() !== '';
    return hasDocument;
  };

  const handlePaymentMethodSelect = (method: 'boleto' | 'pix') => {
    setSelectedPaymentMethod(method);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPaymentMethod || !contractId) return;

    try {
      setLoading(true);
      setError(null);

      // Confirma o método de pagamento
      await connectedAppsService.confirmPaymentMethod(
        parseInt(contractId),
        selectedPaymentMethod
      );

      if (selectedPaymentMethod === 'pix') {
        // Para PIX, iniciar o processo de geração
        setPixGenerationStatus('processing');
        setPixStatusMessage('Gerando QR Code PIX, aguarde...');
        setStep('payment');

        // Fazer a chamada para gerar o PIX
        const response = await connectedAppsService.generatePaymentQR(parseInt(contractId));
        
        if (response.success) {
          // Verificar se é um pagamento existente
          if (response.isExisting) {
            // Pagamento existente - usar dados diretamente do response
            setIsExistingPayment(true);
            
            const paymentData: PaymentData = {
              paymentId: response.paymentData.paymentId,
              pixCode: response.paymentData.qrCode,
              boletoBarcode: '',
              boletoUrl: '',
              qrCodeImage: '', // Será gerado
              boletoQrCodeImage: '',
              amount: response.paymentData.amount,
              planName: plan?.name || 'Plano Selecionado',
              contractId: contractId,
              status: 'PENDING'
            };

            setPaymentData(paymentData);
            setPixGenerationStatus('success');
            setLoading(false); // Remover loading para pagamento existente

            // Gerar QR code se o código PIX estiver disponível
            if (paymentData.pixCode) {
              await generateQRCodeImage(paymentData.pixCode);
            }
          } else {
            // Pagamento novo - aguardar Socket.IO
            setIsExistingPayment(false);
            setPixGenerationStatus('success');
          }
        } else {
          throw new Error(response.error || 'Erro ao gerar PIX');
        }
      } else {
        // Para boleto, chamar endpoint real
        setStep('payment');
        
        const boletoResponse = await connectedAppsService.generateBoleto(parseInt(contractId));
        
        if (boletoResponse.success) {
          // Verificar se é um pagamento existente
          if (boletoResponse.isExisting) {
            // Pagamento existente - usar dados diretamente do response
            setIsExistingPayment(true);
            
            const paymentData: PaymentData = {
              paymentId: boletoResponse.data.paymentId,
              pixCode: boletoResponse.data.pixQrCode || '',
              boletoBarcode: boletoResponse.data.boletoBarCode || boletoResponse.data.boletoCode || '',
              boletoUrl: boletoResponse.data.boletoUrl || '',
              qrCodeImage: '',
              boletoQrCodeImage: '', // Será gerado
              amount: boletoResponse.data.amount,
              planName: plan?.name || 'Plano Selecionado',
              contractId: contractId,
              status: 'PENDING'
            };

            setPaymentData(paymentData);
            setLoading(false); // Remover loading para pagamento existente

            // Gerar QR codes se os dados estiverem disponíveis
            if (paymentData.pixCode) {
              await generateQRCodeImage(paymentData.pixCode);
            }

            if (paymentData.boletoBarcode) {
              await generateBoletoQRCodeImage(paymentData.boletoBarcode);
            }
          } else {
            // Pagamento novo - aguardar Socket.IO
            setIsExistingPayment(false);
            
          }
        } else {
          throw new Error(boletoResponse.message || 'Erro ao gerar boleto');
        }
      }
    } catch (err) {
      console.error('Erro ao confirmar pagamento:', err);
      setError('Erro ao processar pagamento. Tente novamente.');
      setLoading(false);
      setPixGenerationStatus('error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Código copiado para a área de transferência!');
  };

  const downloadBoletoPdf = async () => {
    if (!contractId) {
      alert('ID do contrato não disponível');
      return;
    }

    // Verificar se temos codigoSolicitacao
    if (!paymentData?.codigoSolicitacao) {
      // Fallback: tentar usar a URL do boleto se disponível
      if (paymentData?.boletoUrl) {
        window.open(paymentData.boletoUrl, '_blank');
        return;
      }
      alert('Informações do boleto não disponíveis');
      return;
    }

    try {
      await connectedAppsService.downloadBoletoPdf(
        parseInt(contractId),
        paymentData.codigoSolicitacao
      );
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      alert('Erro ao baixar o PDF do boleto. Tente novamente.');
    }
  };

  if (loading && !userProfile) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Icon name="error" className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/connected-apps')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Voltar para Aplicações
          </button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Confirmação de Pagamento</h1>
          <p className="text-gray-600 mt-2">
            Complete a contratação do plano {plan?.name} para {product?.name}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Plano Selecionado</span>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-4"></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 ${step === 'select' ? 'bg-blue-600 text-white' : step === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} rounded-full flex items-center justify-center text-sm font-medium`}>
                {step === 'payment' ? '✓' : '2'}
              </div>
              <span className={`ml-2 text-sm font-medium ${step === 'select' || step === 'payment' ? 'text-gray-900' : 'text-gray-500'}`}>
                Forma de Pagamento
              </span>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-4"></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 ${step === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} rounded-full flex items-center justify-center text-sm font-medium`}>
                3
              </div>
              <span className={`ml-2 text-sm font-medium ${step === 'payment' ? 'text-gray-900' : 'text-gray-500'}`}>
                Pagamento
              </span>
            </div>
          </div>
        </div>

        {step === 'select' && (
          <div className="space-y-6">
            {/* Plan Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Produto:</span>
                  <span className="font-medium">{product?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plano:</span>
                  <span className="font-medium">{plan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium text-lg text-green-600">
                    {connectedAppsService.formatCurrency(plan?.price || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ciclo de cobrança:</span>
                  <span className="font-medium">
                    {connectedAppsService.formatBillingCycle(plan?.billingCycle || '')}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Escolha a Forma de Pagamento</h2>
              <div className="space-y-4">
                {/* PIX Option */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPaymentMethod === 'pix'
                      ? 'border-blue-500 bg-blue-50'
                      : canUsePix()
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                  onClick={() => canUsePix() && handlePaymentMethodSelect('pix')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pix"
                      checked={selectedPaymentMethod === 'pix'}
                      disabled={!canUsePix()}
                      onChange={() => {}}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <h3 className={`font-medium ${canUsePix() ? 'text-gray-900' : 'text-gray-500'}`}>
                        PIX - Pagamento Automático
                      </h3>
                      <p className={`text-sm ${canUsePix() ? 'text-gray-600' : 'text-gray-400'}`}>
                        Pagamento instantâneo via QR Code PIX
                      </p>
                      {!canUsePix() && (
                        <div className="mt-2">
                          <p className="text-sm text-red-600">
                            Para usar PIX, é necessário ter o documento preenchido.{' '}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/account');
                              }}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Preencher dados no perfil
                            </button>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-2xl">📱</div>
                  </div>
                </div>

                {/* Boleto Option */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPaymentMethod === 'boleto'
                      ? 'border-blue-500 bg-blue-50'
                      : canUseBoleto()
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                  onClick={() => canUseBoleto() && handlePaymentMethodSelect('boleto')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="boleto"
                      checked={selectedPaymentMethod === 'boleto'}
                      disabled={!canUseBoleto()}
                      onChange={() => {}}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <h3 className={`font-medium ${canUseBoleto() ? 'text-gray-900' : 'text-gray-500'}`}>
                        Boleto Bancário
                      </h3>
                      <p className={`text-sm ${canUseBoleto() ? 'text-gray-600' : 'text-gray-400'}`}>
                        Vencimento em 7 dias úteis
                      </p>
                      {!canUseBoleto() && (
                        <div className="mt-2">
                          <p className="text-sm text-red-600">
                            Para gerar boleto, é necessário ter documento e endereço preenchidos.{' '}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/account');
                              }}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Preencher dados no perfil
                            </button>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-2xl">🏦</div>
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={!selectedPaymentMethod || loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando...
                    </div>
                  ) : (
                    'Confirmar Pagamento'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6">
            {/* Payment Generated */}
            <div className="bg-white shadow rounded-lg p-6">
              {paymentData && (
                <>
                  <div className="flex items-center mb-4">
                    <Icon name="success" className="w-6 h-6 text-green-600 mr-2" />
                    <h2 className="text-xl font-semibold text-green-600">
                      {isExistingPayment 
                        ? (selectedPaymentMethod === 'pix' ? 'Pagamento PIX Pendente' : 'Boleto Pendente Carregado')
                        : (selectedPaymentMethod === 'pix' ? 'PIX Gerado com Sucesso!' : 'Boleto Gerado com Sucesso!')
                      }
                    </h2>
                  </div>
                  
                  <div className={`border rounded-lg p-4 mb-6 ${isExistingPayment ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-start">
                      <Icon name={isExistingPayment ? "info" : "warning"} className={`w-5 h-5 mr-2 mt-0.5 ${isExistingPayment ? 'text-blue-600' : 'text-yellow-600'}`} />
                      <div>
                        <p className={`font-medium ${isExistingPayment ? 'text-blue-800' : 'text-yellow-800'}`}>
                          {isExistingPayment ? 'Pagamento Pendente:' : 'Importante:'}
                        </p>
                        <p className={`text-sm mt-1 ${isExistingPayment ? 'text-blue-700' : 'text-yellow-700'}`}>
                          {isExistingPayment
                            ? 'Este pagamento já foi gerado anteriormente e ainda está pendente. Complete o pagamento para ativar sua conta.'
                            : (selectedPaymentMethod === 'pix' 
                                ? 'O PIX tem validade de 30 minutos. Após o pagamento, sua conta será ativada automaticamente.'
                                : 'O boleto vence em 7 dias úteis. Após o pagamento, sua conta será ativada em até 2 dias úteis.'
                              )
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}


              {selectedPaymentMethod === 'pix' && (
                <div className="space-y-6">
                  {/* Loading clean apenas para pagamentos novos */}
                  {!isExistingPayment && (pixGenerationStatus === 'idle' || pixGenerationStatus === 'processing') && !qrCodeDataUrl && (
                    <div className="text-center py-12">
                      {/* Spinner clean */}
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-6"></div>
                      
                      {/* Mensagem principal */}
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {pixGenerationStatus === 'processing' ? 'Processando seu PIX' : 'Gerando PIX'}
                      </h3>
                      
                      {/* Submensagem */}
                      <p className="text-sm text-gray-500 mb-4">
                        {pixGenerationStatus === 'processing' 
                          ? 'Aguarde enquanto processamos sua solicitação...' 
                          : 'Conectando com o sistema de pagamentos...'
                        }
                      </p>
                      
                      {/* Valor */}
                      <p className="text-sm text-gray-700">
                        Valor: <span className="font-medium">{connectedAppsService.formatCurrency(plan?.price || 0)}</span> por mês
                      </p>
                    </div>
                  )}

                  {/* Loading clean para geração do QR Code - apenas para pagamentos novos */}
                  {!isExistingPayment && pixGenerationStatus === 'success' && paymentData?.qrCode && !qrCodeDataUrl && (
                    <div className="text-center py-12">
                      {/* Checkmark + Spinner */}
                      <div className="flex items-center justify-center mb-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mr-3">
                          <Icon name="success" className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                      </div>
                      
                      {/* Mensagem */}
                      <h3 className="text-lg font-medium text-gray-900 mb-2">PIX gerado com sucesso</h3>
                      <p className="text-sm text-gray-500 mb-4">Preparando QR Code para você...</p>
                      
                      {/* Valor */}
                      <p className="text-sm text-gray-700">
                        Valor: <span className="font-medium">{connectedAppsService.formatCurrency(paymentData.amount)}</span> por mês
                      </p>
                    </div>
                  )}

                  {/* Exibir PIX - para pagamentos existentes ou novos com QR Code pronto */}
                  {((isExistingPayment && paymentData?.qrCode) || (pixGenerationStatus === 'success' && paymentData?.qrCode)) && (
                    <div className="space-y-6">
                      {/* Aviso sobre PIX recorrente - apenas para novos */}
                      {!isExistingPayment && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-start">
                            <Icon name="info" className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-800 mb-1">PIX Recorrente</h4>
                              <p className="text-blue-700 text-sm">
                                Após o primeiro pagamento, suas renovações serão cobradas automaticamente todo mês.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* QR Code */}
                      <div className="text-center">
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                          Escaneie o QR Code
                        </h3>
                        <p className="text-gray-600 text-sm mb-6">
                          {connectedAppsService.formatCurrency(paymentData.amount)} {isExistingPayment ? '' : 'por mês'}
                        </p>
                        
                        {/* QR Code container */}
                        <div className="inline-block p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                          {qrCodeDataUrl ? (
                            <img 
                              src={qrCodeDataUrl} 
                              alt="QR Code PIX"
                              className="w-56 h-56 object-contain"
                            />
                          ) : (
                            <div className="w-56 h-56 flex items-center justify-center">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-500">Gerando QR Code...</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Instruções */}
                        {!isExistingPayment && (
                          <div className="mt-6 space-y-2 text-sm text-gray-600">
                            <p>✓ Primeira cobrança: <strong>em 30 dias</strong></p>
                            <p>✓ Próximas cobranças: <strong>Automáticas</strong></p>
                          </div>
                        )}
                      </div>

                      {/* PIX Code */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Código PIX</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <code className="text-sm text-gray-600 break-all flex-1 mr-3">
                              {paymentData.pixCode}
                            </code>
                            <button
                              onClick={() => copyToClipboard(paymentData.pixCode!)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                            >
                              Copiar
                            </button>
                          </div>
                        </div>
                        
                        {/* Aviso final */}
                        {!isExistingPayment && (
                          <div className="mt-4 bg-green-50 rounded-lg p-3">
                            <p className="text-green-800 text-sm">
                              💡 Após o pagamento, o débito automático ficará ativo. 
                              Cancele a qualquer momento nas configurações.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {pixGenerationStatus === 'error' && (
                    <div className="text-center py-8">
                      <div className="text-red-600 mb-4">
                        <Icon name="error" className="w-12 h-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-red-600 mb-2">
                        Erro ao gerar PIX
                      </h3>
                      <p className="text-gray-600 mb-4">{pixStatusMessage}</p>
                      <button
                        onClick={() => {
                          setPixGenerationStatus('idle');
                          setStep('select');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedPaymentMethod === 'boleto' && paymentData && (
                <div className="space-y-6">
                  {/* Boleto Actions */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      onClick={downloadBoletoPdf}
                      className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Icon name="download" className="w-5 h-5 mr-2" />
                      Baixar Boleto PDF
                    </button>
                    <button
                      onClick={() => copyToClipboard(paymentData.boletoCode!)}
                      className="flex items-center justify-center px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Icon name="receipt" className="w-5 h-5 mr-2" />
                      Copiar Código de Barras
                    </button>
                  </div>

                  {/* QR Code PIX do Boleto para Pagamento Instantâneo */}
                  {paymentData.pixCode && paymentData.pixCode.trim() !== '' && (
                    <div className="text-center mb-8">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-center justify-center mb-4">
                          <Icon name="info" className="w-6 h-6 text-green-600 mr-2" />
                          <h3 className="text-xl font-medium text-green-800">
                            Pagamento Instantâneo via PIX
                          </h3>
                        </div>
                        
                        <p className="text-green-700 text-sm mb-6">
                          Escaneie este QR Code para pagar o boleto instantaneamente
                        </p>
                        
                        {/* QR Code container */}
                        {boletoQrCodeDataUrl ? (
                          <div className="inline-block p-4 bg-white border border-green-300 rounded-lg shadow-sm mb-6">
                            <img 
                              src={boletoQrCodeDataUrl} 
                              alt="QR Code PIX do Boleto"
                              className="w-56 h-56 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="inline-block p-4 bg-white border border-green-300 rounded-lg shadow-sm mb-6">
                            <div className="w-56 h-56 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent"></div>
                              <span className="ml-2 text-green-600 text-sm">Gerando QR Code...</span>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-center">
                          <button
                            onClick={() => copyToClipboard(paymentData.pixCode!)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Icon name="receipt" className="w-5 h-5 mr-2 inline" />
                            Copiar Código PIX
                          </button>
                        </div>
                        
                        <p className="text-green-600 text-sm mt-4">
                          ⚡ Pagamento confirmado na hora!
                        </p>
                      </div>
                      
                      {/* Separador */}
                      <div className="flex items-center my-6">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="px-4 text-gray-500 text-sm">ou pague pelo boleto tradicional</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                      </div>
                    </div>
                  )}

                  {/* Boleto Code */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Linha Digitável:</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <code className="text-sm text-gray-800 break-all font-mono tracking-wider font-semibold">
                        {paymentData.boletoCode}
                      </code>
                    </div>
                  </div>

                  {/* Barcode Visual */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Código de Barras:</h3>
                    {paymentData.boletoBarCode && (
                      <BoletoBarcode 
                        codigoBarras={paymentData.boletoBarCode}
                        linhaDigitavel={paymentData.boletoCode}
                        className="mb-4"
                      />
                    )}
                  </div>

                  {/* Payment Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-2">Detalhes do Pagamento</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-medium">{connectedAppsService.formatCurrency(paymentData.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vencimento:</span>
                        <span className="font-medium">
                          {paymentData.dueDate ? new Date(paymentData.dueDate).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => navigate('/connected-apps')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Finalizar
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Gerar Novo Pagamento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default PaymentConfirmation;
