export interface ISheet$Cache$Options {
    /**
     * @description Tiempo de frecuencia de actualización de cache en segundos
     * @default 60 segundos
     */
    updateFreq?: number;
    /**
     * 
     * @description Modo de almacenamiento del Cache.
     * 
     * Opciones disponibles:
     * - 'ram': Almacena el caché en la memoria RAM del servidor. Proporciona acceso rápido a los datos, pero puede consumir más recursos del servidor.
     * - 'json': Almacena el caché en el disco duro del servidor. Adecuado para entornos con restricciones de memoria RAM o para un volumen de datos moderado. Proporciona acceso más lento a los datos, pero consume menos recursos del servidor.
     * @default json.
     */
    saveMode?: 'ram' | 'json'
}

export interface ISheet$Cache$Structure<T = any> {
    [idGenerated: string]: {
        lastUpdate: number;
        data: T;
    }
}