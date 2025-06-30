/* eslint-disable @typescript-eslint/no-explicit-any */
const ENV = {
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  MODEL: import.meta.env.VITE_MODEL || "default-model",
  BE: import.meta.env.VITE_BE || "https://hihihihahaha.apexbrand.top",
  BE_API_KEY:
    import.meta.env.VITE_BE_API_KEY ||
    "hihihihahaha",
  GOOGLE_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || "hihihihahaha",
};

if (typeof window !== "undefined") {
  (window as any).ENV = ENV;
}

export default ENV;
