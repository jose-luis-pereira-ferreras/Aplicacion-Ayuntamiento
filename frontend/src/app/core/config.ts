declare global {
  interface Window {
    __API_BASE__?: string;
  }
}

const runtimeApiBase =
  typeof window !== 'undefined' && window.__API_BASE__ ? window.__API_BASE__ : '/api';

export const API_BASE = runtimeApiBase;

export const NOMBRE_APP = 'App Deportiva';
export const NOMBRE_AYTO = 'Ayuntamiento';

export const ROL_ADMIN = 'admin';
export const ROL_CIUDADANO = 'ciudadano';
