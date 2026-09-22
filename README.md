SHOTCRETE CALC PRO

Calculadora web para estimar volúmenes de shotcrete en labores mineras.

La aplicación permite realizar cálculos para Avance, Resane y Malla, utilizando las dimensiones ingresadas por el usuario y los parámetros establecidos para el cálculo.

Funcionalidades

Avance

Permite ingresar:

* Altura (H)
* Ancho (A)
* Avance (L)
* Espesor de shotcrete

Se pueden agregar varias mediciones de H, A y L. Cuando existen varias mediciones, la aplicación utiliza el promedio de los valores ingresados.

El cálculo muestra:

* Perímetro
* Área
* Volumen base
* Volumen contractual
* SH Sacrificio 1”
* M³ Labor 1”
* SH Sacrificio 2”
* M³ Labor 2”
* Calibradores

El espesor seleccionado se convierte automáticamente de pulgadas a metros para realizar los cálculos.

Resane

Permite ingresar:

* Altura (H)
* Avance (L)

Calcula:

* Perímetro
* Área
* Volumen de resane
* Calibradores

El rendimiento utilizado para el cálculo de resane es:

11.5 m²/m³

Malla

Permite ingresar:

* Altura (H)
* Ancho (A)
* Avance (L)

Calcula:

* Perímetro
* Área
* Volumen de malla

El rendimiento utilizado es:

21 m²/m³

Parámetros de cálculo

Avance

Los parámetros utilizados son:

* Rebote (Rb): 1.10
* Rugosidad (R): 1.16
* Factor de ajuste/revestimiento (FARC): 0.90
* Sobreespesor contractual: 0.20 m³

Volumen base

El volumen base se calcula mediante:

V_base = Rb × R × espesor × L × P × FARC

donde el espesor ingresado en pulgadas se convierte previamente a metros.

Volumen contractual

V_contrato = V_base + 0.20

Sacrificio de 1”

SH_1 = longitudSacrificio × Rb × R × FARC × 0.0254

Sacrificio de 2”

SH_2 = longitudSacrificio × Rb × R × FARC × 0.0508

La longitud utilizada para el sacrificio es:

longitudSacrificio = 2 × max(H - 1.5, 0) + 2 × A

Los volúmenes de labor son:

M³ Labor 1" = V_base + SH_1

M³ Labor 2" = V_base + SH_2

Flujo de cálculo

1. Seleccionar el modo de trabajo.
2. Ingresar las dimensiones.
3. En Avance, seleccionar el espesor requerido.
4. Presionar CALCULAR.
5. Revisar los resultados.
6. Opcionalmente copiar el reporte o generar el PDF.
7. Utilizar LIMPIAR para borrar los datos manteniendo el modo seleccionado.

Los resultados se invalidan cuando se modifica una entrada de cálculo y deben volver a calcularse mediante el botón CALCULAR.

Reportes

La aplicación permite:

* Copiar el reporte de cálculo.
* Generar un PDF.
* Compartir el PDF cuando el dispositivo/navegador lo permite.
* Adjuntar fotografías como evidencia al reporte PDF.

Las fotografías se utilizan como evidencia temporal para la generación del PDF.

Validación de datos

La aplicación valida los valores ingresados antes de realizar el cálculo.

Los campos vacíos de mediciones adicionales son ignorados y el promedio se obtiene únicamente con los valores positivos ingresados.

Tecnologías

* React
* TypeScript
* Vite
* TanStack Router
* Tailwind CSS
* jsPDF
* Sonner
* Lucide React

Desarrollo local

Instalar dependencias:

npm install

Ejecutar en desarrollo:

npm run dev

Generar la versión de producción:

npm run build

Previsualizar la versión de producción:

npm run preview

Ejecutar el lint:

npm run lint

Estado del proyecto

El proyecto se encuentra en desarrollo y está orientado al cálculo de volúmenes de shotcrete para trabajos mineros.

Las fórmulas y parámetros deben mantenerse de acuerdo con los criterios y condiciones establecidos para el cálculo utilizado en operación.
