export type Category = 'necessary' | 'analytics' | 'marketing';

/** Estado persistido en la cookie logika_consent. */
export interface ConsentState {
  /** Versión de la política con la que se dio el consentimiento. */
  v: number;
  /** ISO timestamp de la decisión. */
  ts: string;
  /** Identificador anónimo de la decisión (UUID). */
  cid: string;
  analytics: boolean;
  marketing: boolean;
}

/** Metadatos de una categoría, para render del panel. */
export interface CategoryMeta {
  id: Category;
  label: string;
  description: string;
  /** true = siempre activa, no editable (necessary). */
  locked?: boolean;
}

/** Definición de un script gateado (GA4, Pixel, ...). */
export interface ScriptDef {
  id: string;
  category: Exclude<Category, 'necessary'>;
  /** Inyecta el tag en caliente cuando la categoría pasa a permitida. */
  inject: () => void;
  /** Limpia cookies del tag cuando la categoría pasa a denegada. */
  cleanup?: () => void;
}

export interface ConsentConfig {
  policyVersion: number;
  cookieName: string;
  /** URL del endpoint de logging. Si es undefined, no se registra. */
  logEndpoint?: string;
  /**
   * Identificador del sitio que origina el consentimiento (ej. "logika.cl").
   * Permite reutilizar una misma tabla de registro entre proyectos.
   * Si se omite, se usa `location.hostname`.
   */
  origin?: string;
  categories: CategoryMeta[];
  scripts: ScriptDef[];
}
