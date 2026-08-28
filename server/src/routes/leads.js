import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireCsrf } from "../middleware/csrf.js";

// Read-only просмотр заявок с /pages/contacts.html + отметка "обработано" и
// удаление. Своей формы создания/редактирования нет намеренно — заявки
// создаёт только публичный POST /api/leads (см. routes/publicApi.js).
export const leadsRouter = Router();
leadsRouter.use(requireAuth);

leadsRouter.get("/", async (req, res) => {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  res.render("leads/list", { leads, flash: req.query.flash || null });
});

leadsRouter.post("/:id/toggle", requireCsrf, async (req, res) => {
  const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
  if (lead) {
    await prisma.lead.update({ where: { id: req.params.id }, data: { isProcessed: !lead.isProcessed } });
  }
  res.redirect("/admin/leads");
});

leadsRouter.post("/:id/delete", requireCsrf, async (req, res) => {
  await prisma.lead.delete({ where: { id: req.params.id } }).catch(() => {});
  res.redirect("/admin/leads?flash=" + encodeURIComponent("Заявка удалена."));
});
