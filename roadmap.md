Roadmap — PDR Shotcrete

Estado actual

La calculadora web se encuentra funcional y lista para pasar a la etapa de empaquetado móvil.

Funcionalidades implementadas

* [x]	Calculadora de Avance
* [x]	Calculadora de Resane
* [x]	Calculadora de Malla
* [x]	Ingreso de múltiples mediciones de H, A y L
* [x]	Promedio automático de las mediciones ingresadas
* [x]	Ignorar filas adicionales que permanezcan vacías
* [x]	Validación de rangos de entrada
* [x]	Botón CALCULAR
* [x]	Botón LIMPIAR
* [x]	Invalidación de resultados cuando cambian los datos de cálculo
* [x]	Espesor configurable para Avance
* [x]	Conversión automática de pulgadas a metros
* [x]	FARC fijo en 0.90
* [x]	Rebote fijo en 1.10
* [x]	Rugosidad fija en 1.16
* [x]	Cálculo de volumen según contrato
* [x]	Cálculo de SH 1”
* [x]	Cálculo de SH 2”
* [x]	Cálculo de M³ Labor 1”
* [x]	Cálculo de M³ Labor 2”
* [x]	Cálculo de calibradores
* [x]	Área mostrada en Avance ajustada por FARC sin alterar las fórmulas dependientes
* [x]	Generación de reportes PDF
* [x]	Copiar reporte
* [x]	Compartir PDF
* [x]	Evidencia fotográfica
* [x]	Máximo de 10 fotografías por reporte
* [x]	Compresión de fotografías para el PDF
* [x]	Fotografías distribuidas en el PDF
* [x]	Manifest de aplicación
* [x]	Service Worker para funcionamiento offline después de la primera carga
* [x]	Iconos de aplicación
* [x]	Manejo de errores de la aplicación
* [x]	CI de GitHub para verificar la compilación
* [x]	Aplicación desplegada en Vercel

Fórmulas vigentes

Avance

Perímetro

P = 2H + A

Área mostrada

Área = P × L × FARC

con:

FARC = 0.90

El área mostrada es únicamente un dato de presentación y no reemplaza las variables utilizadas directamente por las demás fórmulas.

Volumen base

V_base = Rb × R × e × L × P × FARC

donde:

* Rb = 1.10
* R = 1.16
* FARC = 0.90
* e = espesor seleccionado convertido de pulgadas a metros

Volumen según contrato

V_contrato = V_base + 0.20

Sacrificio 1”

SH_1 = [2(H − 1.5) + 2A] × Rb × R × FARC × 0.0254

Sacrificio 2”

SH_2 = [2(H − 1.5) + 2A] × Rb × R × FARC × 0.0508

M³ Labor 1”

M³ Labor 1 = V_base + SH_1

M³ Labor 2”

M³ Labor 2 = V_base + SH_2

Resane

Área = H × L

Volumen resane = Área / 11.5

Malla

P = (2H + A) × FARC

Área = L × P

Volumen malla = Área / 21

Próxima etapa — Android

* [ ]	Preparar empaquetado Android
* [ ]	Verificar que todos los recursos necesarios queden incluidos localmente
* [ ]	Generar APK de prueba
* [ ]	Instalar APK en Android
* [ ]	Probar calculadora sin conexión a Internet
* [ ]	Probar generación de PDF sin conexión
* [ ]	Probar fotografías sin conexión
* [ ]	Probar compartir PDF sin conexión
* [ ]	Corregir cualquier problema encontrado
* [ ]	Generar APK final

Compatibilidad futura

* [ ]	Evaluar versión para iPhone/iOS
* [ ]	Evaluar distribución mediante App Store o instalación alternativa según la estrategia elegida

Mantenimiento futuro

* [ ]	Agregar pruebas automáticas de las fórmulas
* [ ]	Refactorizar componentes grandes cuando la aplicación esté estable
* [ ]	Mejorar textos de las páginas de error
