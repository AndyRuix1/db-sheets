import type { ISheet$Cache$Options, ISheet$Cache$Structure } from '../types/Cache';
import fs from 'fs';
import { join as pathJoin } from 'path';
import { createFile, deleteFile, getFile, getSecondsDifferences } from './util';

export let ramCache: ISheet$Cache$Structure = {};
const cacheFolderName = 'cache'

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

        if (saveMode === 'ram' && ramCache[this.cacheIdGenerated].data[cacheKey]) {
            delete ramCache[this.cacheIdGenerated].data[cacheKey];
        } else if (saveMode === 'json' && fs.existsSync(cacheFilepath)) {
            const cacheFile = getFile(cacheFilepath);
            delete cacheFile[cacheKey];
            fs.writeFileSync(cacheFilepath, JSON.stringify(cacheFile, null, 2));
        }
    }

    public updateCache(cacheKey: string, newData: any) {
        const { saveMode } = this.cacheOptions;

        if (saveMode === 'ram') {
            ramCache[this.cacheIdGenerated] = {
                data: {
                    [cacheKey]: newData
                },
                lastUpdate: Date.now()
            }
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

    public getCacheData(cacheKey: string): ISheet$Cache$Structure[0]['data'] | boolean {
        const { saveMode, updateFreq } = this.cacheOptions;
        if (saveMode === 'ram') {
            const lastCacheUpdate = getSecondsDifferences(Date.now(), ramCache[this.cacheIdGenerated]?.lastUpdate);
            if (lastCacheUpdate > updateFreq) {
                this.deleteCache(cacheKey);
                return false;
            };
            return ramCache[this.cacheIdGenerated]?.data[cacheKey] ?? false;
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

    public getAllCache() {
        const { saveMode } = this.cacheOptions;
        if (saveMode === 'ram') return ramCache;
        else if (saveMode === 'json') return getFile(this.getCacheFilepath());

    }

}

export const clearAllCache = () => {
    console.log('BORRAR CACHE ACTIVADO');
    const folderPath = pathJoin(__dirname, cacheFolderName);
    if (fs.existsSync(folderPath)) fs.rmdirSync(folderPath, { recursive: true });
}