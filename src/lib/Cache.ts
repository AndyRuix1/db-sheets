import type { ISheet$Cache$Options, ISheet$Cache$Structure } from '../types/Cache';
import { join as pathJoin } from 'path';
import { createFile, deleteFile, getFile, getSecondsDifferences } from './util';
import fs from 'fs';

export const ramCache: ISheet$Cache$Structure = {};
const cacheFolderName = 'cache';

export default abstract class Cache {
    private cacheOptions: ISheet$Cache$Options = {
        saveMode: 'json',
        updateFreq: 60
    }

    constructor(cacheOptions?: ISheet$Cache$Options, private cacheIdGenerated?: string) {
        this.cacheOptions = { ...this.cacheOptions, ...cacheOptions };
        if (this.cacheOptions.saveMode === 'json') this.prepareCache();
        if (this.cacheOptions.saveMode === 'ram') deleteFile(this.getCacheFilepath());
    }

    private getCacheFilepath(): string {
        return pathJoin(__dirname, `./${cacheFolderName}/${this.cacheIdGenerated}.json`);
    }

    private getCacheFolderPath(): string {
        return pathJoin(__dirname, `./${cacheFolderName}`);
    }

    private prepareCache() {
        const folderPath = this.getCacheFolderPath();
        const filePath = this.getCacheFilepath();
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
        if (fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}');
    }

    public deleteCache(cacheKey: string) {
        const { saveMode } = this.cacheOptions;
        const cacheFilepath = this.getCacheFilepath();

        if (saveMode === 'ram') {
            delete ramCache[cacheKey];
        } else if (saveMode === 'json' && fs.existsSync(cacheFilepath)) {
            const cacheFile = getFile(cacheFilepath);
            delete cacheFile[cacheKey];
            fs.writeFileSync(cacheFilepath, JSON.stringify(cacheFile, null, 2));
        }
    }

    public updateCache(cacheKey: string, newData: any) {
        const { saveMode } = this.cacheOptions;
        if (saveMode === 'ram') {
            ramCache[cacheKey] = {
                data: newData,
                lastUpdate: Date.now()
            };

        } else if (saveMode === 'json') {
            const filePath = this.getCacheFilepath();
            const cacheFile = getFile<ISheet$Cache$Structure>(filePath);

            let fileData: ISheet$Cache$Structure = typeof cacheFile === 'object' ? cacheFile : createFile<ISheet$Cache$Structure>(filePath, '{}');
            fileData[cacheKey] = {
                data: newData,
                lastUpdate: Date.now()
            }
            fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
        }
    }

    public getCacheData(cacheKey: string): ISheet$Cache$Structure['key']['data'] | boolean {
        const { saveMode, updateFreq } = this.cacheOptions;
        if (saveMode === 'ram') {
            if (!ramCache[cacheKey]) return false;
            const lastCacheUpdate = getSecondsDifferences(Date.now(), ramCache[cacheKey].lastUpdate);
            if (lastCacheUpdate > updateFreq) {
                this.deleteCache(cacheKey);
                return false;
            }
            return ramCache[cacheKey].data;
        } else if (saveMode === 'json') {
            const filePath = this.getCacheFilepath();
            const cacheFile = getFile<ISheet$Cache$Structure>(filePath);
            if (typeof cacheFile === 'boolean' || !cacheFile[cacheKey]?.lastUpdate) return false;
            const lastCacheUpdate = getSecondsDifferences(Date.now(), cacheFile[cacheKey].lastUpdate);
            if (lastCacheUpdate > updateFreq) {
                this.deleteCache(cacheKey);
                return false;
            }
            return cacheFile[cacheKey].data;
        }

    }
}

export const clearAllCache = () => {
    const folderPath = pathJoin(__dirname, cacheFolderName);
    if (fs.existsSync(folderPath)) fs.rmdirSync(folderPath, { recursive: true });
}