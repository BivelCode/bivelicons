# Modification du workflow de release

Objectif : exécuter la version via Changesets, pousser le commit directement sur `main` et publier sur npm, sans créer de branche ni de Pull Request.

Fichier modifié : `.github/workflows/release.yml`

Contenu du workflow modifié (extrait) :

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          persist-credentials: true
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: latest

      - name: Setup Node.js (Node 24 LTS)
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org/'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Configure git for Actions
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Run Changesets version (update package json / changelogs)
        run: pnpm run version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Push version commit to main
        run: git push origin HEAD:main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Configure npm auth for publish
        run: echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Publish to npm
        run: pnpm run publish-package
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Message de commit proposé pour cette modification :

```
ci(release): publish directly on main without PR

- Run `changeset version` on current branch
- Push version commit directly to `main`
- Use npm token to publish package(s)
```

Remarques importantes :

- Pousser directement sur `main` peut être bloqué par des règles de protection de branche (exiger des PRs, blocage des pushes par des tokens). Assurez-vous que :
  - `Settings > Branches > Branch protection` autorise les pushes depuis GitHub Actions, ou adaptez la politique.
  - Le secret `NPM_TOKEN` est défini dans `Settings > Secrets and variables > Actions`.
- Si `main` est protégé et les pushes directs ne sont pas autorisés, il faudra soit :
  - Ajuster la protection de branche (autoriser ce workflow), ou
  - Revenir à la création d'une PR et la merger automatiquement (nécessite d'activer `Allow GitHub Actions to create and approve pull requests` dans `Settings > Actions`).

Validation :

1. Vérifier que `NPM_TOKEN` est présent dans les secrets.
2. Pousser un commit de test sur `main` pour déclencher le workflow (ou lancer manuellement si `workflow_dispatch` est ajouté).
3. Vérifier que le workflow :
   - exécute `pnpm run version` et commit les changements,
   - pousse le commit sur `main`,
   - publie sur npm.
