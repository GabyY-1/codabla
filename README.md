# Codabla

Codabla est une interface de chat spécialisée dans l'aide au développement.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvre `http://localhost:3000`.

## Variables d'environnement

Crée un fichier `.env.local` :

```env
OPENROUTER_API_KEY=ta_cle_openrouter
OPENROUTER_MODEL=openrouter/free
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Sur Vercel, ajoute les mêmes variables dans **Settings > Environment Variables**.

La clé OpenRouter reste uniquement côté serveur dans `app/api/chat/route.ts`.
