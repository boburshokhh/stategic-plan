# Strategic Plan Backend

Бэкенд системы квартальной отчётности по стратегическому плану Бухарского ОУМГ СП ООО "Asia Trans Gas" (2026–2028). Реализован на NestJS + Prisma + PostgreSQL согласно [backend_structure_plan](../.cursor/plans/backend_structure_plan_4aba1501.plan.md).

## Доменная модель

```
StrategicPlan → Direction → Task → Subtask (year) → SubtaskDepartment (M:N) → QuarterlyReport (subtask × quarter × department)
```

Подробное описание таблиц, связей и API — в файле плана.

## Требования

- Node.js 20+
- PostgreSQL 14+ (локально или в Docker)

## Установка и запуск

```bash
npm install
cp .env.example .env    # указать реальный DATABASE_URL и JWT_SECRET
npx prisma migrate dev --name init
npm run prisma:seed     # план, отделы, кварталы 2026, пользователи + автоимпорт Excel из EXCEL_IMPORT_PATH
npm run start:dev
```

API документация (Swagger) доступна на `http://localhost:3000/docs` после запуска.

## Импорт исходного Excel-плана

Модуль `import` разбирает листы `Эксплуатация`, `Кадры`, `Цифровизация`, `HSE`, `Зеленая энергетика` исходного файла и создаёт направления, задачи, подзадачи по годам, отделы и квартальные отчёты за 2026 год.

Через HTTP (роль `admin`):

```
GET  /import/status  — статистика плана и последний импорт
POST /import/excel   (multipart/form-data, поле "file")
```

В интерфейсе: раздел **Импорт Excel** в сайдбаре (для admin) или `/admin/import`.

Либо локально без поднятого сервера:

```bash
EXCEL_IMPORT_PATH="../Стратегический_план_Бухарского_ОУМГ_СП_ООО_Asia_Trans_Gas_на_2026 Ru - 2 кв_29062026.xlsx" npm run import:excel
```

**Известное ограничение парсера**: квартальные отчёты в исходном файле привязаны к строке задачи, а не к конкретной подзадаче года — поэтому все отчёты задачи агрегируются на первую подзадачу 2026 года (см. комментарий в `src/modules/import/import.service.ts`). При необходимости более точной привязки следует вручную скорректировать `subtaskId` у созданных `QuarterlyReport`, используя лог `excel_import_runs` (хранит номер строки и исходный текст ячейки для каждой созданной записи).

## Структура модулей

| Модуль | Назначение |
|---|---|
| `auth` | JWT-логин, роли (`dept_user`, `direction_head`, `admin`) |
| `users` | Пользователи и их привязка к отделам |
| `departments` | Справочник отделов-исполнителей |
| `strategic-plans` | Версии плана (2026–2028) |
| `directions` | Направления и дерево задач/подзадач |
| `tasks` / `subtasks` | Иерархия целей; назначение ответственных отделов |
| `reporting-periods` | Кварталы, окна сбора отчётности, автосоздание черновиков (cron) |
| `quarterly-reports` | CRUD квартальных отчётов с проверкой прав и окна сбора |
| `aggregation` | Полнота отчётности по направлению, сводки руководителей |
| `dashboard` | Агрегированный обзор по всем направлениям |
| `import` | Импорт исходного Excel-плана |

## Полезные команды

```bash
npm run start:dev        # dev-сервер с hot reload
npm run build             # сборка в dist/
npm run prisma:migrate    # новая миграция БД
npm run prisma:generate   # перегенерировать Prisma Client после правки schema.prisma
```
