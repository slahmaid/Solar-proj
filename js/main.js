      (function () {
        function initOrderForm(form) {
          var saleTarget = form.getAttribute("data-price-sale-target");
          var compareTarget = form.getAttribute("data-price-compare-target");
          var discountTarget = form.getAttribute("data-discount-target");
          var imgTarget = form.getAttribute("data-variant-img-target");
          var saleEl = saleTarget ? document.getElementById(saleTarget) : null;
          var compareEl = compareTarget ? document.getElementById(compareTarget) : null;
          var discountEl = discountTarget ? document.getElementById(discountTarget) : null;
          var variantImg = imgTarget ? document.getElementById(imgTarget) : null;
          var radios = form.querySelectorAll(".variant-row input[type='radio']");
          var qtyInput = form.querySelector(".quantity-control input[type='number']");
          var btnMinus = form.querySelector(".qty-minus-btn");
          var btnPlus = form.querySelector(".qty-plus-btn");
          var totalAmountEl = form.querySelector(".quantity-total-amount");

          function formatDhAmount(n) {
            var num = parseInt(String(n), 10);
            if (isNaN(num)) return String(n);
            return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " د.م";
          }

          function discountPercent(sale, compare) {
            var s = parseInt(String(sale), 10);
            var c = parseInt(String(compare), 10);
            if (isNaN(s) || isNaN(c) || c <= 0 || s > c) return null;
            return Math.round((1 - s / c) * 100);
          }

          function syncPrice() {
            var checked = form.querySelector(".variant-row input[type='radio']:checked");
            if (!checked) return;
            var sale = checked.dataset.priceSale;
            var compare = checked.dataset.priceCompare;
            if (saleEl && sale) saleEl.textContent = sale;
            if (compareEl && compare) compareEl.textContent = formatDhAmount(compare);
            if (discountEl && sale && compare) {
              var pct = discountPercent(sale, compare);
              if (pct !== null) {
                discountEl.innerHTML =
                  "خصم <span class=\"cta-price-discount-pct\" dir=\"ltr\">" + pct + "%</span>";
              }
            }
            syncTotal();
          }

          function syncTotal() {
            if (!totalAmountEl || !qtyInput) return;
            var checked = form.querySelector(".variant-row input[type='radio']:checked");
            if (!checked) return;
            var unit = parseInt(String(checked.dataset.priceSale), 10);
            var qty = parseInt(qtyInput.value, 10);
            if (isNaN(qty) || qty < 1) qty = 1;
            if (isNaN(unit)) return;
            totalAmountEl.textContent = formatDhAmount(String(unit * qty));
          }

          function syncVariantImage() {
            var checked = form.querySelector(".variant-row input[type='radio']:checked");
            if (!checked || !variantImg) return;
            var src = checked.dataset.variantImg;
            if (src) variantImg.src = src;
            var alt = checked.dataset.variantAlt;
            if (alt) variantImg.alt = alt;
          }

          radios.forEach(function (r) {
            r.addEventListener("change", function () {
              syncPrice();
              syncVariantImage();
            });
          });
          syncPrice();
          syncVariantImage();

          function clampQty() {
            if (!qtyInput) return;
            var n = parseInt(qtyInput.value, 10);
            if (isNaN(n) || n < 1) n = 1;
            if (n > 99) n = 99;
            qtyInput.value = String(n);
          }

          if (btnMinus && qtyInput) {
            btnMinus.addEventListener("click", function () {
              qtyInput.value = String(Math.max(1, parseInt(qtyInput.value, 10) - 1 || 1));
              clampQty();
              syncTotal();
            });
          }
          if (btnPlus && qtyInput) {
            btnPlus.addEventListener("click", function () {
              qtyInput.value = String(Math.min(99, (parseInt(qtyInput.value, 10) || 1) + 1));
              clampQty();
              syncTotal();
            });
          }
          if (qtyInput) {
            qtyInput.addEventListener("change", function () {
              clampQty();
              syncTotal();
            });
            qtyInput.addEventListener("input", syncTotal);
          }

          function getFieldValue(candidates) {
            for (var i = 0; i < candidates.length; i += 1) {
              var el = form.querySelector(candidates[i]);
              if (el && el.value) return el.value.trim();
            }
            return "";
          }

          function getApiBaseUrl() {
            var byForm = form.getAttribute("data-api-base");
            var byBody = document.body.getAttribute("data-api-base");
            var raw = byForm || byBody || "http://localhost:3000";
            return raw.replace(/\/$/, "");
          }

          form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            var checked = form.querySelector(".variant-row input[type='radio']:checked");
            var model = checked ? (checked.value || "").toUpperCase() : "";
            var unitPrice = checked && checked.dataset.priceSale ? checked.dataset.priceSale + " د.م" : "-";
            var qty = qtyInput ? qtyInput.value : "1";
            var fullname = getFieldValue(["#fullname", "#fullname-retarget", "input[name='fullname']", "input[name='fullname_rt']"]);
            var city = getFieldValue(["#city", "#city-retarget", "input[name='city']", "input[name='city_rt']"]);
            var address = getFieldValue(["#address", "#address-retarget", "input[name='address']", "input[name='address_rt']"]);
            var phone = getFieldValue(["#phone", "#phone-retarget", "input[name='phone']", "input[name='phone_rt']"]);
            var total = totalAmountEl ? totalAmountEl.textContent.trim() : "-";
            var payload = {
              model: model,
              quantity: parseInt(qty, 10) || 1,
              unitPrice: parseInt((checked && checked.dataset.priceSale) || "0", 10) || 0,
              totalPrice: parseInt(String(total).replace(/[^\d]/g, ""), 10) || 0,
              fullname: fullname,
              city: city,
              address: address,
              phone: phone,
              sourceForm: form.id || "unknown"
            };

            var submitBtn = form.querySelector("button[type='submit']");
            if (submitBtn) submitBtn.disabled = true;

            fetch(getApiBaseUrl() + "/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            })
              .then(function (res) {
                if (!res.ok) throw new Error("submit_failed");
                return res.json();
              })
              .then(function () {
                alert("تم استلام طلبك بنجاح. سنتواصل معك قريباً للتأكيد.");
                form.reset();
                if (qtyInput) qtyInput.value = "1";
                var firstOption = form.querySelector(".variant-row input[type='radio']");
                if (firstOption) firstOption.checked = true;
                syncPrice();
                syncVariantImage();
              })
              .catch(function () {
                alert("تعذر إرسال الطلب حالياً. حاول مرة أخرى بعد قليل.");
              })
              .finally(function () {
                if (submitBtn) submitBtn.disabled = false;
              });
          });
        }

        document.querySelectorAll(".order-form").forEach(initOrderForm);
      })();

      (function () {
        var header = document.getElementById("site-header");
        if (!header) return;
        var threshold = 8;
        function syncHeader() {
          var y = window.scrollY || window.pageYOffset || 0;
          if (y <= threshold) {
            header.classList.add("site-header--at-top");
          } else {
            header.classList.remove("site-header--at-top");
          }
        }
        window.addEventListener("scroll", syncHeader, { passive: true });
        window.addEventListener("resize", syncHeader);
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", syncHeader);
        } else {
          syncHeader();
        }
      })();

      (function () {
        var orderSection = document.getElementById("order");
        if (!orderSection) return;
        if (sessionStorage.getItem("order_snap_done") === "1") return;
        var lastY = window.scrollY || 0;
        var snapped = false;

        function getOffset() {
          var raw = getComputedStyle(document.documentElement).getPropertyValue("--scroll-anchor-offset");
          var n = parseFloat(raw);
          return isNaN(n) ? 120 : n;
        }

        function maybeSnapToOrder() {
          if (snapped) return;
          var y = window.scrollY || window.pageYOffset || 0;
          var movingDown = y > lastY;
          lastY = y;
          if (!movingDown || y < 60) return;

          var rect = orderSection.getBoundingClientRect();
          var triggerLine = window.innerHeight * 0.32;
          if (rect.top > 0 && rect.top < triggerLine) {
            snapped = true;
            sessionStorage.setItem("order_snap_done", "1");
            var targetTop = y + rect.top - getOffset();
            window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
          }
        }

        window.addEventListener("scroll", maybeSnapToOrder, { passive: true });
      })();
