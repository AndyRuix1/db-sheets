import type { IAuthData, ITablePosition, ISheet$Options } from '../types/Sheet';
import { google, type sheets_v4 } from 'googleapis';
import { GoogleAuth, JWT } from 'google-auth-library';
import { generateRandomId } from './util';
import { getPosition, sumLetter, successCodes, letterToNumber, formatValues } from './help';
import Cache from './Cache';

export default class SheetsManager extends Cache {
    private static instanceCounter = 0;
    private sheets: sheets_v4.Sheets;
    private jwtClient: JWT;
    private gAuth: GoogleAuth;
    private currentSheetId: string = '';
    private currentSheetName: string = '';
    private currentTablePosition: ITablePosition = { letter: 'A', number: 1 };
    private cacheId: string = '';
    private useCache = false;
    private gAuthCreds: IAuthData = {
        client_email: '',
        private_key: '',
        scopes: []
    };

    constructor(authInfo: IAuthData, options?: ISheet$Options) {
        SheetsManager.instanceCounter += 1;
        const cacheId = generateRandomId();
        super(options?.cache, cacheId);
        this.useCache = typeof options?.cache === 'object';
        this.cacheId = cacheId;
        this.gAuthCreds.client_email = authInfo.client_email;
        this.gAuthCreds.private_key = authInfo.private_key;
        this.gAuthCreds.scopes = authInfo.scopes;

        this.jwtClient = new google.auth.JWT(this.gAuthCreds.client_email, undefined, this.gAuthCreds.private_key, this.gAuthCreds.scopes);
        this.gAuth = new google.auth.GoogleAuth({
            credentials: {
                client_email: this.gAuthCreds.client_email,
                private_key: this.gAuthCreds.private_key,
            },
            authClient: this.jwtClient,
            scopes: this.gAuthCreds.scopes,
        });

        this.sheets = google.sheets({
            version: 'v4',
            auth: this.gAuth
        });
    };

