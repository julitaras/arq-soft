# Arquitectura de Software - TP1
Repo para TP de arqui de software (TB034).

- Repo de la catedra: https://github.com/fiuba-arq-soft/1c26-tp-1
- Consigna en [archivo](CONSIGNA.md)
- Informe en `Trabajo Practico 1.pdf`

## Cómo correr la app

### Opción 1: local

1. Entrar a la carpeta `app`.
2. Instalar dependencias con `npm install`.
3. Levantar la API con `node app.js`.

El servicio queda disponible en `http://localhost:3000`.

### Opción 2: con Docker Compose

1. Desde la raíz del repositorio ejecutar `docker compose up --build`.
2. La API queda detrás de Nginx en `http://localhost:5555`.

Esta opción levanta también los servicios de observabilidad definidos en el `docker-compose.yml`.

## Tácticas aplicadas

Para ubicar rápidamente cada implementación, las tácticas del informe quedaron distribuidas en estas ramas:

- Táctica 1, Transactions: `prevent-faults-with-transactions`
- Táctica 2, Limit Access: `limit-access`
- Táctica (3, 4, 5) Distributed State Cache , Scale out not up, Introduce Concurrency: `add-concurrency`

## Business metrics

- Aplicado en la rama `business-metrics`