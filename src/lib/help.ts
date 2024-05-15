import type { ITablePosition } from "../types/Sheet";
export const successCodes: Readonly<number[]> = [200, 201, 202];

/**
 * @description Método para conocer la siguiente letra a partir de una, ejemplo: A -> B, AA -> AB, ZZ -> AAA
  * @param letter Letra a procesar
  * @returns Letra procesada.
 */
export function getNextLetterPosition(letter: string): string {
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
    return result.split("").toReversed().join("");
};

/**
 * @description Método para sumar letras a partir de una letra, ejemplo: (A, 2) -> C | (AA, 2) -> AC
 * @param letter Letra la cual se quiere sumar.
 * @param count Numero de veces para sumar la letra
 * @returns Letra correspondiente a las sumas anteriores.
 */
export function sumLetter(letter: string, count?: number): string {
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
export function letterToNumber(letter: string): number {
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
export function getPosition(position: string): ITablePosition {
    const positionSplitted = position.split(':');
    return {
        letter: positionSplitted[0],
        number: Number(positionSplitted[1])
    };
};

/**
 * @description Método para preparar valores.
 * @param values Objeto de los valores a trabajar 
 * @returns {T} Objeto con sus valores formateados (string numérico > números enteros)
 */
export function formatValues<T>(values: T): T {
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