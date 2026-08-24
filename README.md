# Larp Tools Frontend

Private React + Vite project for UI-only wallet and dashboard simulations.

For the complete two-repo architecture, launch state, security checklist, and tonight's deployment order, read [PROJECT_STATUS.md](PROJECT_STATUS.md).

## Included Routes

- `/` landing page
- `/enter` backend-validated activation flow
- `/tools` protected tools console
- `/install/phantom` Phantom home-screen install page
- `/install/trust` Trust home-screen install page
- `/wallet/1` Phantom-style wallet simulator
- `/wallet/2` Trust Wallet-style simulator

## Stack

- React 19
- Vite 8
- React Router 7
- Zustand
- `vite-plugin-pwa`

## Development

```bash
npm install
copy .env.example .env
npm run dev
```

## Production Build

```bash
npm run build
```

## Vercel

1. Push this folder to its own private GitHub repository.
2. Import the repository into Vercel.
3. Set `VITE_API_BASE_URL` to the public backend Railway domain.
4. Deploy after the backend `/health` route is working.

## Notes

- This repo is intended to stay private.
- Build output in `dist/` and dependencies in `node_modules/` are ignored by git.
- Set `VITE_API_BASE_URL` to the deployed Larp Tools backend URL.
- Access codes and sessions are validated by the separate `larp-tools-backend` service.
- Phantom and Trust use separate same-origin web manifests, app names, icons, and start URLs.
- Each live wallet has a fixed `/apps/<tool>/` install document with its own static manifest, icon, title, and start URL.
- Installation creates a 10-minute pairing code. The installed app consumes it once and joins the existing device entitlement without disabling Safari or another installed wallet.
- iOS installation uses Share > Add to Home Screen from the fixed app page. Android uses Install app from the browser menu.
