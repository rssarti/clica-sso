import React from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';

// Importações dos ícones mais usados
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SecurityIcon from '@mui/icons-material/Security';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import AppsIcon from '@mui/icons-material/Apps';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

// Mapeamento de nomes para componentes de ícones
const iconMap = {
  // Navegação e Interface
  dashboard: DashboardIcon,
  home: HomeIcon,
  menu: MenuIcon,
  close: CloseIcon,
  search: SearchIcon,
  apps: AppsIcon,
  notifications: NotificationsIcon,
  arrowBack: ArrowBackIcon,
  arrowForward: ArrowForwardIcon,
  refresh: RefreshIcon,

  // Conta e Usuário
  account: AccountCircleIcon,
  logout: LogoutIcon,
  visibility: VisibilityIcon,
  visibilityOff: VisibilityOffIcon,

  // Segurança e Privacidade
  security: SecurityIcon,
  privacy: PrivacyTipIcon,
  settings: SettingsIcon,

  // Pagamentos e Financeiro
  payment: PaymentIcon,
  creditCard: CreditCardIcon,
  money: AttachMoneyIcon,
  trending: TrendingUpIcon,
  receipt: ReceiptIcon,
  subscriptions: SubscriptionsIcon,
  business: BusinessIcon,
  
  // Métodos de Pagamento
  pix: QrCodeIcon,
  boleto: ReceiptLongIcon,
  bankTransfer: AccountBalanceIcon,

  // Ações
  edit: EditIcon,
  save: SaveIcon,
  cancel: CancelIcon,
  delete: DeleteIcon,
  download: DownloadIcon,
  email: EmailIcon,
  history: HistoryIcon,

  // Estados
  success: CheckCircleIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
} as const;

export type IconName = keyof typeof iconMap;

interface IconProps extends Omit<SvgIconProps, 'children'> {
  name: IconName;
  size?: 'small' | 'medium' | 'large';
}

const Icon: React.FC<IconProps> = ({ name, size = 'medium', ...props }) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  // Mapear tamanhos para valores do Material-UI
  const sizeMap = {
    small: 'small' as const,
    medium: 'medium' as const,
    large: 'large' as const,
  };

  return (
    <IconComponent 
      fontSize={sizeMap[size]} 
      {...props}
    />
  );
};

export default Icon;
