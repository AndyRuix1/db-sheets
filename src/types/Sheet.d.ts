import type { ISheet$Cache$Options } from "./Cache";

export interface IAuthData {
    client_email: string;
    private_key: string;
    scopes: string[];
}

export interface ITablePosition {
    letter: string;
    number: number;
}

export interface ISheet$Options {
    /**
     * @description Configuración de sistema de cacheado para las tablas de google sheets.
     * 
     * Si no se agrega una configuración el sistema de cache sera ignorado y no se usara.
     */
    cache?: ISheet$Cache$Options
}
