# db-sheets
> db-sheets es una biblioteca de código abierto que ofrece una solución integral para la interacción con hojas de cálculo de Google Sheets. Diseñada para simplificar la gestión de datos en línea, esta herramienta permite acceder, actualizar, eliminar y escribir datos en hojas de cálculo de forma dinámica y eficiente.

## ❓ ¿Por qué usar esta herramienta?
> db-sheets se presenta como una herramienta esencial para los desarrolladores que buscan una solución efectiva para interactuar con hojas de cálculo de Google Sheets en sus aplicaciones. Esta biblioteca permite acceder, actualizar y manipular datos de hojas de cálculo de manera dinámica y eficiente utilizando JSON.
> 
> Un punto destacado de db-sheets es su capacidad para transformar automáticamente los datos de hojas de cálculo en objetos JSON, lo que facilita su manipulación y uso. Además, db-sheets ofrece una funcionalidad de caché que permite almacenar la información obtenida en la memoria RAM o en archivos JSON con la capacidad de configurar los tiempos de actualización, según la preferencia y necesidad del desarrollador.
> 
> Esta función de caché no solo ayuda a evitar limitaciones por exceso de peticiones a la API de Google Sheets, sino que también acelera las consultas al tener los datos almacenados localmente. Esto permite un desarrollo más eficiente y rápido, mejorando significativamente el rendimiento de la aplicación.


## 📖 Índice
> * [Historial de cambios](#📜-Historial-de-cambios)
> * [Instalación](#Instalación)
> * 


## 🔽 Instalación

```console
$ npm i db-sheets
```

## 📦 Requerimiento del paquete

#### ES Import:
```js
import { SheetsManager } from 'db-sheets';
```

#### CJS:
```js
const { SheetsManager } = require('db-sheets');
```

## 🌐 Conexión a Google Sheets

Para conectarte a en Google Sheets es necesario otorgar las credenciales de acceso básicas:
<br/>

**Email de cuenta de servicio (client_email):** El email de cuenta de servicio es una dirección asignada cuando creas credenciales en la consola de [Google Cloud](https://console.cloud.google.com/apis/api/sheets.googleapis.com). Este email se utiliza para autenticar tu aplicación y concederle acceso a las hojas de cálculo en Google Sheets.

**API Key (private_key):** La API Key es una clave de API que debes generar también en la consola de [Google Cloud Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts/details/). Esta clave permite que tu aplicación se comunique con la API de Google Sheets de forma segura y autorizada. Para usarla, se recomienda descargarla en formato JSON, extraer la clave y almacenarla de forma segura en una variable de entorno.


**Alcance de permisos (scope):** El alcance de permisos determina las acciones que tu aplicación puede realizar en las hojas de cálculo de Google Sheets a las que te conectes.
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

Además, puedes configurar uso de memoria caché desde la propia instancia agregando un objeto de configuraciones como segundo argumento, si no agregas un objeto de configuraciones no se usará caché y cada consulta realizada se hará directamente a la hoja de cálculo, esto es recomendable si puedes hacer peticiones sin límite con tu API Key.

```js
const options = {
    cache: {
        updateFreq: 60, // Frecuencia de actualización en segundos
        saveMode: 'json' // Puedes seleccionar 'ram' o 'json' | por defecto es 'json'
    }
}

const mySheet = new SheetsManager(connectionData, options);
```

De esta manera hemos establecido una conexión segura con Google Sheets, ahora ya podremos conectarnos a las hojas a las que nuestra cuenta de servicio previamente configurada tenga acceso.


## 📄 Conectarte a una hoja de cálculo

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

## 📄 Manipular la información de la hoja

Para poder realizar cualquier tipo de operación sobre tus hojas, es necesario establecer la posición inicial de tu tabla. Esta posición es donde inicia toda la estructura de tu tabla, recuerda que aquí estamos incluyendo las cabeceras de tu tabla.

En los siguientes ejemplos, usaremos la siguiente tabla llamada `empleados`, donde la cabecera `id` está ubicada en la columna `B` en la fila `2`: 

`empleados`:
| id  | nombre          | cargo        |
| --- | --------------- | ------------ |
| 1   | John Doe        | Gerente      |
| 2   | Carl Smith      | RRHH         |
| 3   | Sandra Gonzales | Contabilidad |
| 4   | Steve Johnson   | Contabilidad |

### Establecer posición de mi tabla

Para establecer la posición inicial de tu tabla, basta con utilizar el método `.setTableInitPosition`, como parámetro debes pasar la posición donde se encuentra el inicio de tu tabla, en el ejemplo anterior, dijimos que nuestra tabla se encuentra en la posición `B:2`, es importante separar la posición de la columna y de la fila con los dos puntos `:`.
Si no establecemos una posición inicial, por defecto se usará `A:1`.

```js
const tableInitPosition = 'B:2';
mySheet.setTableInitPosition(tableInitPosition);
```

Una vez establecida la posición de nuestra tabla, podremos realizar acciones de escritura y lectura sobre ella.

### Obtener cabeceras

Para obtener las cabeceras de nuestra tabla, podemos utilizar el método `.getTableHeaders`.

Parámetros:
* initPosition: podremos asignar el punto de inicio de nuestra tabla si no lo hicimos antes con el método `.setTableInitPosition`.

```js
const startTablePosition = 'B:2'; // Parámetro opcional
const headers = await mySheet.getTableHeaders(startTablePosition);

console.log(headers); // Esto retorna: ['id', 'nombre', 'cargo']
```

### Obtener valores

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

### Insertar valores

Para insertar valores en nuestra tabla, podremos utilizar el método `.insertValues` el cual recibe un único parámetro de configuración.

Propiedades del objeto de configuración:
* initPosition: initPosition: podremos asignar el punto de inicio de nuestra tabla si no lo hicimos antes con el método `.setTableInitPosition`.
* values: lista de valores a ingresar, estos datos deben ser ingresados en formato JSON respetando el estilo de la tabla.

```js
const options = {
    initPosition: 'B:2',
    values: [{ id: 5, nombre: 'Sarah Taylor', cargo: 'RRHH' }], // Puedes ingresar los valores necesarios.
}
const wasInserted = await mySheet.insertValues(options);
console.log(wasInserted); // retorna true o false, dependiendo del éxito de la operación.
```


### Modificar valores

Para modificar valores en nuestra tabla, podremos utilizar el método `.updateValues`


Si utilizas TypeScript, puedes utilizar tipos genéricos para ayudarte en el autocompletado y compilación de tu código:

```ts
type MyTable$Structure = {
    id: number;
    nombre: string;
    cargo: string
}

const employeeModified = {
    
}

const options = {
    filter: (empleado) => empleado.id === 5,

}
const wasUpdated = await mySheet.updateValues({})

```ts