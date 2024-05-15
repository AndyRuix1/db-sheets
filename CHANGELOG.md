<img src="https://i.ibb.co/RH96s8S/DB-Sheets.png" width='100%' />

# ⚙️ Historial de Cambios • db-sheets

¡Hola! Esta es la sección de registro de cambios de db-sheets,
puedes volver aquí para ver la información de cambios de las diferentes versiones, esto se actualizará cada vez que haya una nueva versión disponible.

## 📖 Glosario

* **Estable**: Versión estable con posibilidades mínimas de posesión de errores.
* **Experimental**: Versión experimental, puede contener funciones inestables o que podrían ser eliminadas o modificadas en el futuro.

# 📜 Versiones

### v1.3.0 - Estable

* Refactorización de método de actualización de datos `.updateValues()`, ahora es 9.2 veces más rápida.
* Refactorización de método de eliminación de filas `.deleteRowsByFilter()`, ahora es 9.8 veces más rápida.
* Solución de errores al sistema de caché.
* Ahora el caché puede almacenarse en RAM o sistema de almacenamiento del equipo.
* Se cambió el nombre de la clase de `Sheets` a `SheetManager`.
* Se cambió el nombre del método `changeSheetId` a `setSheetId` de la clase `SheetManager`.
* Se cambió el nombre del método `changeSheetName` a `setSheetName` de la clase `SheetManager`.
* Se cambió el nombre del método `changeSheetInfo` a `setSheetInfo` de la clase `SheetManager`.
* Se cambió el nombre del método `changeTableInitPosition` a `setTableInitPosition` de la clase `SheetManager`.
* Se mejoró el rendimiento general