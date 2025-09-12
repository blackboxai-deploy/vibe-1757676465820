// Core Types for Voto na Hora Election Management System

// User Management Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  mesaId?: string | null;
  created_at: Date;
  updated_at?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved', 
  REJECTED = 'rejected'
}

// Electoral Event Types
export interface EventoEleitoral {
  id: string;
  nome: string;
  tipo_eleicao: TipoEleicao;
  data_eleicao: Date;
  hora_abertura: string; // "08:00"
  hora_encerramento: string; // "19:00"
  status: StatusEventoEleitoral;
  locked_at?: Date;
  locked_by?: string;
  created_at: Date;
  updated_at?: Date;
}

export enum TipoEleicao {
  LEGISLATIVAS = 'legislativas',
  MUNICIPAIS = 'municipais',
  PRESIDENCIAIS = 'presidenciais',
  EUROPEIAS = 'europeias'
}

export enum StatusEventoEleitoral {
  AGENDADO = 'agendado',
  ATIVO = 'ativo',
  CONCLUIDO = 'concluído',
  CANCELADO = 'cancelado'
}

// Voting Table (Mesa) Types
export interface Mesa {
  id: string;
  nome: string;
  local: string;
  totalEleitores: number;
  userId: string | null;
  evento_eleitoral_id?: string;
  status: StatusMesa;
  fechada_at?: Date;
  fechada_by?: string;
  locked_at?: Date;
  locked_by?: string;
  created_at: Date;
  updated_at?: Date;
}

export enum StatusMesa {
  ATIVA = 'ativa',
  FECHADA = 'fechada',
  TRANCADA = 'trancada',
  INATIVA = 'inativa'
}

// Vote Records Types
export interface VotoUpdate {
  id: string;
  mesaId: string;
  votosRegistrados: number;
  timestamp: Date;
  userId?: string;
  tipo?: 'parcial' | 'final';
}

export interface HistoricoVotos {
  id: string;
  mesaId: string;
  votosRegistrados: number;
  totalEleitores: number;
  percentagem: number;
  timestamp: Date;
  userId: string;
  userName: string;
  tipo: 'parcial' | 'final';
}

// User-Table Assignment Types
export interface EventoMesaUsuario {
  id: string;
  evento_mesa_id: string;
  user_id: string;
  data_atribuicao: Date;
  data_fim?: Date; // For maintaining history
  created_at: Date;
}

export interface EventoMesa {
  id: string;
  evento_eleitoral_id: string;
  mesa_id: string;
  status: StatusMesa;
  created_at: Date;
}

// Statistics and Analytics Types
export interface EstatisticasMesa {
  mesaId: string;
  nomeMesa: string;
  local: string;
  totalEleitores: number;
  ultimosVotosRegistrados: number;
  percentagemParticipacao: number;
  ultimaAtualizacao: Date;
  status: StatusMesa;
  nomeUsuario?: string;
}

export interface EstatisticasEvento {
  eventoId: string;
  nomeEvento: string;
  totalMesas: number;
  mesasAtivas: number;
  mesasFechadas: number;
  totalEleitores: number;
  totalVotosRegistrados: number;
  percentagemGlobalParticipacao: number;
  mesasComMaiorParticipacao: EstatisticasMesa[];
}

// Notification Types
export interface NotificationOptions {
  duration?: number;
  dismissible?: boolean;
  action?: { 
    label: string; 
    onClick: () => void; 
  };
  id?: string;
  onDismiss?: () => void;
  showIcon?: boolean;
}

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface NotificationState {
  id: string;
  title: string;
  message?: string;
  type: NotificationType;
  timestamp: Date;
  options?: NotificationOptions;
}

