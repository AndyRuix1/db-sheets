import { debug, inspect, promisify } from "util";
import Cache from "../lib/Cache";
const wait = promisify(setTimeout);

describe.skip('[JSON OPTION]: Pruebas unitarias del sistema de Cache', () => {
    const TestClass = class extends Cache { }
    const randomId = 'abc1234_json';
    const testInstanceConfigs: any = {
        saveMode: 'json',
        updateFreq: 2
    }

    const testInstance = new TestClass(testInstanceConfigs, randomId);

    test('Actualizar cache', () => {
        const updateData = { boolean: true, object: {}, array: [] };
        testInstance.updateCache('test1', updateData);
        const dataLoaded = testInstance.getCacheData('test1');
        expect(dataLoaded).toEqual(updateData);
    });

    test.skip('Eliminar cache', () => {
        testInstance.deleteCache('test1');
        const newData = testInstance.getCacheData('test1');
        expect(newData).toEqual(false);
    });
    test('Obtener cache vencido', async () => {
        await wait(testInstanceConfigs.updateFreq * 1000);
        const newData = await testInstance.getCacheData('test1');
        expect(newData).toEqual(false);
    }, 5000);
});

describe.skip('[RAM OPTION]: Pruebas unitarias del sistema de Cache', () => {
    const TestClass = class extends Cache { }
    const randomId = 'abc1234';
    const testInstanceConfigs: any = {
        saveMode: 'ram',
        updateFreq: 5
    }

    const testInstance = new TestClass(testInstanceConfigs, randomId);

    test('Actualizar cache', () => {
        const updateData = { boolean: true, object: {}, array: [] };
        testInstance.updateCache('test1', updateData);
        const dataLoaded = testInstance.getCacheData('test1');
        console.log({ dataLoaded });
        expect(dataLoaded).toEqual(updateData);
    });

    test.skip('Eliminar cache', () => {
        testInstance.deleteCache('test1');
        const newData = testInstance.getCacheData('test1');
        expect(newData).toEqual(false);
    });

    test('Obtener cache vencido', async () => {
        await wait(testInstanceConfigs.updateFreq * 1000);
        const newData = await testInstance.getCacheData('test1');
        expect(newData).toEqual(false);
    }, 5700);
});

describe.skip('[TWO OPTIONS]: Stress testing', () => {
    const getRandomId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const savedData = [];
    let ram = 0;
    let json = 0;
    test('Escribir muchos valores con distintas instancias', async () => {
        const repeats = 1000;
        const TestClass = class extends Cache { }

        const randomObjs = [{ name: 'John Doe' }, { name: 'Mark Erik' }, { item: 1, array: [] }, { array: [], obj: { subkey: true }, yes: true }, { nothing: true }, { test: false, a: null, f: true }, ['test1', 'test2', 'test3'], 1, 2, 3, 4, true, false];
        const randomElements = []
        const randomKeys = new Array(repeats).fill('').map((text: string, index: number) => `test${index}`);
        const options = ['ram', 'json'];
        for (const randomKey of randomKeys) {
            randomElements.push(randomObjs[Math.floor(Math.random() * randomObjs.length)]);
        }

        for (const randomElement of randomElements) {
            const option = options[Math.floor(Math.random() * options.length)];
            if (option === 'json') json += 1;
            else ram += 1;
            const testInstanceConfigs: any = {
                saveMode: option,
                updateFreq: Math.floor(Math.random() * 15) + 1
            }
            const testInstance = new TestClass(testInstanceConfigs, getRandomId());
            const key = randomKeys[Math.floor(Math.random() * randomKeys.length)];
            testInstance.updateCache(key, randomElement);
            const element = {
                instance: testInstance,
                key,
                mode: option,
                values: randomElement
            }
            savedData.push(element);
        }

    }, 90000);

    test('Leer todos los valores guardados de forma masiva', () => {
        console.log(`Intentando leer ${savedData.length} valores`);
        for (const dataSaved of savedData) {
            const dataLoaded = dataSaved.instance.getCacheData(dataSaved.key);
            expect(dataLoaded).toEqual(dataSaved.values);
        }
    }, 30000);

    test('Eliminar todos los valores de forma masiva y leer su eliminación', () => {
        for (const dataSaved of savedData) {
            dataSaved.instance.deleteCache(dataSaved.key);
            const dataLoaded = dataSaved.instance.getCacheData(dataSaved.key);
            expect(dataLoaded).toEqual(false);
        }
        console.log({ procesados: { ram, json } })
    }, 50000);
})