# MUKALCHAT

MUKALCHAT, okuldaki öğrencileri üyelik veya profil oluşturmadan anonim olarak eşleştiren canlı sohbet uygulamasıdır. Her oturuma otomatik bir hayvan adı, emoji ve renk atanır. Mesajlar yalnızca aktif sohbet sırasında tutulur ve taraflardan biri ayrıldığında veritabanından silinir.

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm db:migrate`: apply checked-in migrations. `pnpm db:push`: generate and apply new schema changes.
- `pnpm check` / `pnpm test`: types and application tests.

Platform login, storage, payments and service contracts live in the Webdev skill references; read the relevant capability before extending its helper. MUKALCHAT does not require login.

`server/_core/publicConfig.ts` exposes only named public runtime values. Private keys stay server-side. The platform serves managed `/manus-storage/` assets; the application does not register a second proxy.

Platform configuration is readable and editable through `webdev.config`. The published server uses `/api/health` as its health check. Database schema is defined in `drizzle/schema.ts`; there is no chat-history archive.
