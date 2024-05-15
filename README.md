<img src="https://i.ibb.co/RH96s8S/DB-Sheets.png" width='100%' />

> db-sheets es una biblioteca de código abierto que ofrece una solución integral para la interacción con hojas de cálculo de Google Sheets. Diseñada para simplificar la gestión de datos en línea, esta herramienta permite acceder, actualizar, eliminar y escribir datos en hojas de cálculo de forma dinámica y eficiente.

## ❔ ¿Por qué usar esta herramienta?
> db-sheets se presenta como una herramienta esencial para los desarrolladores que buscan una solución efectiva para interactuar con hojas de cálculo de Google Sheets en sus aplicaciones. Esta biblioteca permite acceder, actualizar y manipular datos de hojas de cálculo de manera dinámica y eficiente utilizando JSON.
> 
> Un punto destacado de db-sheets es su capacidad para transformar automáticamente los datos de hojas de cálculo en objetos JSON, lo que facilita su manipulación y uso. Además, db-sheets ofrece una funcionalidad de caché que permite almacenar la información obtenida en la memoria RAM o en archivos JSON con la capacidad de configurar los tiempos de actualización, según la preferencia y necesidad del desarrollador.
> 
> Esta función de caché no solo ayuda a evitar limitaciones por exceso de peticiones a la API de Google Sheets, sino que también acelera las consultas al tener los datos almacenados localmente. Esto permite un desarrollo más eficiente y rápido, mejorando significativamente el rendimiento de la aplicación.