// Audit and History Types
export interface AuditLog {
  id: string;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  user_id: string;
  timestamp: Date;
  ip_address?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface VotosForm {
  votosRegistrados: number;
}

export interface TotalEleitoresForm {
  totalEleitores: number;
}

export interface MesaForm {
  nome: string;
  local: string;
  totalEleitores?: number;
}

export interface EventoEleitoralForm {
  nome: string;
  tipo_eleicao: TipoEleicao;
  data_eleicao: string;
  hora_abertura: string;
  hora_encerramento: string;
}

// Context Types
export interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (userId: string, data: Partial<User>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  changeEmail: (email: string) => Promise<boolean>;
  verifyEmail: (email: string) => Promise<boolean>;
  setUser: (user: User | null) => void;
}

export interface MesaContextType {
  mesas: Mesa[];
  isLoading: boolean;
  assignarMesa: (userId: string, mesaId: string) => Promise<boolean>;
  removerMesa: (userId: string, mesaId: string) => Promise<boolean>;
  registrarVotos: (mesaId: string, votos: number) => Promise<boolean>;
  registrarTotalEleitores: (mesaId: string, total: number) => Promise<boolean>;
  adicionarMesa: (nome: string, local: string) => Promise<boolean>;
  atualizarMesa: (mesaId: string, nome: string, local: string) => Promise<boolean>;
  eliminarMesa: (mesaId: string) => Promise<boolean>;
  eliminarTodasMesas: () => Promise<boolean>;
  isMesaEditavel: (mesa: Mesa, user: User) => boolean;
  isEventoFechado: (evento: EventoEleitoral) => boolean;
  recarregarMesas: () => Promise<void>;
}

export interface NotificationContextType {
  notify: (title: string, message?: string, type?: NotificationType, options?: NotificationOptions) => void;
  success: (title: string, message?: string, options?: NotificationOptions) => void;
  error: (title: string, message?: string, options?: NotificationOptions) => void;
  warning: (title: string, message?: string, options?: NotificationOptions) => void;
  info: (title: string, message?: string, options?: NotificationOptions) => void;
  dismiss: (toastId: string) => void;
  dismissAll: () => void;
}

export interface UserContextType {
  users: User[];
  isLoading: boolean;
  pendingUsers: User[];
  approvedUsers: User[];
  approveUser: (userId: string) => Promise<boolean>;
  rejectUser: (userId: string) => Promise<boolean>;
  changeUserRole: (userId: string, role: UserRole) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  recarregarUsers: () => Promise<void>;
}

export interface VotosContextType {
  historico: HistoricoVotos[];
  estatisticas: EstatisticasMesa[];
  isLoading: boolean;
  registrarVotos: (mesaId: string, votos: number) => Promise<boolean>;
  obterHistoricoMesa: (mesaId: string) => Promise<HistoricoVotos[]>;
  obterEstatisticasEvento: (eventoId: string) => Promise<EstatisticasEvento>;
  recarregarEstatisticas: () => Promise<void>;
}

// Utility Types
export interface DebouncedSubscriptionOptions {
  name: string;
  minInterval?: number;
  debounceTime?: number;
}

export interface PermissionCheck {
  isMesaEditavel: boolean;
  isEventoEditavel: boolean;
  canAssignMesa: boolean;
  canCloseMesa: boolean;
  canViewStatistics: boolean;
}

// Filter and Search Types
export interface MesaFilter {
  status?: StatusMesa;
  eventoId?: string;
  userId?: string;
  hasUser?: boolean;
}

export interface EventoFilter {
  status?: StatusEventoEleitoral;
  tipo?: TipoEleicao;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface UserFilter {
  status?: UserStatus;
  role?: UserRole;
  hasAssignedMesa?: boolean;
}

// CSV Import Types
export interface CsvImportResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: string[];
}

export interface MesaCsvRow {
  nome: string;
  local: string;
  totalEleitores: number;
}

// Real-time Subscription Types
export interface SubscriptionHandler<T = any> {
  (payload: T): void | Promise<void>;
}

export interface RealtimeSubscription {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  handler: SubscriptionHandler;
}

// Theme and UI Types
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
}

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  large: number;
}