import { Device } from "@capacitor/device";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import axios from "axios";
import { hexToRgb } from "@/utils/color";

interface Product {
  id: number;
  name: string;
}
interface ScannerState {
  results: any[];
  setResults: (results: any[]) => void;
  resultStore: any[];
  setResultStore: (results: any[]) => void;
  resultReview: any[];
  setResultReview: (resultReview: any[]) => void;
  clearResults: () => void;
  data: any | null;
  dataRate: any | null;
  isLoading: boolean;
  isLoadingProduct: boolean;
  error: string | null;
  fetchScannerById: (id: string, keyword?: string) => Promise<void>;
  checkQrScan: (QRCode: string, DeviceId: string) => Promise<void>;
  submitScannerFeedback: (data: any) => Promise<void>;
  updateScannerFeedback: (data: any) => Promise<void>;
  selectedProducts: Product[];
  setSelectedProducts: (products: Product[]) => void;
  toggleProductSelection: (product: Product) => void;
  note: string;
  setNote: (value: string) => void;
  selectedLang: string;
  setSelectedLang: (lang: string) => void;
  photos: string[];
  setPhotos: (photos: string[]) => void;
  addPhotos: (newPhotos: string[]) => void;
  removePhoto: (idx: number) => void;
}

export const useScannerStore = create<ScannerState>()(
  persist(
    (set) => ({
      results: [],
      setResults: (results) => set({ results }),
      resultStore: [],
      setResultStore: (resultStore) => set({ resultStore }),
      resultReview: [],
      setResultReview: (resultReview) => set({ resultReview }),
      clearResults: () => set({ results: [] }),
      data: null,
      dataRate: null,
      isLoading: false,
      error: null,
      isLoadingProduct: false,
      selectedProducts: [],
      setSelectedProducts: (products) => set({ selectedProducts: products }),
      toggleProductSelection: (product) =>
        set((state) => {
          const exists = state.selectedProducts.some(
            (p) => p.id === product.id
          );
          return {
            selectedProducts: exists
              ? state.selectedProducts.filter((p) => p.id !== product.id)
              : [...state.selectedProducts, product],
          };
        }),
      note: "",
      setNote: (value) => set({ note: value }),
      fetchScannerById: async (id: string, keyword?: string) => {
        set({ isLoadingProduct: true, error: null });
        try {
          const response = await axios.get(
            `${(window as any).ENV.BE}/api/v1/ionic-web/categories/products`,
            {
              headers: { "x-api-key": `${(window as any).ENV.BE_API_KEY}` },
              params: {
                PageNumber: 0,
                PageSize: 999,
                QRCode: id,
                Keyword: keyword,
              },
            }
          );
          const results = response.data.data.data.categories;
          const resultStore = response.data.data.data.store;
          set({
            results: results,
            resultStore: resultStore,
            isLoadingProduct: false,
          });
          const colorStore =
            response.data.data.data.store.organization.colorDefault;
          const colorRgb = hexToRgb(colorStore);
          const colorRgbMain = hexToRgb(colorStore);
          localStorage.setItem("color-main", `rgb(${colorRgbMain})`);
          localStorage.setItem("color-main-light", `rgba(${colorRgb}, 0.8)`);
          document.documentElement.style.setProperty(
            "--color-main",
            `rgb(${colorRgbMain})`
          );
          document.documentElement.style.setProperty(
            "--color-main-light",
            `rgb(${colorRgb}, 0.8)`
          );
        } catch (error: any) {
          set({ error: error.message, isLoadingProduct: false });
        }
      },
      checkQrScan: async (QRCode: string, DeviceId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(
            `${(window as any).ENV.BE}/api/v1/ionic-web/qr/scan`,
            { QRCode: QRCode, DeviceId: DeviceId },
            {
              headers: { "x-api-key": `${(window as any).ENV.BE_API_KEY}` },
            }
          );
          console.log(response);
          const data = response.data.data;
          set({ data, isLoading: false });
        } catch (error: any) {
          console.log("first error", error);
          set({ error: error.message, isLoading: false });
        }
      },
      submitScannerFeedback: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(
            `${(window as any).ENV.BE
            }/api/v1/ionic-web/product/review/generate-v2`,
            data,
            {
              headers: { "x-api-key": `${(window as any).ENV.BE_API_KEY}` },
            }
          );
          set({
            resultReview: response.data.data,
            dataRate: data,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      updateScannerFeedback: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
          await axios.put(
            `${(window as any).ENV.BE}/api/v1/ionic-web/product/review/status`,
            data,
            {
              headers: { "x-api-key": `${(window as any).ENV.BE_API_KEY}` },
            }
          );
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      selectedLang: "en",
      setSelectedLang: (lang) => set({ selectedLang: lang }),
      photos: [],
      setPhotos: (photos) => set({ photos }),
      addPhotos: (newPhotos) =>
        set((state) => ({ photos: [...state.photos, ...newPhotos] })),
      removePhoto: (idx) =>
        set((state) => ({
          photos: state.photos.filter((_, index) => index !== idx),
        })),
    }),
    {
      name: "scanner-storage",
      // storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        results: state.results,
        resultStore: state.resultStore,
        resultReview: state.resultReview,
        data: state.data,
        dataRate: state.dataRate,
      }),
    }
  )
);