# 📚 Índice
- [📚 Índice](#-índice)
- [📜 Historial de cambios](#-historial-de-cambios)
- [🔽 Instalación](#-instalación)
- [📦 Requerimiento del paquete](#-requerimiento-del-paquete)
- [🌐 Conexión a Google Sheets](#-conexión-a-google-sheets)
    - [Funcionalidad de Caché](#funcionalidad-de-caché)
    - [Configuración del Caché](#configuración-del-caché)
- [📄 Conectarte a una hoja de cálculo](#-conectarte-a-una-hoja-de-cálculo)
- [📄 Realizar operaciones en la hoja](#-realizar-operaciones-en-la-hoja)
  - [Establecer posición de mi tabla](#establecer-posición-de-mi-tabla)
  - [Obtener cabeceras](#obtener-cabeceras)
  - [Obtener valores](#obtener-valores)
  - [Insertar valores](#insertar-valores)
  - [Actualizar valores](#actualizar-valores)
  - [Eliminar filas](#eliminar-filas)
- [💻 Ejemplo práctico](#-ejemplo-práctico)
- [🛠️ Desarrollo](#️-desarrollo)
  - [Contribuciones](#contribuciones)
  - [Desarrolladores](#desarrolladores)



# 📜 Historial de cambios
* Para ver el historial de cambios, puedes consultar [este enlace](https://github.com/AndyRuix1/db-sheets/blob/main/CHANGELOG.md).

# 🔽 Instalación

```console
$ npm i db-sheets
```

Para un funcionamiento correcto de esta biblioteca, se recomienda utilizar `NodeJS v21.7.3` en adelante.

# 📦 Requerimiento del paquete

**ES Import**
```js
import { SheetsManager } from 'db-sheets';
```

**CJS**
```js
const { SheetsManager } = require('db-sheets');
```

# 🌐 Conexión a Google Sheets

Para conectarte a en Google Sheets es necesario otorgar las credenciales de acceso básicas, utilizando la instancia `SheetsManager` exportada desde `db-sheets` utilizando un objeto de configuraciones el cual requiere las siguientes propiedades:
<br/>

* **client_email:** El email de cuenta de servicio es una dirección asignada cuando creas credenciales en la consola de [Google Cloud](https://console.cloud.google.com/apis/api/sheets.googleapis.com). Este email se utiliza para autenticar tu aplicación y concederle acceso a las hojas de cálculo en Google Sheets.
* **private_key:** La API Key es una clave de API que debes generar también en la consola de [Google Cloud Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts/details/). Esta clave permite que tu aplicación se comunique con la API de Google Sheets de forma segura y autorizada. Para usarla, se recomienda descargarla en formato JSON, extraer la clave y almacenarla de forma segura en una variable de entorno.
* **scope:** El alcance de permisos determina las acciones que tu aplicación puede realizar en las hojas de cálculo de Google Sheets a las que te conectes.
Para poder realizar lectura y escritura, se recomienda utilizar el scope `https://www.googleapis.com/auth/spreadsheets`.

```js
// Usas la importación correspondiente
import { SheetsManager } from 'db-sheets';

const connectionData = {
    client_email: 'myClientEmail@example.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
}

const mySheet = new SheetsManager(connectionData);
```

### Funcionalidad de Caché

La funcionalidad de caché en `db-sheets` es una característica clave que mejora significativamente el rendimiento y la eficiencia de las aplicaciones que interactúan con Google Sheets. Esta funcionalidad permite almacenar los datos obtenidos en la memoria RAM o en archivos JSON, con opciones configurables para determinar la frecuencia de actualización. A continuación, se detallan las ventajas de cada tipo de caché:

**Caché en RAM:**
* Alta Velocidad de Acceso: Almacenar los datos en la memoria RAM permite un acceso extremadamente rápido a la información, lo que resulta en tiempos de respuesta casi instantáneos para las consultas.
* Reducción de Latencia: La RAM tiene una latencia mucho menor en comparación con el acceso a archivos en disco, lo que mejora el rendimiento general de la aplicación.
* Eficiencia en Aplicaciones de Alto Rendimiento: Ideal para aplicaciones que requieren un acceso constante y rápido a los datos, como las aplicaciones en tiempo real.

**Caché en Archivos JSON:**
* Facilidad de Uso y Portabilidad: Los archivos JSON son fáciles de manejar y transferir, lo que facilita la portabilidad de los datos entre diferentes sistemas y entornos.
* Menor Uso de Memoria: Utilizar archivos JSON reduce la carga sobre la memoria RAM, lo que es beneficioso para aplicaciones que tienen limitaciones de memoria o que manejan grandes volúmenes de datos.


### Configuración del Caché
Puedes configurar el uso de la memoria caché directamente desde la instancia de `SheetsManager` agregando un objeto de configuraciones como segundo argumento. Si no se agrega un objeto de configuraciones, no se usará caché y cada consulta se realizará directamente a la hoja de cálculo, lo cual es recomendable si puedes hacer peticiones sin límite con tu API Key.

```js
const options = {
    cache: {
        updateFreq: 60, // Frecuencia de actualización en segundos
        saveMode: 'json' // Puedes seleccionar 'ram' o 'json' | por defecto es 'json'
    }
}

const mySheet = new SheetsManager(connectionData, options);
```

⚠️ Nota: El almacenamiento en caché se eliminará al reiniciar la aplicación, independientemente del modo de almacenamiento.


De esta manera hemos establecido una conexión segura con Google Sheets, ahora ya podremos conectarnos a las hojas a las que nuestra cuenta de servicio previamente configurada tenga acceso.


# 📄 Conectarte a una hoja de cálculo

Para conectarte a una hoja de cálculo de Google Sheets solo se requiere el ID de la hoja de calculo, para saber cual es el ID puedes examinar el URL de Google Sheets y extraerlo directamente desde allí.
Por ejemplo, si tu URL luce asi `https://docs.google.com/spreadsheets/d/1CN4-45DDabcdefg/edit` entonces `1CN4-45DDabcdefg` sería el ID.

Recuerda que tu cuenta de servicio debe tener acceso a esta hoja, para asegurarte que esto sea así, basta con presionar el botón `compartir`, ingresar el correo de tu cuenta de servicio, otorgar permiso de lectura y escritura y guardar.

Para establecer el ID de tu hoja de cálculo, puedes utilizar el método `.setSheetId`:

```js
const sheetId = 'abcdef12345';
const mySheet = new SheetsManager(connectionData);
mySheet.setSheetId(sheetId);
```

Como tu hoja de cálculo tiene un conjunto de hojas, es necesario establecer el nombre exacto de la hoja en la que vas a realizar escritura y/o lectura, es importante respetar todos los caracteres incluyendo mayúsculas, minúsculas y números. También, es recomendable no usar espacios para una mayor precisión.

Para establecer el nombre de la hoja en la que se van a realizar las operaciones, puedes utilizar el método `.setSheetName`:

```js
const sheetName = 'hoja_1';
const mySheet = new SheetsManager(connectionData);
mySheet.setSheetName(sheetName);
```

De esta forma ya te habrás conectado a tu hoja de cálculo y realizar las operaciones que creas necesarias.
Puedes reducir código encadenando métodos:

```js
const sheetName = 'hoja_1';
const sheetId = 'abcdef12345';

const mySheet = new SheetsManager(connectionData)
    .setSheetName(sheetName)
    .setSheetId(sheetId);
```

Puedes usar el método `.setSheetInfo` que combina ambos ajustes para una configuración más rápida, este método es útil si solo vas a trabajar con una única hoja:

```js
const sheetId = 'abcdef12345';
const sheetName = 'hoja_1';

const mySheet = new SheetsManager(connectionData)
    .setSheetInfo(sheetId, sheetName);
```

# 📄 Realizar operaciones en la hoja

Para poder realizar cualquier tipo de operación sobre tus hojas, es necesario establecer la posición inicial de tu tabla. Esta posición es donde inicia toda la estructura de tu tabla, recuerda que aquí estamos incluyendo las cabeceras de tu tabla.

En los siguientes ejemplos, usaremos la siguiente tabla llamada `empleados`, donde la cabecera `id` está ubicada en la columna `B` en la fila `2`: 

`empleados`:
| id  | nombre          | cargo        |
| --- | --------------- | ------------ |
| 1   | John Doe        | Gerente      |
| 2   | Carl Smith      | RRHH         |
| 3   | Sandra Gonzales | Contabilidad |
| 4   | Steve Johnson   | Contabilidad |

## Establecer posición de mi tabla

Para establecer la posición inicial de tu tabla, basta con utilizar el método `.setTableInitPosition`, como parámetro debes pasar la posición donde se encuentra el inicio de tu tabla, en el ejemplo anterior, dijimos que nuestra tabla se encuentra en la posición `B:2`, es importante separar la posición de la columna y de la fila con los dos puntos `:`.
Si no establecemos una posición inicial, por defecto se usará `A:1`.

```js
const tableInitPosition = 'B:2';
mySheet.setTableInitPosition(tableInitPosition);
```

Una vez establecida la posición de nuestra tabla, podremos realizar acciones de escritura y lectura sobre ella.

## Obtener cabeceras

Para obtener las cabeceras de nuestra tabla, podemos utilizar el método `.getTableHeaders`.

Parámetros:
* initPosition: podremos asignar el punto de inicio de nuestra tabla si no lo hicimos antes con el método `.setTableInitPosition`.

```js
const startTablePosition = 'B:2'; // Parámetro opcional
const headers = await mySheet.getTableHeaders(startTablePosition);

console.log(headers); // Esto retorna: ['id', 'nombre', 'cargo']
```

## Obtener valores

Para obtener los valores de nuestra tabla, podemos utilizar el método `.getTableValues` el cual recibe un único parámetro de configuración.

Propiedades del objeto de configuración:
* initPosition: podremos asignar el punto de inicio de nuestra tabla si no lo hicimos antes con el método `.setTableInitPosition`.
* filter: Una vez se obtienen los valores de la tabla, puedes filtrarlos como filtrar cualquier arreglo común.


**Ejemplo obteniendo todos los valores:**

```js
const options = {
    initPosition: 'B:2', // Si ya lo estableciste en el constructor, no es necesario usarlo aquí.
}
const tableValues = await mySheet.getTableValues(options);

console.log(tableValues); 
/* 
Retorna: [
    {
        id: 1, 
        nombre: 'John Doe', 
        cargo: 'Gerente'
    }, 
    {
        id: 2,
        nombre: 'Carl Smith',
        cargo: 'RRHH'
    },
    {
        id: 3,
        nombre: 'Sandra Gonzales',
        cargo: 'Contabilidad'
    },
    {
        id: 4,
        nombre: 'Steve Johnson',
        cargo: 'Contabilidad'
    }
]
*/
```

**Ejemplo obteniendo valores filtrando la información:**

```js
const options = {
    initPosition: 'B:2', // Si ya lo estableciste en el constructor, no es necesario usarlo aquí.
    filter: (empleado) => empleado.cargo === 'Contabilidad'  
}

const tableValues = await mySheet.getTableValues(options);

console.log(tableValues);
/*
Retorna: 
    [
        {
            id: 3,
            nombre: 'Sandra Gonzales',
            cargo: 'Contabilidad'
        },
        {
            id: 4,
            nombre: 'Steve Johnson',
            cargo: 'Contabilidad'
        }
    ]
*/
```

Si utilizas TypeScript, puedes utilizar tipos genéricos para ayudarte en el autocompletado y compilación de tu código:

```ts
type MyTable$Structure = {
    id: number;
    nombre: string;
    cargo: string
}
const tableValues = await mySheet.getTableValues<MyTable$Structure>();
```

## Insertar valores

Para insertar valores en nuestra tabla, podremos utilizar el método `.insertValues` el cual recibe un único parámetro de configuración.

Propiedades del objeto de configuración:
* initPosition: podremos asignar el punto de inicio de nuestra tabla si no lo hicimos antes con el método `.setTableInitPosition`.
* values: lista de valores a ingresar, estos datos deben ser ingresados en formato JSON respetando el estilo de la tabla.

```js
const options = {
    initPosition: 'B:2',
    values: [{ id: 5, nombre: 'Sarah Taylor', cargo: 'RRHH' }], // Puedes ingresar los valores necesarios.
}
const wasInserted = await mySheet.insertValues(options);
console.log(wasInserted); // retorna true o false, dependiendo del éxito de la operación.
```

Si utilizas TypeScript, puedes utilizar tipos genéricos para ayudarte en el autocompletado y compilación de tu código:

```ts
type MyTable$Structure = {
    id: number;
    nombre: string;
    cargo: string
}
const wasInserted = await mySheet.insertValues<MyTable$Structure>(options);
```

## Actualizar valores

Para actualizar valores en nuestra tabla, podremos utilizar el método `.updateValues` el cual recibe un único parámetro de configuración.

Propiedades del objeto de configuración:
* initPosition: podremos asignar el punto de inicio de nuestra tabla si no lo hicimos antes con el método `.setTableInitPosition`.
* valuesUpdate: nuevos valores a ingresar a la tabla, estos datos deben ser ingresados en formato JSON respetando el estilo de la tabla.
* filter: función de filtrado para buscar las filas a afectar. 

```ts
const options = {
    initPosition: 'B:2',
    filter: (empleado) => empleado.cargo === 'Contabilidad',
    valuesUpdate: {
        cargo: 'Atención al cliente'
    }
}
const wasUpdated = await mySheet.updateValues(options);
console.log(wasUpdated); // retorna true o false, dependiendo del éxito de la operación.
```

De esta manera, todos los empleados que tengan el cargo `Contabilidad` ahora tendrán el cargo `Atención al cliente` sin afectar otros valores del mismo empleado.


Si utilizas TypeScript, puedes utilizar tipos genéricos para ayudarte en el autocompletado y compilación de tu código:

```ts
type MyTable$Structure = {
    id: number;
    nombre: string;
    cargo: string
}
const tableValues = await mySheet.updateValues<MyTable$Structure>(options);
```

## Eliminar filas

Para eliminar filas en nuestra tabla, podremos utilizar el método `.deleteRowsByFilter` el cual recibe un único parámetro de configuración.

Propiedades del objeto de configuración:
* initPosition: podremos asignar el punto de inicio de nuestra tabla si no lo hicimos antes con el método `.setTableInitPosition`.
* filter: función de filtrado para buscar las filas a afectar. 


```ts
const options = {
    initPosition: 'B:2',
    filter: (empleado) => empleado.cargo === 'RRHH'
}
const wasDeleted = await mySheet.deleteRowsByFilter(options);
console.log(wasDeleted); // retorna true o false, dependiendo del éxito de la operación.
```

De esta manera, todos los empleados con el cargo `RRHH` serán eliminados de la tabla.


# 💻 Ejemplo práctico

En el siguiente ejemplo se muestra un ejemplo simple y práctico utilizando las funciones exhibidas anteriormente

```ts
import { SheetsManager } from 'db-sheets';

// Definir el tipo para los libros
type Book = {
    id: number;
    title: string;
    author: string;
    year: number;
};

const connectionData = {
    client_email: 'myClientEmail@example.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
}

const mySheet = new SheetsManager(connectionData, {
    cache: {
        updateFreq: 60,
        saveMode: 'json'
    }
}).setSheetInfo('yourSheetId', 'yourSheetName');

async function getAllBooks(): Promise<Book[]> {
    try {
        return await mySheet.getTableValues<Book>();
    } catch (error) {
        console.error('Error al obtener los libros:', error);
        return [];
    }
}

async function addBook(book: Book): Promise<void> {
    try {
        const wasInserted = await mySheet.insertValues<Book>({ values: [book] });
        wasInserted ? console.log('¡Libro añadido correctamente!') : console.log('Hubo un error al añadir el libro.');
    } catch (error) {
        console.error('Error al añadir el libro:', error);
    }
}

async function updateBook(bookId: number, updatedData: Partial<Book>): Promise<void> {
    try {
        const wasUpdated = await mySheet.updateValues<Book>({
            filter: book => book.id === bookId,
            valuesUpdate: updatedData
        });
        wasUpdated ? console.log('¡Libro actualizado correctamente!') : console.log('Hubo un error al actualizar el libro.');
    } catch (error) {
        console.error('Error al actualizar el libro:', error);
    }
}

async function deleteBook(bookId: number): Promise<void> {
    try {
        const wasDeleted = await mySheet.deleteRowsByFilter<Book>(book => book.id === bookId);
        wasDeleted ? console.log('¡Libro eliminado correctamente!') : console.log('Hubo un error al eliminar el libro.');
    } catch (error) {
        console.error('Error al eliminar el libro:', error);
    }
}

async function main() {
    const newBook: Book = { id: 1, title: 'El señor de los anillos', author: 'J.R.R. Tolkien', year: 1954 };
    await addBook(newBook);

    const allBooks = await getAllBooks();
    console.log('Lista de libros: ', allBooks);

    const bookIdToUpdate = 1;
    const updatedData = { title: 'The Lord of the Rings' };
    await updateBook(bookIdToUpdate, updatedData);

    const updatedBooks = await getAllBooks();
    console.log('Lista de libros actualizada:');
    console.log(updatedBooks);

    const bookIdToDelete = 1;
    await deleteBook(bookIdToDelete);

    const remainingBooks = await getAllBooks();
    console.log('Lista de libros después de la eliminación: ', remainingBooks);
}

main();
```

# 🛠️ Desarrollo
Esta biblioteca se encuentra actualmente en desarrollo y es de código abierto. ¡Nos encanta la colaboración de la comunidad! Si deseas contribuir, puedes hacerlo de las siguientes maneras

## Contribuciones
* Si encuentras un error o tienes una sugerencia, por favor, abre un [issue](https://github.com/AndyRuix1/db-sheets/issues).
* Si quieres realizar mejoras o cambios en el código, eres bienvenido/a a hacer un [fork](https://github.com/AndyRuix1/db-sheets/fork) del repositorio, hacer tus modificaciones y enviar un [pull request](https://github.com/AndyRuix1/db-sheets/pulls).
## Desarrolladores
* [Andy Kenway](https://discord.com/users/340757879915151361)

<hr/>
<small>Gracias por usar</small>