# Warp Engine Regulator - Backend

This project listens (at http://localhost:3000) to orders from Warp Engine Regulator's Frontend and communicates directly with the Warp Engine API (https://warp-regulator-bd7q33crqa-lz.a.run.app/).
After Regulator's Frontend orders 'Start', the Backend fires up the Warp Engine and from there on tries to balance the engine's matter / antimatter intermix so that the engine runs in stable condition - keeping the intermix close to 0.5 and flow rate closer to optimal. For this, the Regulator's Backend polls for engine status every 1 second and according to engine's intermix and flow rate sends an order to adjust matter and antimatter accordingly. The Backend also provides latest status info to Frontend as well as listens for an order to stop the engine ajdustment process.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run start
```
