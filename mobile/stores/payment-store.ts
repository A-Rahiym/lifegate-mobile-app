import { create } from 'zustand';
import { PaymentService } from 'services/payment-service';
import type { CreditBalance, CreditBundle, PaymentTransaction } from 'types/payment-types';

interface PaymentState {
  balance: CreditBalance | null;
  bundles: CreditBundle[];
  transactions: PaymentTransaction[];
  paymentLink: string | null;
  activeTxRef: string | null;
  loading: boolean;
  error: string | null;

  fetchBalance: () => Promise<void>;
  fetchBundles: () => Promise<void>;
  initiatePayment: (bundleId: string, name?: string) => Promise<void>;
  verifyPayment: (txRef: string, flwTxId: string) => Promise<PaymentTransaction>;
  fetchTransactions: (limit?: number) => Promise<void>;
  clearError: () => void;
  clearPaymentLink: () => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  balance: null,
  bundles: [],
  transactions: [],
  paymentLink: null,
  activeTxRef: null,
  loading: false,
  error: null,

  fetchBalance: async () => {
    set({ loading: true, error: null });
    try {
      const balance = await PaymentService.getCreditBalance();
      set({ balance, loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load balance', loading: false });
    }
  },

  fetchBundles: async () => {
    set({ loading: true, error: null });
    try {
      const bundles = await PaymentService.getBundles();
      set({ bundles, loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load bundles', loading: false });
    }
  },

  initiatePayment: async (bundleId: string, name?: string) => {
    set({ loading: true, error: null, paymentLink: null, activeTxRef: null });
    try {
      const res = await PaymentService.initiatePayment(bundleId, name);
      set({ paymentLink: res.paymentLink, activeTxRef: res.txRef, loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to initiate payment', loading: false });
    }
  },

  verifyPayment: async (txRef: string, flwTxId: string) => {
    set({ loading: true, error: null });
    try {
      const tx = await PaymentService.verifyPayment(txRef, flwTxId);
      // Refresh balance after successful verification
      if (tx.status === 'success') {
        await get().fetchBalance();
      }
      set({ loading: false, paymentLink: null, activeTxRef: null });
      return tx;
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to verify payment', loading: false });
      throw e;
    }
  },

  fetchTransactions: async (limit = 50) => {
    set({ loading: true, error: null });
    try {
      const res = await PaymentService.getTransactions(limit);
      set({ transactions: res.transactions ?? [], loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load transactions', loading: false });
    }
  },

  clearError: () => set({ error: null }),
  clearPaymentLink: () => set({ paymentLink: null, activeTxRef: null }),
}));
