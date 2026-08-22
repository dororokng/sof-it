import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

async function getSettings() {
  return (
    (await prisma.siteSettings.findUnique({ where: { id: 1 } })) ||
    (await prisma.siteSettings.create({ data: { id: 1 } }))
  );
}

settingsRouter.get("/", async (req, res) => {
  const settings = await getSettings();
  res.render("settings/edit", { settings, flash: req.query.flash || null, error: null });
});

settingsRouter.post("/", async (req, res) => {
  const { phone, email, address, workingHours, requisites, telegramUrl, whatsappUrl, vkUrl, footerAbout } = req.body;
  try {
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1, phone, email, address, workingHours, requisites, telegramUrl, whatsappUrl, vkUrl, footerAbout },
      update: { phone, email, address, workingHours, requisites, telegramUrl, whatsappUrl, vkUrl, footerAbout },
    });
    res.redirect("/admin/settings?flash=" + encodeURIComponent("Настройки сохранены."));
  } catch (e) {
    const settings = await getSettings();
    res.render("settings/edit", { settings: { ...settings, ...req.body }, flash: null, error: "Не удалось сохранить настройки." });
  }
});
