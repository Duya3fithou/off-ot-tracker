import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialProjects = ['clubpilates', 'Internal', 'General OT'];

async function main() {
  for (const name of initialProjects) {
    await prisma.project.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${initialProjects.length} projects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
