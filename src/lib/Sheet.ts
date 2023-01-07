import { google, sheets_v4 } from 'googleapis';
import { GoogleAuth, JWT } from 'google-auth-library';

interface IAuthData {
    client_email: string;
    private_key: string;
    scopes: string[];
};

export default class Sheets {
    private sheets: sheets_v4.Sheets;
    private jwtClient: JWT;
    private gAuth: GoogleAuth;
    private currentSheetId: string = '';
    private currentSheetName: string = '';
    private currentTablePosition: { letter: string; number: number } = { letter: 'A', number: 1 };

    private gAuthCreds: IAuthData = {
        client_email: '',
        private_key: '',
        scopes: []
    };

    constructor(authInfo: IAuthData) {
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
     * @description Metodo para conocer la siguiente letra a partir de una, ejemplo: A -> B, AA -> AB, ZZ -> AAA
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
     * @description metodo para sumar letras a partir de una letra, ejemplo: (A, 2) -> C | (AA, 2) -> AC
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
     * @description Retorna el numero correspondiente al abecedario, en caso de superar la Z (ej: AA, AB, etc) se devuelve el numero correspondiente para una hoja de calcula. 
     * @param letter Letra la cual requiere transformar a numerico.
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
     * @description Formatea la posicion para hacerla mas manejable.
     * @param position Posicion a formatear, ejemplo: B:4
     * @returns Se retorna un objeto separando la letra del numero.
     */
    private getPosition(position: string): { letter: string, number: number } {
        return {
            letter: position.split(':')[0],
            number: parseInt(position.split(':')[1])
        };
    };

    /**
     * @description obtiene la ultima columna con un valor. 
     * @param positionLetter Letra de la posicion inicial de la tabla.
     * @param positionNumber Numero de la posicion inicial de la tabla
     * @returns Se retorna el numero del ultimo valor de una columna en la posicion indicada
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
     * @description Obtener la posicion del ultimo valor conocido en una fila.
     * @param positionLetter Letra de la posicion inicial de la tabla
     * @param positionNumber Numero de la posicion inicial de la tabla
     * @returns Se retorna el numero del ultimo valor de la fila en la posicion indicada.
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
     * @description metodo para preparar un objeto con datos para un arreglo, esto es necesario para hacer insercion en las tablas.
     * @param initPosition Posicion de la tabla a trabajar (opcional si ya se aplico definicion desde la clase) 
     * @param values Datos a ser procesados.
     * @returns Arreglo con todos los datos preparados para ser insertados en su respectiva tabla
     */
    private async objectToArray({ initPosition, values }: { initPosition?: string, values: any[] }): Promise<string[][]> {
        const position = initPosition ? this.getPosition(initPosition) : this.currentTablePosition;

        const headers = await this.getTableHeaders(initPosition);
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
     * @description Metodo para preparar valores.
     * @param values Objeto de los valores a trabajar 
     * @returns {T} Objeto con sus valores formateados (string numerico > numeros enteros)
     */
    private formatValues<T>(values: T): T {
        const valuesObject = { ...values };
        if (typeof values === 'object' && values !== null) {
            for (let i = 0; i < Object.keys(valuesObject as Object).length; i++) {
                const key = Object.keys(values as Object)[i] ?? '';
                //@ts-ignore
                if (typeof valuesObject[key] === 'string' && !isNaN(valuesObject[key])) valuesObject[key] = parseInt(valuesObject[key]);
            };
        };
        return valuesObject as T;
    };

    /**
     * @description metodo para obtener la posicion de la hoja entre las demas.
     * @returns Se obtiene el numero de la hoja (su posicion exacta entre todas las hojas)
     */
    private async getSheetIdBySheetName(): Promise<number> {
        const sheetResponse = await this.sheets.spreadsheets.get({ spreadsheetId: this.currentSheetId });
        const sheets = sheetResponse.data.sheets;
        let sheetId = 0;
        if (!sheets) return 0;
        for (let i = 0; i < sheets.length; i++) {
            if (sheets[i]?.properties?.title === this.currentSheetName) {
                sheetId = i;
                break;
            };
        };
        return sheetId;
    };

    /**
     * @description Metodo para obtener todsa las cabeceras de una tabla.
     * @param initialPosition Posicion inicial de la tabla a trabajar: Ej: A:2 (opcional si ya se agrego en la instancia).
     * @returns Cabeceras de la tabla completa desde el inicio hasta la posicion con valor conocida.
     */
    public async getTableHeaders(initialPosition?: string): Promise<string[]> {
        const position = initialPosition ? this.getPosition(initialPosition) : this.currentTablePosition;
        const endLetter = await this.getLastColumn(position.letter, position.number)
        const tableHeaders = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.currentSheetId,
            range: `${this.currentSheetName}!${position.letter}${position.number}:${endLetter}${position.number}`,
        });
        return tableHeaders?.data?.values?.length ? tableHeaders.data.values[0] : [];
    };

