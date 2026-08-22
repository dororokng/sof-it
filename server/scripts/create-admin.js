// Создаёт (или обновляет пароль) администратора для входа в /admin.
// В админке нет формы регистрации намеренно — учётку заводит только тот,
// у кого есть доступ к серверу/базе.
//
// Использование: node scripts/create-admin.js you@example.com "пароль"
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/db.js";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Использование: node scripts/create-admin.js email пароль');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);

const user = await prisma.adminUser.upsert({
  where: { email },
  create: { email, passwordHash },
  update: { passwordHash },
});

console.log(`Готово: администратор ${user.email} может входить в /admin/login.`);
await prisma.$disconnect();
