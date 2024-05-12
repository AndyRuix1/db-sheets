import type { IAuthData, ITablePosition, ISheet$Options } from '../types/Sheet';
import { google, sheets_v4 } from 'googleapis';
import { GoogleAuth, JWT } from 'google-auth-library';
import { generateRandomId } from './util';
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
     * @description Método para conocer la siguiente letra a partir de una, ejemplo: A -> B, AA -> AB, ZZ -> AAA
     * @param letter Letra a procesar
     * @returns Letra procesada.
     */
    private getNextLetterPosition(letter: string): string {
        let result = "";
        if (letter === 'Z') return 'AA';
        for (let i = letter.length - 1; i >= 0; i--) {
            const c = letter[i];
            if (c === "Z") result += "A";
            else {
                result += String.fromCharCode(c.charCodeAt(0) + 1);
                break;
            };
        };
        if (result.length < letter.length) result += "A".repeat(letter.length - result.length);
        return result.split("").reverse().join("");
    };

    /**
     * @description Método para sumar letras a partir de una letra, ejemplo: (A, 2) -> C | (AA, 2) -> AC
     * @param letter Letra la cual se quiere sumar.
     * @param count Numero de veces para sumar la letra
     * @returns Letra correspondiente a las sumas anteriores.
     */
    private sumLetter(letter: string, count?: number): string {
        letter = letter.toUpperCase();
        if (!count) count = 1;
        for (let i = 0; i < count; i++) {
            letter = this.getNextLetterPosition(letter);
        };
        return letter;
    };

    /**
     * @description Retorna el numero correspondiente al abecedario, en caso de superar la Z (ej: AA, AB, etc) se devuelve el numero correspondiente para una hoja de calculo.
     * @param letter Letra la cual requiere transformar a numérico.
     * @return numero correspondiente a la letra.
     */
    private letterToNumber(letter: string): number {
        if (letter.length > 1) {
            let letterNumber = 0;
            for (let i = 0; i < letter.length; i++) {
                letterNumber = letterNumber * 26 + letter.charCodeAt(i) - 64;
            }
            return letterNumber;
        };
        return letter.charCodeAt(0) - 65;
    };

    /**
     * @description Formatea la posición para hacerla mas manejable.
     * @param position Posición a formatear, ejemplo: B:4
     * @returns Se retorna un objeto separando la letra del numero.
     */
    private getPosition(position: string): ITablePosition {
        const positionSplitted = position.split(':');
        return {
            letter: positionSplitted[0],
            number: Number(positionSplitted[1])
        };
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
            if (values[i]) lastColumnWithValue = this.sumLetter(lastColumnWithValue);
        };

        if (lastColumnWithValue.length > 0) {
            const range = `${this.currentSheetName}!${positionLetter}${currentRow}:IV${currentRow}`;
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.currentSheetId,
                range: range,
            });
            values = response?.data?.values ? response?.data?.values[0] : [];
            for (let i in values) {
                lastColumnWithValue = this.sumLetter(lastColumnWithValue);
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
        const position = initPosition ? this.getPosition(initPosition) : this.currentTablePosition;
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
     * @description Método para preparar valores.
     * @param values Objeto de los valores a trabajar 
     * @returns {T} Objeto con sus valores formateados (string numérico > números enteros)
     */
    private formatValues<T>(values: T): T {
        const valuesObject = { ...values };
        if (typeof values === 'object' && values !== null) {
            const keysLength = Object.keys(valuesObject as Object).length;
            for (let i = 0; i < keysLength; i++) {
                const key = Object.keys(values as Object)[i] ?? '';
                if (typeof valuesObject[key] === 'string' && !isNaN(valuesObject[key])) valuesObject[key] = parseInt(valuesObject[key]);
            };
        };
        return valuesObject as T;
    };

    /**
     * @description Método para obtener la posición de la hoja entre las demás.
     * @returns Se obtiene el numero de la hoja (su posición exacta entre todas las hojas)
     */
    private async getSheetIdBySheetName(): Promise<number> {
        const sheetResponse = await this.sheets.spreadsheets.get({ spreadsheetId: this.currentSheetId });
        const sheets = sheetResponse.data.sheets;
        if (!sheets) return 0;
        let sheetId = 0;
        const sheetsLength = sheets.length;
        for (let i = 0; i < sheetsLength; i++) {
            if (sheets[i]?.properties?.title === this.currentSheetName) {
                sheetId = i;
                break;
            };
        };
        return sheetId;
    };

    /**
     * @description Método para obtener todas las cabeceras de una tabla.
     * @param initialPosition Posición inicial de la tabla a trabajar: Ej: A:2 (opcional si ya se agrego en la instancia).
     * @returns Cabeceras de la tabla completa desde el inicio hasta la posición con valor conocida.
     */
    public async getTableHeaders(initialPosition?: string): Promise<string[]> {
        const position = initialPosition ? this.getPosition(initialPosition) : this.currentTablePosition;
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
        this.currentTablePosition = this.getPosition(positionTable);
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
        const { initPosition, filter } = options;
        const position = initPosition ? this.getPosition(initPosition) : this.currentTablePosition;
        const tableHeaders = await this.getTableHeaders(initPosition);
        const endLetter = await this.getLastColumn(position.letter, position.number);
        const endNumber = await this.getLastRow(position.letter, position.number);
        const range = `${this.currentSheetName}!${position.letter}${position.number + 1}:${endLetter}${position.number + endNumber + 1}`;

        if (this.useCache) {
            const cache = this.getCacheData(`${SheetsManager.instanceCounter}-${this.currentSheetName}-${this.cacheId}-values`);
            if (typeof cache !== 'boolean') {
                if (filter) return cache.filter(filter);
                return cache;
            }
        }

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
        const position = initPosition ? this.getPosition(initPosition) : this.currentTablePosition;
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
        return [200, 201, 202].includes(appendStatus.status);
    };

    /**
     * @description Método para actualizar valores de la tabla por medio de un filtro. 
     * @param initPosition Posición inicial de la tabla a trabajar. Formato: A:1 (Opcional si ya se agrego en la instancia)
     * @param values Valores que tendrán las filas afectadas por el filtro.
     * @param filter Filtro con el que se buscaran las filas y afectar.
     */
    public async updateValues<T>({ initPosition, filter, valuesUpdate }: { initPosition?: string, filter: { (val: T): boolean }, valuesUpdate: T }): Promise<void> {
        const position = initPosition ? this.getPosition(initPosition) : this.currentTablePosition;
        const spreadsheetId = this.currentSheetId;
        const sheetName = this.currentSheetName;
        const [values, endLetter] = await Promise.all([this.getTableValues<T>({ initPosition }), this.getLastColumn(position.letter, position.number)]);
        const rowsToEdit: number[] = [];
        let currentRow = position.number
        for (let i in values) {
            currentRow += 1;
            const obj = values[i];
            if (filter(obj)) rowsToEdit.push(currentRow);
        };
        if (rowsToEdit.length === 0) return;

        for (let row of rowsToEdit.toReversed()) {
            const initialValues = values.filter(filter)[0];
            const finalValues = { ...initialValues, ...valuesUpdate };
            const valuesToUpdate = await this.objectToArray({ initPosition, values: [this.formatValues<T>(finalValues)] });
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!${position.letter}${row}:${endLetter}${row}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: valuesToUpdate
                },
            });
        };
        if (this.useCache) this.deleteCache(`${SheetsManager.instanceCounter}-${this.currentSheetName}-${this.cacheId}-values`);
    };

    /**
     * @description Método para eliminar filas por medio de un filtro.
     * @param initPosition Posición inicial de la tabla a trabajar. Formato: A:1 (Opcional si ya se agrego en la instancia)
     * @param filter Filtro con el que se buscaran las filas y eliminarlas.
     */
    public async deleteRowsByFilter<T>({ initPosition, filter }: { initPosition?: string, filter: { (val: T): boolean } }) {
        const position = initPosition ? this.getPosition(initPosition) : this.currentTablePosition;
        const values = await this.getTableValues<T>({ initPosition });
        const rowsToDelete: number[] = [];
        let currentRow = position.number;
        for (let i in values) {
            currentRow += 1;
            const row = values[i];
            if (filter(row)) rowsToDelete.push(currentRow);
        };

        if (rowsToDelete.length === 0) return;
        const [sheetId, tableHeaders] = await Promise.all([this.getSheetIdBySheetName(), this.getTableHeaders(initPosition)]);
        const endLetter = this.sumLetter(position.letter, tableHeaders.length + 1);

        for (const row of rowsToDelete.toReversed()) {
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.currentSheetId,
                requestBody: {
                    requests: [
                        {
                            deleteRange: {
                                shiftDimension: 'ROWS',
                                range: {
                                    sheetId: sheetId,
                                    startRowIndex: row - 1,
                                    endRowIndex: row,
                                    startColumnIndex: this.letterToNumber(position.letter),
                                    endColumnIndex: this.letterToNumber(endLetter)
                                }
                            }
                        }
                    ]
                }
            });
            if (this.useCache) this.deleteCache(`${SheetsManager.instanceCounter}-${this.currentSheetName}-${this.cacheId}-values`);
        };
    };
};
