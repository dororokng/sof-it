-- CreateTable: categories
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the two existing categories, using the same ids the old Product.category
-- string column used ('industrial'/'warehouse'), so products can be repointed
-- to them without losing data.
INSERT INTO "categories" ("id", "name", "slug", "order", "isActive", "createdAt", "updatedAt") VALUES
    ('industrial', 'Промышленные роботы', 'industrial', 1, true, now(), now()),
    ('warehouse', 'Складские и логистические роботы', 'warehouse', 2, true, now(), now());

-- CreateTable: services
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateTable: site_settings (singleton — всегда одна строка с id = 1)
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "workingHours" TEXT,
    "requisites" TEXT,
    "telegramUrl" TEXT,
    "whatsappUrl" TEXT,
    "vkUrl" TEXT,
    "footerAbout" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- Seed текущими значениями, которые раньше были зашиты в HTML-файлах
INSERT INTO "site_settings" ("id", "phone", "email", "address", "workingHours", "footerAbout", "updatedAt") VALUES
    (1, '+7 (000) 000-00-00', 'info@sofit.example', 'Уточняется', 'Пн–Пт, 9:00–18:00',
     'IT-решения и роботизированное оборудование для бизнеса. Внедрение 1С, автоматизация процессов, промышленные и складские роботы.',
     now());

-- AlterTable: products.category/categoryLabel -> products.categoryId (FK на categories)
ALTER TABLE "products" ADD COLUMN "categoryId" TEXT;
UPDATE "products" SET "categoryId" = "category";
ALTER TABLE "products" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" DROP COLUMN "category";
ALTER TABLE "products" DROP COLUMN "categoryLabel";