    /**
     * @description Metodo para cambiar la posicion de la tabla la cual se esta trabajando. Primero se ingresa la letra, separada por dos puntos del numero, ejemplo: H:13
     * @param positionTable Posicion inicial de la tabla.  Formato: A:1 (opcional si ya se agrego en la instancia)
     * @returns {this}
     */
    public changeTableInitPosition(positionTable: string): this {
        this.currentTablePosition = this.getPosition(positionTable);
        return this;
    };

    /**
     * @description Metodo para cambiar el ID de la hoja de calculo la cual esta siendo trabajda.
     * @param sheetId ID de la hoja de calculo. Esta puede ser encontrada en el URL
     * @returns {this}
     */
    public changeSheetId(sheetId: string): this {
        this.currentSheetId = sheetId;
        return this;
    };

    /**
     * @description Metodo para cambiar el nombre de la hoja de calculo la cual esta siendo trabajada.
     * @param sheetName Nombre exacto de la hoja de calculo.
     * @returns {this}
     */
    public changeSheetName(sheetName: string): this {
        this.currentSheetName = sheetName;
        return this;
    };

    /**
     * @description Metodo para cambiar el nombre de la hoja de calculo y su ID  en una unica funcion.
     * @param sheetName Nombre exacto de la hoja de calculo.
     * @param sheetId  ID de la hoja de la hoja de calculo.
     * @returns {this}
     */
    public changeSheetInfo(sheetName: string, sheetId: string): this {
        this.currentSheetId = sheetId;
        this.currentSheetName = sheetName;
        return this;
    };

    /**
     * @description Metodo para obtener todos los valores de una tabla, se pueden filtrar.
     * @param initialPosition Posicion inicial de la tabla a trabajar.
     * @param filter Filtro para obtener los valores de la tabla filtrados. 
     * @returns {T[]} Todos los valores de la tabla indicada.
     */
    public async getTableValues<T>({ initPosition, filter }: { initPosition?: string, filter?: { (val: T): boolean } }): Promise<T[]> {
        const position = initPosition ? this.getPosition(initPosition) : this.currentTablePosition;
        const tableHeaders = await this.getTableHeaders(initPosition);
        const endLetter = await this.getLastColumn(position.letter, position.number);
        const endNumber = await this.getLastRow(position.letter, position.number);

        const tableBody = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.currentSheetId,
            range: `${this.currentSheetName}!${position.letter}${position.number + 1}:${endLetter}${position.number + endNumber + 1}`,
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
        if (typeof filter === 'function') return result.filter(filter) as T[];
        return result as T[];
    };

    /**
     * @description Metodo para insertar uno o mas valores a una tabla por medio de un arreglo de objetos.
     * @param initPosition Posicion inicial de la tabla a trabajar. Formato: A:1 (Opcional si ya se agrego en la instancia)
     * @param values Valores a insertar a la tabla indicada por medio de un objeto.
     */
    public async insertValues<T>({ initPosition, values }: { initPosition?: string, values: T[] }) {
        const position = initPosition ? this.getPosition(initPosition) : this.currentTablePosition;
        const finalValues = await this.objectToArray({ initPosition, values });
        await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.currentSheetId,
            range: `${this.currentSheetName}!${position.letter}${position.number}`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: finalValues
            }
        });
    };

    /**
     * @description Metodo para actualizar valores de la tabla por medio de un filtro. 
     * @param initPosition Posicion inicial de la tabla a trabajar. Formato: A:1 (Opcional si ya se agrego en la instancia)
     * @param values Valores que tendran las filas afectadas por el filtro.
     * @param filter Filtro con el que se buscaran las filas y afectar.
     */
    public async updateValues<T>({ initPosition, filter, valuesUpdate }: { initPosition?: string, filter: { (val: T): boolean }, valuesUpdate: T }): Promise<void> {
        const position = initPosition ? this.getPosition(initPosition) : this.currentTablePosition;
        const spreadsheetId = this.currentSheetId;
        const sheetName = this.currentSheetName;
        const values = await this.getTableValues<T>({ initPosition });
        const endLetter = await this.getLastColumn(position.letter, position.number);
        const rowsToEdit: number[] = [];
        let currentRow = position.number
        for (let i in values) {
            currentRow += 1;
            const obj = values[i];
            if (filter(obj)) rowsToEdit.push(currentRow);
        };
        if (rowsToEdit.length === 0) return;

        for (let row of rowsToEdit.reverse()) {
            const initialValues = values.filter(filter)[0];
            const finalValues = { ...initialValues, ...valuesUpdate };
            const valuesToUpdate = await this.objectToArray({ initPosition, values: [this.formatValues<T>(finalValues)] },);
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!${position.letter}${row}:${endLetter}${row}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: valuesToUpdate
                },
            });
        };
    };

    /**
     * @description Metodo para eliminar filas por medio de un filtro.
     * @param initPosition Posicion inicial de la tabla a trabajar. Formato: A:1 (Opcional si ya se agrego en la instancia)
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
        const sheetId = await this.getSheetIdBySheetName();
        const tableHeaders = await this.getTableHeaders(initPosition);
        const endLetter = this.sumLetter(position.letter, tableHeaders.length + 1);

        for (let row of rowsToDelete.reverse()) {
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
        };
    };
};
