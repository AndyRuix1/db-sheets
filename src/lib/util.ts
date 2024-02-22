import fs from 'fs';

export const generateRandomId = (): string => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
export const getSecondsDifferences = (startTimeInMillis: number, endTimeInMillis: number) => Math.abs((endTimeInMillis - startTimeInMillis) / 1000);

export const updateFile = (path: string, content: any): boolean => {
    if (!fs.existsSync(path)) return false;
    fs.writeFileSync(path, JSON.stringify(content, null, 2));
    return true;
}

export function getFile<T = NodeRequire>(path: string): boolean | T {
    if (!fs.existsSync(path)) return false;
    return require(path);
}

export const deleteFile = (path: string): boolean => {
    if (!fs.existsSync(path)) return false;
    fs.unlinkSync(path);
    return true;
}
export function createFile<T = NodeRequire>(path: string, content: string): T {
    fs.writeFileSync(path, content);
    return require(path) as T;
}