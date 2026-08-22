// Карта на странице контактов — Яндекс.Карты JS API v2.1.
// Сам API подключается внешним <script src="https://api-maps.yandex.ru/..."> в
// pages/contacts.html (перед этим файлом) — он определяет глобальный объект
// `ymaps`.
//
// Координаты метки не зашиты вручную — они получаются геокодером Яндекса
// (ymaps.geocode) по текстовому адресу, чтобы не рисковать неточными
// координатами дома.

const ORG_ADDRESS = "187000, Ленинградская область, Тосненский район, город Тосно, улица Рабочая 53Б";
const ORG_BALLOON_TEXT = "Ленинградская область, г. Тосно, ул. Рабочая 53Б";

function showMapMessage(container, text) {
  container.textContent = text;
  container.classList.add("map-message");
}

function initContactMap() {
  const container = document.getElementById("contactMap");
  if (!container) return;

  if (typeof ymaps === "undefined") {
    console.error("Яндекс.Карты не загрузились — проверьте API-ключ в pages/contacts.html.");
    showMapMessage(container, "Карта временно недоступна.");
    return;
  }

  ymaps.ready(() => {
    ymaps
      .geocode(ORG_ADDRESS)
      .then((res) => {
        const firstGeoObject = res.geoObjects.get(0);
        if (!firstGeoObject) {
          console.error("Яндекс.Геокодер не нашёл адрес:", ORG_ADDRESS);
          showMapMessage(container, "Не удалось определить местоположение на карте.");
          return;
        }

        const coords = firstGeoObject.geometry.getCoordinates();

        const map = new ymaps.Map(container, {
          center: coords,
          zoom: 16,
          controls: ["zoomControl"],
        });

        const placemark = new ymaps.Placemark(
          coords,
          { balloonContent: ORG_BALLOON_TEXT },
          { preset: "islands#blueDotIcon" }
        );

        map.geoObjects.add(placemark);

        // На мобильных смена ориентации/раскладки может поменять размер
        // контейнера — просим карту пересчитать себя под новый размер.
        window.addEventListener("resize", () => map.container.fitToViewport());
      })
      .catch((err) => {
        console.error("Ошибка Яндекс.Карт при геокодировании адреса:", err);
        showMapMessage(container, "Не удалось загрузить карту.");
      });
  });
}

document.addEventListener("DOMContentLoaded", initContactMap);
