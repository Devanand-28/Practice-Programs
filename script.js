/* =========================================================
   SIVAMURUGAN STORES — site script
   Handles: active nav highlighting, the grocery rate board
   (rendered from data you can edit yourself, no coding
   needed), the owner's manual price-entry panel, and the
   contact form.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- 1. Active nav link highlighting ---------- */
  function highlightActiveNav() {
    const links = document.querySelectorAll(".nav-links a[data-page]");
    const current = document.body.getAttribute("data-page");
    links.forEach((link) => {
      if (link.getAttribute("data-page") === current) {
        link.classList.add("active");
      }
    });
  }

  /* ---------- 1b. Scroll reveal (fade in on enter, vanish on exit) ---------- */
  function initScrollReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || prefersReduced) {
      items.forEach((el) => el.classList.add("in-view"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Toggling both ways (not just on first entry) is what makes
          // sections vanish again as you scroll past them.
          entry.target.classList.toggle("in-view", entry.isIntersecting);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* ---------- 1c. Scroll progress bar ---------- */
  function initScrollProgressBar() {
    const bar = document.createElement("div");
    bar.className = "scroll-progress-bar";
    document.body.appendChild(bar);

    let ticking = false;
    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + "%";
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ---------- 1d. Tilt-on-hover for the shop photo ---------- */
  function initTiltCards() {
    const cards = document.querySelectorAll(".tilt-card");
    if (!cards.length) return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || prefersReduced) return;

    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateY(" + (x * 9).toFixed(2) + "deg) rotateX(" +
          (-y * 9).toFixed(2) + "deg) scale(1.02)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- 2. Product / price data ---------- */
  const STORAGE_KEY = "sivamurugan_products_v1";
  const CART_KEY = "sivamurugan_cart_v1";
  const ADMIN_KEY = "sivamurugan_admin_unlocked";
  const ADMIN_PASSWORD = "sivamurugan2026"; // change this to your own password

  // Starter list — edit freely from the "Store Owner? Edit Prices"
  // panel on the Products page. Everything you add there is saved
  // in the browser automatically, no code editing required.
  const DEFAULT_PRODUCTS = [
    { id: "veg-1", category: "Vegetables & Fruits", name: "Tomato", unit: "per kg", price: 32, inStock: true },
    { id: "veg-2", category: "Vegetables & Fruits", name: "Onion", unit: "per kg", price: 38, inStock: true },
    { id: "veg-3", category: "Vegetables & Fruits", name: "Potato", unit: "per kg", price: 28, inStock: true },
    { id: "veg-4", category: "Vegetables & Fruits", name: "Banana", unit: "per dozen", price: 55, inStock: true },
    { id: "veg-5", category: "Vegetables & Fruits", name: "Green Chilli", unit: "per 250g", price: 15, inStock: true },
    { id: "veg-6", category: "Vegetables & Fruits", name: "Coriander Leaves", unit: "per bunch", price: 10, inStock: true },

    { id: "cook-1", category: "Cooking Essentials", name: "Sunflower Oil", unit: "1 litre pouch", price: 148, inStock: true },
    { id: "cook-2", category: "Cooking Essentials", name: "Toor Dal", unit: "per kg", price: 165, inStock: true },
    { id: "cook-3", category: "Cooking Essentials", name: "Basmati Rice", unit: "per kg", price: 92, inStock: true },
    { id: "cook-4", category: "Cooking Essentials", name: "Amul Butter", unit: "100g pack", price: 58, inStock: true },
    { id: "cook-5", category: "Cooking Essentials", name: "Aavin Milk", unit: "500ml pouch", price: 26, inStock: true },
    { id: "cook-6", category: "Cooking Essentials", name: "Sambar Powder", unit: "200g pack", price: 62, inStock: true },
    { id: "cook-7", category: "Cooking Essentials", name: "Salt", unit: "1kg pack", price: 22, inStock: true },

    { id: "snack-1", category: "Snacks & Chocolates", name: "Parle-G Biscuit", unit: "per pack", price: 10, inStock: true },
    { id: "snack-2", category: "Snacks & Chocolates", name: "Lay's Chips", unit: "52g pack", price: 20, inStock: true },
    { id: "snack-3", category: "Snacks & Chocolates", name: "Dairy Milk Chocolate", unit: "13.2g bar", price: 10, inStock: true },
    { id: "snack-4", category: "Snacks & Chocolates", name: "Maggi Noodles", unit: "70g pack", price: 14, inStock: true },
    { id: "snack-5", category: "Snacks & Chocolates", name: "Murukku", unit: "per 200g", price: 45, inStock: true },

    { id: "bev-1", category: "Beverages", name: "Tea Powder", unit: "250g pack", price: 95, inStock: true },
    { id: "bev-2", category: "Beverages", name: "Instant Coffee", unit: "50g jar", price: 105, inStock: true },
    { id: "bev-3", category: "Beverages", name: "Thums Up", unit: "750ml bottle", price: 40, inStock: true },
    { id: "bev-4", category: "Beverages", name: "Real Fruit Juice", unit: "1 litre", price: 110, inStock: false },

    { id: "stat-1", category: "Stationery", name: "Notebook (200pg)", unit: "each", price: 35, inStock: true },
    { id: "stat-2", category: "Stationery", name: "Ball Pen", unit: "each", price: 10, inStock: true },
    { id: "stat-3", category: "Stationery", name: "Pencil Box Set", unit: "each", price: 45, inStock: true },

    { id: "hh-1", category: "Household & Personal Care", name: "Detergent Powder", unit: "1kg pack", price: 98, inStock: true },
    { id: "hh-2", category: "Household & Personal Care", name: "Toilet Soap", unit: "each", price: 32, inStock: true },
    { id: "hh-3", category: "Household & Personal Care", name: "Dishwash Liquid", unit: "500ml", price: 85, inStock: true },
    { id: "hh-4", category: "Household & Personal Care", name: "Mosquito Coil", unit: "pack of 10", price: 30, inStock: true }
  ];

  function loadProducts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_PRODUCTS.slice();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
      return DEFAULT_PRODUCTS.slice();
    } catch (e) {
      return DEFAULT_PRODUCTS.slice();
    }
  }

  function saveProducts(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error("Could not save product list:", e);
      return false;
    }
  }

  function formatPrice(n) {
    const num = Number(n);
    if (Number.isNaN(num)) return "₹0";
    return "₹" + num.toLocaleString("en-IN");
  }

  function uid() {
    return "item-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  }

  /* ---------- 3. Rate board rendering (Products page) ---------- */
  function initProductsPage() {
    const board = document.getElementById("rateBoard");
    if (!board) return; // not on the products page

    let products = loadProducts();
    let activeCategory = "All";
    let searchTerm = "";

    const tabsWrap = document.getElementById("categoryTabs");
    const searchInput = document.getElementById("productSearch");

    function getCategories() {
      const set = new Set(products.map((p) => p.category));
      return ["All", ...Array.from(set)];
    }

    function renderTabs() {
      const cats = getCategories();
      tabsWrap.innerHTML = "";
      cats.forEach((cat) => {
        const btn = document.createElement("button");
        btn.className = "category-tab" + (cat === activeCategory ? " active" : "");
        btn.type = "button";
        btn.textContent = cat;
        btn.addEventListener("click", () => {
          activeCategory = cat;
          renderTabs();
          renderBoard();
        });
        tabsWrap.appendChild(btn);
      });
    }

    function renderBoard() {
      board.innerHTML = "";

      let filtered = products.filter((p) => {
        const matchesCat = activeCategory === "All" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCat && matchesSearch;
      });

      if (!filtered.length) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "No items match your search. Try another name.";
        board.appendChild(empty);
        return;
      }

      const grouped = {};
      filtered.forEach((p) => {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
      });

      Object.keys(grouped).forEach((cat) => {
        const section = document.createElement("div");
        section.className = "rate-category";

        const title = document.createElement("div");
        title.className = "rate-category-title";
        title.innerHTML =
          "<h3>" + cat + "</h3><span class='count'>" + grouped[cat].length + " items</span>";
        section.appendChild(title);

        const list = document.createElement("div");
        list.className = "rate-list";

        grouped[cat].forEach((item) => {
          const row = document.createElement("div");
          row.className = "rate-row";
          row.innerHTML =
            "<div class='rate-row-main'><div><div class='rate-item-name'>" + escapeHtml(item.name) + "</div>" +
            "<div class='rate-item-unit'>" + escapeHtml(item.unit || "") + "</div></div>" +
            "<div class='rate-price" + (item.inStock ? "" : " out") + "'>" +
            (item.inStock ? formatPrice(item.price) : "Out of stock") + "</div></div>" +
            "<button type='button' class='add-to-cart-btn' data-id='" + escapeAttr(item.id) + "'" +
            (item.inStock ? "" : " disabled") + ">" +
            (item.inStock ? "+ Add" : "Unavailable") + "</button>";
          list.appendChild(row);
        });

        section.appendChild(list);
        board.appendChild(section);
      });
    }

    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchTerm = e.target.value;
        renderBoard();
      });
    }

    // Add-to-cart clicks are handled once, on the board itself, since
    // the rows inside it are rebuilt every time the list re-renders.
    board.addEventListener("click", (e) => {
      const btn = e.target.closest(".add-to-cart-btn");
      if (!btn || btn.disabled) return;
      const id = btn.getAttribute("data-id");
      addToCart(id, 1);
      btn.classList.add("added");
      btn.textContent = "✓ Added";
      setTimeout(() => {
        btn.classList.remove("added");
        btn.textContent = "+ Add";
      }, 1000);
    });

    renderTabs();
    renderBoard();

    /* ---------- 3b. Shopping cart ---------- */
    const cartFab = document.getElementById("cartFab");
    const cartFabCount = document.getElementById("cartFabCount");
    const cartOverlay = document.getElementById("cartOverlay");
    const cartDrawer = document.getElementById("cartDrawer");
    const cartCloseBtn = document.getElementById("cartCloseBtn");
    const cartItemsEl = document.getElementById("cartItems");
    const cartTotalEl = document.getElementById("cartTotal");

    let cart = loadCart(); // { [productId]: qty }

    function loadCart() {
      try {
        const raw = localStorage.getItem(CART_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (e) {
        return {};
      }
    }

    function saveCart() {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
      } catch (e) {
        console.error("Could not save cart:", e);
      }
    }

    function addToCart(productId, qty) {
      const product = products.find((p) => p.id === productId);
      if (!product || !product.inStock) return false;
      cart[productId] = (cart[productId] || 0) + qty;
      saveCart();
      renderCart();
      return true;
    }

    function setCartQty(productId, qty) {
      if (qty <= 0) {
        delete cart[productId];
      } else {
        cart[productId] = qty;
      }
      saveCart();
      renderCart();
    }

    function removeFromCart(productId) {
      delete cart[productId];
      saveCart();
      renderCart();
    }

    function cartCount() {
      return Object.values(cart).reduce((sum, q) => sum + q, 0);
    }

    function renderCart() {
      if (!cartItemsEl) return;

      const ids = Object.keys(cart).filter((id) => products.some((p) => p.id === id));
      const count = cartCount();

      if (cartFabCount) {
        if (count > 0) {
          cartFabCount.textContent = String(count);
          cartFabCount.hidden = false;
        } else {
          cartFabCount.hidden = true;
        }
      }

      if (!ids.length) {
        cartItemsEl.innerHTML = "<div class='cart-empty'>Your cart is empty. Add items from the list, or scan a shopping list below.</div>";
        if (cartTotalEl) cartTotalEl.textContent = formatPrice(0);
        return;
      }

      let total = 0;
      cartItemsEl.innerHTML = "";
      ids.forEach((id) => {
        const product = products.find((p) => p.id === id);
        const qty = cart[id];
        total += product.price * qty;

        const row = document.createElement("div");
        row.className = "cart-item-row";
        row.innerHTML =
          "<div><div class='cart-item-name'>" + escapeHtml(product.name) + "</div>" +
          "<div class='cart-item-unit-price'>" + formatPrice(product.price) + " · " + escapeHtml(product.unit || "") + "</div></div>" +
          "<div class='cart-item-controls'>" +
          "<button type='button' class='qty-btn' data-action='dec'>−</button>" +
          "<span class='cart-item-qty'>" + qty + "</span>" +
          "<button type='button' class='qty-btn' data-action='inc'>+</button>" +
          "<button type='button' class='cart-item-remove' data-action='remove'>Remove</button>" +
          "</div>";

        row.querySelector("[data-action='inc']").addEventListener("click", () => setCartQty(id, qty + 1));
        row.querySelector("[data-action='dec']").addEventListener("click", () => setCartQty(id, qty - 1));
        row.querySelector("[data-action='remove']").addEventListener("click", () => removeFromCart(id));

        cartItemsEl.appendChild(row);
      });

      if (cartTotalEl) cartTotalEl.textContent = formatPrice(total);
    }

    function openCart() {
      if (!cartDrawer) return;
      cartDrawer.classList.add("open");
      cartDrawer.setAttribute("aria-hidden", "false");
      if (cartOverlay) cartOverlay.classList.add("show");
    }

    function closeCart() {
      if (!cartDrawer) return;
      cartDrawer.classList.remove("open");
      cartDrawer.setAttribute("aria-hidden", "true");
      if (cartOverlay) cartOverlay.classList.remove("show");
    }

    if (cartFab) cartFab.addEventListener("click", openCart);
    if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCart);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

    renderCart();

    /* ---------- 3c. Smart Receipt / List Scanner (mock OCR) ----------
       Real handwriting/text recognition needs a proper OCR engine
       (e.g. Tesseract.js) running on the uploaded photo. This is a
       lightweight frontend simulation of that pipeline: the person
       uploads a photo, we show a short "processing" delay, then run a
       stand-in set of "recognised words" through the same product
       matching + add-to-cart logic real OCR output would go through.
       Swap `recognizeText()` for a real OCR call whenever you're
       ready to wire one in. */
    const receiptInput = document.getElementById("receiptUpload");
    const receiptScanBtn = document.getElementById("receiptScanBtn");
    const scanOverlay = document.getElementById("scanOverlay");
    const scanOverlayText = document.getElementById("scanOverlayText");

    // Words a handwritten list or receipt commonly contains. A real OCR
    // pass would replace this pool with whatever text it actually reads
    // off the photo.
    const MOCK_TEXT_POOL = [
      "rice", "milk", "oil", "salt", "tea", "sugar", "biscuit", "soap",
      "noodles", "chips", "coffee", "notebook", "pen", "dal", "butter"
    ];

    function recognizeText() {
      // Simulated OCR output: a handful of words "read" from the photo.
      const shuffled = MOCK_TEXT_POOL.slice().sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 4 + Math.floor(Math.random() * 3));
    }

    function findProductMatch(word) {
      const w = word.toLowerCase().trim();
      if (!w) return null;
      return (
        products.find((p) => p.inStock && p.name.toLowerCase().includes(w)) ||
        products.find((p) => p.inStock && p.name.toLowerCase().split(/\s+/).some((part) => part.startsWith(w) || w.startsWith(part)))
      ) || null;
    }

    function autoMatchAndAddToCart(word) {
      const match = findProductMatch(word);
      if (match) addToCart(match.id, 1);
      return match;
    }

    function showScanResult(matched, unmatched) {
      let msg = "";
      if (matched.length) {
        msg += "Added to your cart: " + matched.join(", ") + ".";
      }
      if (unmatched.length) {
        msg += (msg ? "\n" : "") + "Couldn't match: " + unmatched.join(", ") + " — add these manually from the list if you need them.";
      }
      if (!msg) msg = "Nothing recognisable was found on that photo. Try a clearer shot.";
      alert(msg);
    }

    if (receiptScanBtn && receiptInput) {
      receiptScanBtn.addEventListener("click", () => receiptInput.click());

      receiptInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (scanOverlay) scanOverlay.classList.add("show");
        if (scanOverlayText) scanOverlayText.textContent = "Reading your list…";

        // Simulated processing delay, standing in for real OCR work.
        setTimeout(() => {
          const scannedWords = recognizeText();
          const matchedNames = [];
          const unmatchedWords = [];

          scannedWords.forEach((word) => {
            const hit = autoMatchAndAddToCart(word);
            if (hit) matchedNames.push(hit.name);
            else unmatchedWords.push(word);
          });

          if (scanOverlay) scanOverlay.classList.remove("show");
          receiptInput.value = ""; // allow re-selecting the same file later

          openCart();
          showScanResult(matchedNames, unmatchedWords);
        }, 2000);
      });
    }

    /* ---------- 4. Admin manual price-entry panel ---------- */
    const toggleBtn = document.getElementById("adminToggleBtn");
    const adminPanel = document.getElementById("adminPanel");
    const adminTableBody = document.getElementById("adminTableBody");
    const addForm = document.getElementById("addItemForm");
    const resetBtn = document.getElementById("resetDataBtn");
    const saveNote = document.getElementById("saveNote");

    function refreshAll() {
      renderTabs();
      renderBoard();
      renderAdminTable();
      renderCart();
    }

    function renderAdminTable() {
      if (!adminTableBody) return;
      adminTableBody.innerHTML = "";
      products.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td><input type='text' data-field='name' value='" + escapeAttr(item.name) + "'></td>" +
          "<td><input type='text' data-field='category' value='" + escapeAttr(item.category) + "'></td>" +
          "<td><input type='text' data-field='unit' value='" + escapeAttr(item.unit || "") + "'></td>" +
          "<td><input type='number' min='0' data-field='price' value='" + item.price + "'></td>" +
          "<td style='text-align:center;'><input class='stock-toggle' type='checkbox' data-field='inStock' " +
            (item.inStock ? "checked" : "") + "></td>" +
          "<td><button class='row-delete' type='button' title='Remove item'>&times;</button></td>";

        tr.querySelectorAll("input").forEach((input) => {
          input.addEventListener("change", () => {
            const field = input.getAttribute("data-field");
            if (field === "price") item[field] = parseFloat(input.value) || 0;
            else if (field === "inStock") item[field] = input.checked;
            else item[field] = input.value;
            saveProducts(products);
            renderTabs();
            renderBoard();
            showSaveNote();
          });
        });

        tr.querySelector(".row-delete").addEventListener("click", () => {
          products = products.filter((p) => p.id !== item.id);
          saveProducts(products);
          refreshAll();
          showSaveNote();
        });

        adminTableBody.appendChild(tr);
      });
    }

    function escapeAttr(str) {
      return String(str).replace(/'/g, "&#39;");
    }

    function showSaveNote() {
      if (!saveNote) return;
      saveNote.textContent = "Saved ✓ — changes are live on the site now.";
      saveNote.style.opacity = "1";
      clearTimeout(showSaveNote._t);
      showSaveNote._t = setTimeout(() => (saveNote.style.opacity = "0"), 2200);
    }

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const alreadyUnlocked = sessionStorage.getItem(ADMIN_KEY) === "yes";
        if (!alreadyUnlocked) {
          const pass = prompt("Enter the store owner password to edit prices:");
          if (pass === null) return;
          if (pass !== ADMIN_PASSWORD) {
            alert("That password isn't right. Ask the store owner for it.");
            return;
          }
          sessionStorage.setItem(ADMIN_KEY, "yes");
        }
        adminPanel.classList.toggle("open");
        if (adminPanel.classList.contains("open")) {
          renderAdminTable();
          adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    if (addForm) {
      addForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("newItemName").value.trim();
        const category = document.getElementById("newItemCategory").value.trim();
        const unit = document.getElementById("newItemUnit").value.trim();
        const price = parseFloat(document.getElementById("newItemPrice").value);

        if (!name || !category || Number.isNaN(price)) {
          alert("Please fill in the item name, category, and price.");
          return;
        }

        products.push({
          id: uid(),
          name,
          category,
          unit: unit || "each",
          price,
          inStock: true
        });

        saveProducts(products);
        addForm.reset();
        refreshAll();
        showSaveNote();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (confirm("Reset the entire list back to the sample starter items? This removes anything you've added or changed.")) {
          products = DEFAULT_PRODUCTS.slice();
          saveProducts(products);
          refreshAll();
          showSaveNote();
        }
      });
    }
  }

  /* ---------- 5. Contact form ---------- */
  function initContactForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;
    const status = document.getElementById("formStatus");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("cfName").value.trim();
      const message = document.getElementById("cfMessage").value.trim();

      if (!name || !message) {
        status.className = "form-status show";
        status.style.background = "#FBEADF";
        status.style.color = "#C1440E";
        status.textContent = "Please add your name and a short message before sending.";
        return;
      }

      // No backend is connected yet, so this opens the visitor's
      // email app pre-filled with their message. Swap this for a
      // real form service (e.g. Formspree) once you're ready.
      const subject = encodeURIComponent("Message from Sivamurugan Stores website");
      const body = encodeURIComponent(
        "Name: " + name + "\n" +
        "Phone: " + (document.getElementById("cfPhone").value.trim() || "-") + "\n\n" +
        message
      );
      window.location.href = "mailto:sivamuruganstores@example.com?subject=" + subject + "&body=" + body;

      status.className = "form-status show ok";
      status.style.background = "";
      status.style.color = "";
      status.textContent = "Opening your email app now — just hit send there to reach us.";
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    highlightActiveNav();
    initScrollReveal();
    initScrollProgressBar();
    initTiltCards();
    initProductsPage();
    initContactForm();
  });
})();
