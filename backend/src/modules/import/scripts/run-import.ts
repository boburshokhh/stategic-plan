import { NestFactory } from '@nestjs/core';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../../../app.module';
import { ImportService } from '../import.service';

/**
 * CLI-обёртка для локального импорта Excel без HTTP-запроса, например:
 *   EXCEL_IMPORT_PATH="../file.xlsx" npm run import:excel
 */
async function run() {
  const filePath = process.env.EXCEL_IMPORT_PATH;
  if (!filePath) {
    throw new Error('Переменная окружения EXCEL_IMPORT_PATH не задана');
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const importService = app.get(ImportService);

  const buffer = readFileSync(resolve(process.cwd(), filePath));
  const summary = await importService.importFromBuffer(buffer, filePath.split(/[\\/]/).pop() ?? filePath);

  console.log('Импорт завершён:', summary);
  await app.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
