const { PrismaClient } = require('@prisma/client');

function normalizeUploadedFileName(name) {
  if (!name) return name;
  const hasCyrillic = /[\u0400-\u04FF]/.test(name);
  const looksLikeMojibake = /[ÃÐÑÂâ]/.test(name);
  if (hasCyrillic && !looksLikeMojibake) return name;
  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  if (decoded === name || decoded.includes('\uFFFD')) return name;
  const decodedHasCyrillic = /[\u0400-\u04FF]/.test(decoded);
  if (decodedHasCyrillic || looksLikeMojibake) return decoded;
  return name;
}

async function main() {
  const prisma = new PrismaClient();
  const attachments = await prisma.reportAttachment.findMany({ select: { id: true, fileName: true } });
  let fixed = 0;

  for (const attachment of attachments) {
    const nextName = normalizeUploadedFileName(attachment.fileName);
    if (nextName !== attachment.fileName) {
      await prisma.reportAttachment.update({
        where: { id: attachment.id },
        data: { fileName: nextName },
      });
      console.log(`${attachment.fileName}\n  -> ${nextName}\n`);
      fixed += 1;
    }
  }

  console.log(`Done. Fixed ${fixed} of ${attachments.length} attachment(s).`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
