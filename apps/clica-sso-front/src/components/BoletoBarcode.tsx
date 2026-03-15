import React from 'react';

interface BoletoBarcodeProps {
  codigoBarras: string;
  linhaDigitavel?: string;
  className?: string;
}

// Padrões Interleaved 2 of 5 para código de barras de boleto FEBRABAN
// Cada dígito é representado por 5 barras (barra fina = 1, barra larga = 3)
const INTERLEAVED_2_OF_5_PATTERNS: { [key: string]: number[] } = {
  '0': [1, 1, 3, 3, 1], // nnwwn
  '1': [3, 1, 1, 1, 3], // wnnnw  
  '2': [1, 3, 1, 1, 3], // nwnnn
  '3': [3, 3, 1, 1, 1], // wwnn
  '4': [1, 1, 3, 1, 3], // nnwnw
  '5': [3, 1, 3, 1, 1], // wnwnn
  '6': [1, 3, 3, 1, 1], // nwwnn
  '7': [1, 1, 1, 3, 3], // nnnww
  '8': [3, 1, 1, 3, 1], // wnnnw
  '9': [1, 3, 1, 3, 1]  // nwnwn
};

const BoletoBarcode: React.FC<BoletoBarcodeProps> = ({ 
  codigoBarras, 
  linhaDigitavel,
  className = '' 
}) => {
  const generateBarcodePattern = (codigo: string): number[] => {
    // Validar código de barras de 44 dígitos
    if (!codigo || codigo.length !== 44) {
      console.error('Código de barras deve ter exatamente 44 dígitos');
      return [1, 1, 1, 1]; // Padrão de erro
    }

    const pattern: number[] = [];
    
    // Código de início Interleaved 2 of 5: 1010 (barra-espaço-barra-espaço)
    pattern.push(1, 1, 1, 1);
    
    // Processar dígitos em pares (característica do Interleaved 2 of 5)
    for (let i = 0; i < codigo.length; i += 2) {
      const digit1 = codigo[i] || '0';
      const digit2 = codigo[i + 1] || '0';
      
      const pattern1 = INTERLEAVED_2_OF_5_PATTERNS[digit1];
      const pattern2 = INTERLEAVED_2_OF_5_PATTERNS[digit2];
      
      if (pattern1 && pattern2) {
        // Intercalar as barras: primeiro dígito define largura das barras, segundo define largura dos espaços
        for (let j = 0; j < 5; j++) {
          pattern.push(pattern1[j]); // Barra (primeiro dígito)
          pattern.push(pattern2[j]); // Espaço (segundo dígito)
        }
      }
    }
    
    // Código de fim Interleaved 2 of 5: 311 (barra larga-barra fina-barra fina)
    pattern.push(3, 1, 1);
    
    return pattern;
  };

  const formatLinhaDigitavel = (linha: string): string => {
    if (!linha) return '';
    
    const clean = linha.replace(/[\s.]/g, '');
    if (clean.length >= 47) {
      return `${clean.substring(0, 5)}.${clean.substring(5, 10)} ${clean.substring(10, 15)}.${clean.substring(15, 21)} ${clean.substring(21, 26)}.${clean.substring(26, 32)} ${clean.substring(32, 33)} ${clean.substring(33, 47)}`;
    }
    return linha;
  };

  const barcodePattern = generateBarcodePattern(codigoBarras);

  // Renderizar as barras seguindo o padrão Interleaved 2 of 5
  const renderBars = () => {
    const bars = [];
    const moduleWidth = 1; // Largura do módulo básico
    let x = 0;
    
    for (let i = 0; i < barcodePattern.length; i++) {
      const isBar = i % 2 === 0; // Posições pares são barras, ímpares são espaços
      const width = barcodePattern[i] * moduleWidth;
      
      if (isBar) {
        bars.push(
          <rect
            key={i}
            x={x}
            y={5}
            width={width}
            height={70}
            fill="black"
          />
        );
      }
      x += width;
    }
    
    return { bars, totalWidth: x };
  };

  const { bars, totalWidth } = renderBars();

  return (
    <div className={`bg-white p-4 border-2 border-gray-300 rounded-lg ${className}`}>
      <div className="w-full overflow-x-auto">
        <div className="flex justify-center">
          <svg 
            width="100%" 
            height="80" 
            viewBox={`0 0 ${totalWidth} 80`}
            className="w-[90vw] max-w-full"
            preserveAspectRatio="xMidYMid meet"
            style={{ maxHeight: '80px' }}
          >
            <g>
              {bars}
            </g>
          </svg>
        </div>
      </div>
      
      {linhaDigitavel && (
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-700 font-mono tracking-wider break-all px-2">
            {formatLinhaDigitavel(linhaDigitavel)}
          </p>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        Aponte a câmera do seu celular para o código acima para efetuar o pagamento
      </p>
    </div>
  );
};

export default BoletoBarcode;
