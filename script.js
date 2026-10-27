/* =========================================================
   Patech Consultoria — comportamento
   ========================================================= */
(function () {
  "use strict";

  var WHATSAPP_BASE = "https://wa.me/5562992676693";

  /* ---------- Ano dinâmico no rodapé ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Carrossel ---------- */
  var carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;

  var viewport = carousel.querySelector("[data-viewport]");
  var cards = Array.prototype.slice.call(viewport.querySelectorAll(".card"));
  var prevBtn = carousel.querySelector("[data-prev]");
  var nextBtn = carousel.querySelector("[data-next]");
  var dotsWrap = carousel.querySelector("[data-dots]");
  var live = carousel.querySelector("[data-live]");
  var total = cards.length;
  var current = 0;
  var dots = [];

  var mqMobile = window.matchMedia("(max-width: 699.98px)");

  function titleOf(card) {
    var h = card.querySelector(".card__title");
    return h ? h.textContent.trim() : "";
  }

  /* Links de WhatsApp personalizados por serviço */
  cards.forEach(function (card) {
    var cta = card.querySelector(".card__cta");
    if (!cta) return;
    var message = card.getAttribute("data-message") || "Olá! Gostaria de informações sobre os serviços da Patech Consultoria.";
    cta.href = WHATSAPP_BASE + "?text=" + encodeURIComponent(message);
    cta.setAttribute("aria-label", "Consultar serviço: " + titleOf(card) + " (abre o WhatsApp em nova aba)");

    // O clique no botão nunca deve acionar a navegação do card
    cta.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  });

  /* Indicadores */
  cards.forEach(function (card, i) {
    var dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel__dot";
    dot.setAttribute("aria-label", "Ir para o serviço " + (i + 1) + " de " + total + ": " + titleOf(card));
    dot.addEventListener("click", function () {
      goTo(i);
    });
    dotsWrap.appendChild(dot);
    dots.push(dot);
  });

  /* Distância circular entre o card i e o card atual */
  function offsetOf(i) {
    var d = i - current;
    if (d > total / 2) d -= total;
    if (d < -total / 2) d += total;
    return d;
  }

  function render(announce) {
    var mobile = mqMobile.matches;
    var hadFocus = carousel.contains(document.activeElement);

    cards.forEach(function (card, i) {
      var d = offsetOf(i);
      var pos = Math.max(-2, Math.min(2, d));
      var isActive = d === 0;
      var isSide = Math.abs(d) === 1 && !mobile;
      var visible = isActive || isSide;
      var label = (i + 1) + " de " + total + ": " + titleOf(card);
      var cta = card.querySelector(".card__cta");

      card.setAttribute("data-pos", String(pos));
      card.classList.toggle("is-active", isActive);
      card.setAttribute("aria-hidden", visible ? "false" : "true");
      card.inert = !visible;

      if (isActive) {
        card.tabIndex = -1;
        card.setAttribute("aria-label", label);
        card.removeAttribute("aria-current");
      } else if (isSide) {
        card.tabIndex = 0;
        card.setAttribute("aria-label", "Ver serviço " + label);
      } else {
        card.removeAttribute("tabindex");
        card.setAttribute("aria-label", label);
      }

      // Somente o botão do card central entra na ordem de tabulação
      if (cta) cta.tabIndex = isActive ? 0 : -1;
    });

    dots.forEach(function (dot, i) {
      if (i === current) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });

    if (announce && live) {
      live.textContent = "Serviço " + (current + 1) + " de " + total + ": " + titleOf(cards[current]);
    }

    // Evita perder o foco quando o elemento focado ficou oculto
    if (hadFocus) {
      var active = document.activeElement;
      if (!active || active === document.body || (active.closest && active.closest("[inert]"))) {
        viewport.focus({ preventScroll: true });
      }
    }
  }

  function goTo(index, opts) {
    current = ((index % total) + total) % total;
    render(true);
    if (opts && opts.focusCard) {
      cards[current].focus({ preventScroll: true });
    }
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  /* Clique e teclado nos cards laterais */
  cards.forEach(function (card, i) {
    card.addEventListener("click", function (e) {
      if (e.target.closest("a, button")) return;
      if (offsetOf(i) !== 0) goTo(i);
    });

    card.addEventListener("keydown", function (e) {
      if (e.target !== card || offsetOf(i) === 0) return;
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        goTo(i, { focusCard: true });
      }
    });
  });

  /* Setas do teclado quando o foco está no carrossel */
  carousel.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowLeft" || e.key === "Left") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight" || e.key === "Right") {
      e.preventDefault();
      next();
    }
  });

  /* Arraste horizontal (toque e mouse) */
  var SWIPE_THRESHOLD = 45;
  var DRAG_START = 10;
  var tracking = false;
  var dragged = false;
  var startX = 0;
  var startY = 0;
  var pointerId = null;

  viewport.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    tracking = true;
    dragged = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
  });

  window.addEventListener("pointermove", function (e) {
    if (!tracking || e.pointerId !== pointerId) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (!dragged && Math.abs(dx) > DRAG_START && Math.abs(dx) > Math.abs(dy)) {
      dragged = true;
      viewport.classList.add("is-dragging");
    }
    if (dragged) {
      // Feedback visual: o card acompanha o dedo com amortecimento
      var limit = viewport.clientWidth * 0.35;
      var follow = Math.max(-limit, Math.min(limit, dx * 0.55));
      viewport.style.setProperty("--drag-x", follow.toFixed(1) + "px");
    }
  });

  function endDrag(e) {
    if (!tracking || e.pointerId !== pointerId) return;
    tracking = false;
    viewport.classList.remove("is-dragging");
    viewport.style.removeProperty("--drag-x");
    if (!dragged || e.type === "pointercancel") return;
    var dx = e.clientX - startX;
    if (dx <= -SWIPE_THRESHOLD) next();
    else if (dx >= SWIPE_THRESHOLD) prev();
  }

  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  // Um arraste não deve ser interpretado como clique (cards ou botões)
  viewport.addEventListener(
    "click",
    function (e) {
      if (dragged) {
        e.preventDefault();
        e.stopPropagation();
        dragged = false;
      }
    },
    true
  );

  viewport.addEventListener("dragstart", function (e) {
    e.preventDefault();
  });

  /* Recalcula visibilidade ao mudar de breakpoint */
  if (mqMobile.addEventListener) mqMobile.addEventListener("change", function () { render(false); });
  else if (mqMobile.addListener) mqMobile.addListener(function () { render(false); });

  render(false);
})();
