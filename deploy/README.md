# Dev deployment — https://devadmin.wayout.uz

Runs on the shared server behind `global-nginx` (`/root/infra`), which reaches the containers over the
`gateway_net` Docker network and terminates TLS (Let's Encrypt, renewed by the `renew-certs.sh` cron).

`NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_ENV` are build args (defaults: `https://devapi.wayout.uz`, `dev`); override them in `deploy/.env` on the server if needed.

First-time setup on the server: `cd deploy && docker compose up -d --build`.

## CI/CD (`.github/workflows/ci-cd.yml`)

- Every pull request and push: `npm ci`, `npm run check`, `npm run build`.
- Push to `main`: after the checks pass, SSH to the server, which runs `/root/deploy.sh irbis-web`
  (git pull, `docker compose build`, `docker compose up -d`), then polls the public URL.

The deploy key is restricted on the server by a forced command (`/root/irbis/deploy-gate.sh`): it can only
deploy `irbis-api` or `irbis-web`. GitHub repo settings (Settings → Secrets and variables → Actions):

| Kind | Name | Value |
|---|---|---|
| Secret | `DEPLOY_SSH_KEY` | private key of the deploy key (`/root/.ssh/irbis_github_deploy` on the server) |
| Variable | `DEPLOY_HOST` | server IP |
| Variable | `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan -t ed25519 <server IP>` |
| Variable | `DEPLOY_USER` | optional, defaults to `root` |

Until `DEPLOY_HOST` is set the deploy job is skipped and only the checks run.
