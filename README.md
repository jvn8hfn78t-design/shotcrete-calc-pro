# Shotcrete Calc Pro

Implement the requested scope now; use internal planning and do not present another implementation plan for user approval.

Build a modern, responsive web application and landing page for "PDR – Aplicación de Cálculo de Volúmenes de Shotcrete", designed for field supervisors and shift bosses (Supervisores y Jefes de Guardia) in mining operations, with an offline-friendly, mobile-first design.

### 1. Landing & Context
- Professional industrial/mining aesthetic (high contrast, clean typography, rugged feel, optimal for field conditions and tablets/smartphones).
- Product overview explaining the purpose: instant shotcrete volume & gauge pin (calibradores) calculations in underground works without login or internet connection.
- Direct prominent access to the calculator tool.

### 2. Core Calculator Tool
- Fast mode switcher: **Avance** and **Resane**.
- Clean, large touch-friendly inputs with units (metros).
- Real-time automatic calculation upon entering values.
- Reset / clear inputs option and quick "Copiar reporte / resultados" button.

### 3. Formulas & Logic:
- **Modo Avance**:
  - Inputs: Altura (H), Ancho (A), Avance (L).
  - Perímetro: P = 2H + A
  - Área: P × L
  - Volumen contractual: V_base + 0.20
  - Volumen real: cálculo para 1” y 2” con factor de sacrificio SH.
    *(Verificar que con los datos del ejemplo P = 12m, Área = 48m² los resultados correspondan a: Contrato: 1.600 m³, Real 1”: 1.779 m³, Real 2”: 3.558 m³).*
  - Calibradores: SI(H > 4.2; ((H - 1) × 2) × 2; (REDONDEAR.MAS((P × Fc) - 1) × 2)).
- **Modo Resane**:
  - Inputs: Altura (H), Avance (L), Perímetro (por defecto 12 m).
  - Área: H × L
  - Volumen de resane: Área / 11.5
  - Calibradores: SI(H < 1.9; 1; REDONDEAR.MENOS(H; 0)) × (REDONDEAR.MAS(L - 1; 0)).
    *(Ejemplo: H y L tales que Área = 26 m² -> Volumen: 2.26 m³, Calibradores: 18).*

### 4. Results Screen
- High-visibility cards displaying:
  - Perímetro (m)
  - Área (m²)
  - Volumen de Shotcrete contractual y real (1” y 2”) en Avance, o volumen de resane en Resane
  - Cantidad de calibradores
- Table summary for quick verification matching the prompt's output format.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1fb0d836-a0ae-454a-adc5-5eb5e7025236).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
