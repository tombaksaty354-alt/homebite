export interface User {
  id: string;
  email: string;
  nama: string;
  role: "customer" | "mitra" | "admin";
  tier?: string;
  telepon?: string;
  alamat?: string;
  kota?: string;
  provinsi?: string;
  rekening_bank?: string;
  rekening_nomor?: string;
  rekening_nama?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (nama: string, email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}
