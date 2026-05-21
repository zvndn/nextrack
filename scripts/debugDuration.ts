import { prisma } from '@/lib/prisma';

const mediaId = process.argv[2];
if (!mediaId) {
  console.error('Provide mediaId as argument');
  process.exit(1);
}
(async () => {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { id: true, type: true, duration: true, runtimeMinutes: true },
  });
  console.log(JSON.stringify(media, null, 2));
})();