    /**
     * @description obtiene la ultima columna con un valor. 
     * @param positionLetter Letra de la posición inicial de la tabla.
     * @param positionNumber Numero de la posición inicial de la tabla
     * @returns Se retorna el numero del ultimo valor de una columna en la posición indicada
     */
    private async getLastColumn(positionLetter: string, positionNumber: number): Promise<string> {
        let currentColumn = positionLetter;
        let currentRow = positionNumber;
        let values: any[][] = [];

        const range = `${this.currentSheetName}!${currentColumn}${currentRow}:Z${currentRow}`;
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.currentSheetId,
            range
        });
        values = response?.data?.values ? response?.data?.values[0] : [];
        let lastColumnWithValue = positionLetter;

        for (let i = 0; i < values.length; i++) {
            if (values[i]) lastColumnWithValue = sumLetter(lastColumnWithValue);
        };

        if (lastColumnWithValue.length > 0) {
            const range = `${this.currentSheetName}!${positionLetter}${currentRow}:IV${currentRow}`;
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.currentSheetId,
                range: range,
            });
            values = response?.data?.values ? response?.data?.values[0] : [];
            for (let i in values) {
                lastColumnWithValue = sumLetter(lastColumnWithValue);
            };
        };

        return lastColumnWithValue;
    };

    /**
     * @description Obtener la posición del ultimo valor conocido en una fila.
     * @param positionLetter Letra de la posición inicial de la tabla
     * @param positionNumber Numero de la posición inicial de la tabla
     * @returns Se retorna el numero del ultimo valor de la fila en la posición indicada.
     */
    private async getLastRow(positionLetter: string, positionNumber: number): Promise<number> {
        let currentColumn = positionLetter;
        let currentRow = positionNumber;
        let lastRow = 0;
        let values: any[][] = [];
        do {
            const range = `${this.currentSheetName}!${currentColumn}${currentRow}:${currentColumn}${currentRow}`;
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.currentSheetId,
                range,
            });
            values = response?.data?.values ?? [];
            if (values?.length && values[0]?.length) {
                lastRow = currentRow;
                currentRow++;
            }
        } while (values?.length && values[0]?.length);
        return lastRow;
    };

    /**
     * @description Método para preparar un objeto con datos para un arreglo, esto es necesario para hacer inserción en las tablas.
     * @param initPosition Posición de la tabla a trabajar (opcional si ya se aplico definición desde la clase) 
     * @param values Datos a ser procesados.
     * @returns Arreglo con todos los datos preparados para ser insertados en su respectiva tabla
     */
    private async objectToArray({ initPosition, values }: { initPosition?: string, values: any[] }): Promise<string[][]> {
        const position = initPosition ? getPosition(initPosition) : this.currentTablePosition;
        const headers = await this.getTableHeaders(`${position.letter}:${position.number}`);
        const finalValues: string[][] = [];
        values.forEach((value) => {
            const tempArray: string[] = [];
            headers.forEach(header => {
                //@ts-ignore
                if (typeof value[header] === 'undefined') tempArray.push('');
                //@ts-ignore
                else tempArray.push(value[header]);
            });
            finalValues.push(tempArray);
        });
        return finalValues;
    };

    /**
     * @description Método para obtener la posición de la hoja entre las demás.
     * @returns Se obtiene el numero de la hoja (su posición exacta entre todas las hojas)
     */
    private async getSheetIdBySheetName(): Promise<number> {
        const sheetResponse = await this.sheets.spreadsheets.get({ spreadsheetId: this.currentSheetId });
        const sheet = sheetResponse.data.sheets.find(sheet => sheet.properties.title === this.currentSheetName);
        if (!sheet) return 0;
        return sheet?.properties?.sheetId ?? 0;
    };

    /**
     * @description Método para obtener todas las cabeceras de una tabla.
     * @param initialPosition Posición inicial de la tabla a trabajar: Ej: A:2 (opcional si ya se agrego en la instancia).
     * @returns Cabeceras de la tabla completa desde el inicio hasta la posición con valor conocida.
     */
    public async getTableHeaders(initialPosition?: string): Promise<string[]> {
        const position = initialPosition ? getPosition(initialPosition) : this.currentTablePosition;
        const endLetter = await this.getLastColumn(position.letter, position.number);
        const range = `${this.currentSheetName}!${position.letter}${position.number}:${endLetter}${position.number}`;

        if (this.useCache) {
            const cacheData = this.getCacheData(`${SheetsManager.instanceCounter}-${this.currentSheetName}-${this.cacheId}-headers`);
            if (typeof cacheData !== 'boolean') return cacheData;
        }

        const tableHeaders = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.currentSheetId,
            range: range,
        });
        const response = tableHeaders?.data?.values?.length ? tableHeaders.data.values[0] : [];
        if (this.useCache) this.updateCache(`${SheetsManager.instanceCounter}-${this.currentSheetName}-${this.cacheId}-headers`, response);

        return response;
    };

    /**
     * @description Método para cambiar la posición de la tabla la cual se esta trabajando. Primero se ingresa la letra, separada por dos puntos del numero, ejemplo: H:13
     * @param positionTable Posición inicial de la tabla.  Formato: A:1 (opcional si ya se agrego en la instancia)
     * @returns {this}
     */
    public setTableInitPosition(positionTable: string): this {
        this.currentTablePosition = getPosition(positionTable);
        return this;
    };

    /**
     * @description Método para cambiar el ID de la hoja de calculo la cual esta siendo trabajada.
     * @param sheetId ID de la hoja de calculo. Esta puede ser encontrada en el URL
     * @returns {this}
     */
    public setSheetId(sheetId: string): this {
        this.currentSheetId = sheetId;
        return this;
    };

    /**
     * @description Método para cambiar el nombre de la hoja de calculo la cual esta siendo trabajada.
     * @param sheetName Nombre exacto de la hoja de calculo.
     * @returns {this}
     */
    public setSheetName(sheetName: string): this {
        this.currentSheetName = sheetName;
        return this;
    };

    /**
     * @description Método para cambiar el nombre de la hoja de calculo y su ID  en una única función.
     * @param sheetId  ID de la hoja de la hoja de calculo.
     * @param sheetName Nombre exacto de la hoja de calculo.
     * @returns {this}
     */
    public setSheetInfo(sheetId: string, sheetName: string): this {
        this.currentSheetId = sheetId;
        this.currentSheetName = sheetName;
        return this;
    };

    /**
     * @description Método para obtener todos los valores de una tabla, se pueden filtrar.
     * @param initialPosition Posición inicial de la tabla a trabajar.
     * @param filter Filtro para obtener los valores de la tabla filtrados. 
     * @returns {T[]} Todos los valores de la tabla indicada.
     */
    public async getTableValues<T = any>(options?: { initPosition?: string, filter?: { (val: T): boolean } }): Promise<T[]> {
        const { initPosition, filter } = options ?? { initPosition: undefined, filter: undefined };
        const position = initPosition ? getPosition(initPosition) : this.currentTablePosition;

        if (this.useCache) {
            const cache = this.getCacheData(`${SheetsManager.instanceCounter}-${this.currentSheetName}-${this.cacheId}-values`);
            if (typeof cache !== 'boolean') {
                if (filter) return cache.filter(filter);
                return cache;
            }
        }
        const [tableHeaders, endLetter, endNumber] = await Promise.all([this.getTableHeaders(initPosition), this.getLastColumn(position.letter, position.number), this.getLastRow(position.letter, position.number)]);
        const range = `${this.currentSheetName}!${position.letter}${position.number + 1}:${endLetter}${position.number + endNumber + 1}`;

        const tableBody = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.currentSheetId,
            range: range,
        });
        const bodyArray = tableBody.data?.values ?? [[]];
        const result: T[] = [];
        for (let i in bodyArray) {
            const row = bodyArray[i];
            const obj: { [prop: string]: string } = {};

            for (let j in tableHeaders) {
                const propName = tableHeaders[j];
                obj[propName] = row[j];
            };
            result.push(obj as T);
        };
        if (result.length === 1 && Object.values(result[0] as T[]).every(val => val === undefined)) return [];

        if (this.useCache) this.updateCache(`${SheetsManager.instanceCounter}-${this.currentSheetName}-${this.cacheId}-values`, result);
        return typeof filter === 'function' ? result.filter(filter) : result as T[];
    };

    /**
     * @description Método para insertar uno o mas valores a una tabla por medio de un arreglo de objetos.
     * @param initPosition Posición inicial de la tabla a trabajar. Formato: A:1 (Opcional si ya se agrego en la instancia)
     * @param values Valores a insertar a la tabla indicada por medio de un objeto.
     * @returns {boolean} `true` si se insertó correctamente, `false` si la inserción fracasó.
     */
    public async insertValues<T>({ initPosition, values }: { initPosition?: string, values: T[] }): Promise<boolean> {
        const position = initPosition ? getPosition(initPosition) : this.currentTablePosition;
        const finalValues = await this.objectToArray({ initPosition, values });
        const appendStatus = await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.currentSheetId,
            range: `${this.currentSheetName}!${position.letter}${position.number}`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: finalValues
            }
        });
        if (this.useCache) this.deleteCache(`${SheetsManager.instanceCounter}-${this.currentSheetName}-${this.cacheId}-values`);
        return successCodes.includes(appendStatus.status);
    };

    /**
     * @description Método para actualizar valores de la tabla por medio de un filtro. 
     * @param initPosition Posición inicial de la tabla a trabajar. Formato: A:1 (Opcional si ya se agrego en la instancia)
     * @param values Nuevos valores que tendrán las filas encontradas con el filtro.
     * @param filter Filtro con el que se buscarán las filas a afectar.
     * @returns {boolean[]} Lista de estados de los valores ingresados. 
     */
    public async updateValues<T = any>({ initPosition, filter, valuesUpdate }: { initPosition?: string, filter: { (val: T): boolean }, valuesUpdate: Partial<T> }): Promise<boolean> {
        const position = initPosition ? getPosition(initPosition) : this.currentTablePosition;
        const spreadsheetId = this.currentSheetId;
        const sheetName = this.currentSheetName;
        const [values, endLetter] = await Promise.all([this.getTableValues<T>({ initPosition }), this.getLastColumn(position.letter, position.number)]);
        const rowsToEdit: { rowNumber: number, values: T }[] = [];
        let currentRow = position.number
        for (const obj of values) {
            currentRow += 1;
            if (filter(obj)) rowsToEdit.push({
                rowNumber: currentRow,
                values: formatValues<T>(obj)
            });
        };

        if (rowsToEdit.length === 0) return;
        const requestData: sheets_v4.Schema$ValueRange[] = [];

        for (const row of rowsToEdit.toReversed()) {
            const finalValues = { ...row.values, ...valuesUpdate };
            const valuesToUpdate = await this.objectToArray({ initPosition, values: [formatValues<T>(finalValues)] });
            requestData.push({
                majorDimension: 'ROWS',
                values: valuesToUpdate,
                range: `${sheetName}!${position.letter}${row.rowNumber}:${endLetter}${row.rowNumber}`
            });
        };
        const savedStatus = await this.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: {
                valueInputOption: 'USER_ENTERED',
                data: requestData
            }
        })
        if (this.useCache) this.deleteCache(`${SheetsManager.instanceCounter}-${this.currentSheetName}-${this.cacheId}-values`);
        return successCodes.includes(savedStatus.status);
    };

    /**
     * @description Método para eliminar filas por medio de un filtro.
     * @param initPosition Posición inicial de la tabla a trabajar. Formato: A:1 (Opcional si ya se agrego en la instancia)
     * @param filter Filtro con el que se buscaran las filas y eliminarlas.
     * @returns {boolean} Estado de la operación: `true` para éxito y `false` para fracaso
     */
    public async deleteRowsByFilter<T>({ initPosition, filter }: { initPosition?: string, filter: (val: T) => boolean }): Promise<boolean> {
        const position = initPosition ? getPosition(initPosition) : this.currentTablePosition;
        const values = await this.getTableValues<T>({ initPosition: `${position.letter}:${position.number}` });
        const rowsToDelete: number[] = [];
        let currentRow = position.number;

        for (const row of values) {
            currentRow += 1;
            if (filter(row)) rowsToDelete.push(currentRow - 1);
        }

        if (rowsToDelete.length === 0) return false;
        const [sheetId, tableHeaders] = await Promise.all([this.getSheetIdBySheetName(), this.getTableHeaders(`${position.letter}:${position.number}`)]);
        const endLetter = sumLetter(position.letter, tableHeaders.length + 1);

        const deleteRequests = rowsToDelete.toReversed().map(row => ({
            deleteRange: {
                shiftDimension: 'ROWS',
                range: {
                    sheetId: sheetId,
                    startRowIndex: row,
                    endRowIndex: row + 1,
                    startColumnIndex: letterToNumber(position.letter),
                    endColumnIndex: letterToNumber(endLetter)
                }
            }
        }));

        const deleteResponse = await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.currentSheetId,
            requestBody: { requests: deleteRequests }
        });

        if (this.useCache) this.deleteCache(`${SheetsManager.instanceCounter}-${this.currentSheetName}-${this.cacheId}-values`);
        return successCodes.includes(deleteResponse.status);
    };
};
