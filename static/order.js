// Order form handling and JSON generation (refactored)
document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    const addressSection = document.getElementById('addressSection');
    const orderTypeSelect = document.getElementById('order_type');
    const pizzaTypeSelect = document.getElementById('pizza_type');
    const crustSelect = document.getElementById('pizza_crust');
    const sizeSelect = document.getElementById('pizza_size');
    const toppingsSelect = document.getElementById('toppingsSelect');
    const selectedToppingsEl = document.getElementById('selectedToppings');
    const paymentMethodSelect = document.getElementById('payment_method');
    const cardNumberGroup = document.getElementById('cardNumberGroup');
    const cardNumberInput = document.getElementById('card_number');
    const tipChoiceSelect = document.getElementById('tip_choice');
    const tipAmountGroup = document.getElementById('tipAmountGroup');
    const tipAmountInput = document.getElementById('tip_amount');
    const orderPreview = document.getElementById('orderPreview');
    const jsonOutput = document.getElementById('jsonOutput');
    const editOrderBtn = document.getElementById('editOrder');
    const confirmOrderBtn = document.getElementById('confirmOrder');
    // Pizza preview elements
    const pizzaLayersEl = document.getElementById('pizzaLayers');
    const pizzaBaseEl = document.getElementById('pizzaBase');
    // Drinks & Shakes elements
    const milkshakeSelect = document.getElementById('milkshakeSelect');
    const addMilkshakeBtn = document.getElementById('addMilkshakeBtn');
    const milkshakeQtyInput = document.getElementById('milkshakeQty');
    const selectedMilkshakesEl = document.getElementById('selectedMilkshakes');
    const softDrinkSelect = document.getElementById('softDrinkSelect');
    const softDrinkSizeSelect = document.getElementById('softDrinkSizeSelect');
    const softDrinkFlavorSelect = document.getElementById('softDrinkFlavorSelect');
    const softDrinkFlavorGroup = document.getElementById('softDrinkFlavorGroup');
    const addSoftDrinkBtn = document.getElementById('addSoftDrinkBtn');
    const softDrinkQtyInput = document.getElementById('softDrinkQty');
    const selectedSoftDrinksEl = document.getElementById('selectedSoftDrinks');
    
    // Order Summary Sidebar elements
    const orderSummary = document.getElementById('orderSummary');
    const emptyOrder = document.getElementById('emptyOrder');
    const pizzaSection = document.getElementById('pizzaSection');
    const pizzaItem = document.getElementById('pizzaItem');
    const extrasSection = document.getElementById('extrasSection');
    const extrasList = document.getElementById('extrasList');
    const deliverySection = document.getElementById('deliverySection');
    const deliveryItem = document.getElementById('deliveryItem');
    const orderSubtotal = document.getElementById('orderSubtotal');
    const orderTotal = document.getElementById('orderTotal');
    const estimatedTime = document.getElementById('estimatedTime');

    const PLACE_ORDER_URL = window.PLACE_ORDER_URL;
    const STATIC_ASSETS_BASE = (window.STATIC_ASSETS_BASE || '').replace(/\\/g, '/');
    // Inline prices (from prices.py)
    const PRICES = {
        items: {
            milkshakes: {
                "Strawberry Milkshake": 12,
                "Oreo Milkshake": 12,
                "Banana Milkshake": 12,
                "Chocolate Milkshake": 12,
                "Hazelnut Milkshake": 12
            },
            soft_drinks: {
                "Cola": {"can": 5, "1.5L bottle": 15},
                "Cola Zero": {"can": 5, "1.5L bottle": 15},
                "Fanta": {"can": 5, "1.5L bottle": 15},
                "Sprite": {"can": 5, "1.5L bottle": 15},
                "XL Energy": {"can": 5},
                "Tropit": {"pouch": 5},
                "Water": {"bottle": 5, "1.5L bottle": 10},
                "Prigat": {"bottle": 10, "1.5L bottle": 15, "types": ["Peach", "Apple", "Orange", "Grape", "Pineapple"]}
            },
            toppings: {
                "olives": 3, "pepperoni": 5, "corn": 3, "jalapenos": 3,
                "extra cheese": 5, "tomato": 2, "mushrooms": 3, "onions": 3,
                "red onions": 3, "anchovy": 6, "broccoli": 3, "bell pepper": 3,
                "salami": 5, "chicken bits": 6, "tzatziki": 4, "black olives": 3,
                "basil": 2, "chili flakes": 1, "hot sauce": 1, "cooked tomatoes": 2
            }
        },
        pizza_base: 0, // Pizza base price (to be determined later)
        delivery_fee: 8, // Fixed delivery fee
        estimated_delivery_time: "25-35 min"
    };

    // Map toppings -> image filenames available in static/assets
    const TOPPING_IMAGE_MAP = {
        'olives': 'olives.png',
        'pepperoni': 'pepperoni.png',
        'corn': 'corn.png',
        'jalapenos': 'jalapenos.png',
        'extra cheese': 'extra_cheese.png',
        'tomato': 'tomato.png',
        'cooked tomatoes': 'tomato.png',
        'mushrooms': 'mushrooms.png',
        'onions': 'onions.png',
        'red onions': 'red_onions.png',
        'anchovy': 'anchovy.png',
        'broccoli': 'broccoli.png',
        'bell pepper': 'bell_peppers.png',
        'salami': 'salami.png',
        'chicken bits': 'chicken_bits.png',
        'tzatziki': 'tzatziki.png',
        'black olives': 'black_olives.png',
        'basil': 'basil.png',
        'chili flakes': 'chili_flakes.png',
        'hot sauce': 'hot_sauce.png'
    };

    function getToppingImageUrl(toppingValue) {
        let file = TOPPING_IMAGE_MAP[toppingValue];
        if (!file) {
            const sanitized = toppingValue
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '') + '.png';
            file = sanitized;
        }
        return STATIC_ASSETS_BASE + file;
    }

    function extraItemKey(meta) {
        const parts = [];
        if (meta.type) parts.push(meta.type);
        if (meta.size) parts.push(meta.size);
        if (meta.flavor) parts.push(meta.flavor);
        return parts.filter(Boolean).join(' - ');
    }

    function extraItemPayload(meta) {
        const payload = { type: meta.type, price: meta.price, quantity: meta.quantity };
        if (meta.size) payload.size = meta.size;
        if (meta.flavor) payload.flavor = meta.flavor;
        return payload;
    }

    // Deterministic PRNG utilities for piece distribution
    function seededRandom(seed) {
        let x = seed || 123456789;
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        return ((x >>> 0) % 100000) / 100000;
    }

    function createPrng(seed) {
        let state = (seed >>> 0) || 123456789;
        return function() {
            state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
            return (state >>> 0) / 4294967296; // [0,1)
        };
    }

    function stringToSeed(str) {
        let h = 2166136261 >>> 0; // FNV-1a base
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    function polarToCartesian(r, theta) {
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        return { x, y };
    }

    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~2.399963...

    function generateEvenPolarPoints(count, seedBase) {
        const rng = createPrng(seedBase);
        const points = [];
        for (let i = 1; i <= count; i++) {
            const rNorm = Math.sqrt((i - 0.5) / count) * 0.96; // keep margin inside
            let theta = i * GOLDEN_ANGLE;
            theta += (rng() - 0.5) * 0.25; // slight jitter
            const rJitter = rNorm * (0.94 + 0.12 * rng());
            const x = rJitter * Math.cos(theta);
            const y = rJitter * Math.sin(theta);
            const rot = rng() * 360;
            points.push({ x, y, rot });
        }
        return points;
    }

    function rebuildPizzaLayersFromSelectedChips() {
        if (!pizzaLayersEl) {
            console.warn('Pizza layers element not found');
            return;
        }
        pizzaLayersEl.innerHTML = '';
        const chips = selectedToppingsEl ? selectedToppingsEl.querySelectorAll('.chip') : [];
        chips.forEach((chip, chipIndex) => {
            const value = chip.dataset.value;
            const url = getToppingImageUrl(value);
            if (!url) return; // skip toppings without images

            // Determine number of pieces per topping
            // Much lower density for clean, sparse topping distribution
            const basePieces = 6; // very low default density
            const densityMap = {
                'extra cheese': 8,
                'pepperoni': 7,
                'olives': 8,
                'corn': 10,
                'jalapenos': 7,
                'tomato': 6,
                'mushrooms': 8,
                'onions': 8,
                'red onions': 8,
                'anchovy': 5,
                'broccoli': 6,
                'bell pepper': 6,
                'salami': 6,
                'chicken bits': 6,
                'tzatziki': 4,
                'black olives': 8,
                'basil': 6,
                'chili flakes': 12,
                'hot sauce': 5,
                'cooked tomatoes': 6
            };
            const numPieces = densityMap[value] || basePieces;

            const seedBase = stringToSeed(value + ':' + chipIndex);
            const points = generateEvenPolarPoints(numPieces, seedBase);
            points.forEach(({ x, y, rot }) => {
                const piece = document.createElement('img');
                piece.className = 'pizza-piece';
                piece.src = url;
                piece.alt = value + ' piece';
                piece.decoding = 'async';
                piece.loading = 'lazy';

                const scaleMap = {
                    'pepperoni': 0.14,
                    'olives': 0.10,
                    'corn': 0.09,
                    'jalapenos': 0.11,
                    'extra cheese': 0.16,
                    'tomato': 0.15,
                    'mushrooms': 0.14,
                    'onions': 0.12,
                    'red onions': 0.12,
                    'anchovy': 0.16,
                    'broccoli': 0.15,
                    'bell pepper': 0.14,
                    'salami': 0.14,
                    'chicken bits': 0.14,
                    'tzatziki': 0.18,
                    'black olives': 0.10,
                    'basil': 0.18,
                    'chili flakes': 0.07,
                    'hot sauce': 0.18,
                    'cooked tomatoes': 0.15
                };
                const scale = scaleMap[value] || 0.12;

                // Constrain toppings to the inner circle of the pizza, avoiding the glow
                const pizzaRadiusPct = 20; // percent of canvas half-size - very tight to inner circle
                const px = 50 + x * pizzaRadiusPct;
                const py = 50 + y * pizzaRadiusPct;

                piece.style.width = Math.round(scale * 100) + '%';
                piece.style.left = px + '%';
                piece.style.top = py + '%';
                piece.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;

                pizzaLayersEl.appendChild(piece);
            });
        });
    }

    // Swap Table/Notes and toggle address block based on order type
    const tableGroup = document.getElementById('tableGroup');
    const notesGroup = document.getElementById('notesGroup');
    const tableInput = document.getElementById('table');
    const notesTextarea = document.getElementById('notes');

    function updateOrderTypeUI(value) {
        const isDelivery = value === 'delivery';
        const isPickup = value === 'pickup';
        const isDineIn = value === 'dine-in';
        // Address visibility + required flags
        addressSection.style.display = isDelivery ? 'block' : 'none';
        const addressFields = addressSection.querySelectorAll('input');
        addressFields.forEach(field => field.required = isDelivery);

        // Show table only for dine-in; show notes for delivery or pickup
        tableGroup.style.display = isDineIn ? 'block' : 'none';
        notesGroup.style.display = (isDelivery || isPickup) ? 'block' : 'none';
        // Disable hidden inputs so FormData ignores them
        tableInput.disabled = !isDineIn;
        notesTextarea.disabled = !(isDelivery || isPickup);
    }

    // Initialize and listen for changes
    updateOrderTypeUI(orderTypeSelect.value);
    orderTypeSelect.addEventListener('change', function() {
        updateOrderTypeUI(this.value);
        updateOrderSummary(); // Update sidebar when order type changes
    });

    // Payment UI toggles
    function updatePaymentUI() {
        const method = paymentMethodSelect ? paymentMethodSelect.value : '';
        const showCard = method === 'card';
        if (cardNumberGroup) cardNumberGroup.style.display = showCard ? 'block' : 'none';
        if (cardNumberInput) {
            cardNumberInput.disabled = !showCard;
            if (!showCard) cardNumberInput.value = '';
        }
    }
    if (paymentMethodSelect) {
        updatePaymentUI();
        paymentMethodSelect.addEventListener('change', updatePaymentUI);
    }

    // Tip UI toggles
    function updateTipUI() {
        const choice = tipChoiceSelect ? tipChoiceSelect.value : '';
        const showAmt = choice === 'yes';
        if (tipAmountGroup) tipAmountGroup.style.display = showAmt ? 'block' : 'none';
        if (tipAmountInput) {
            tipAmountInput.disabled = !showAmt;
            if (!showAmt) tipAmountInput.value = '';
        }
    }
    if (tipChoiceSelect) {
        updateTipUI();
        tipChoiceSelect.addEventListener('change', updateTipUI);
    }

    // Crust options logic: Neapolitan crust only for Neapolitan pizza
    function setCrustOptions(list) {
        const label = '<option value="">Select crust...</option>';
        const opts = list.map(v => `<option value="${v}">${v.charAt(0).toUpperCase() + v.slice(1)}</option>`).join('');
        const current = crustSelect.value;
        crustSelect.innerHTML = label + opts;
        crustSelect.value = list.includes(current) ? current : list[0] || '';
        crustSelect.disabled = false;
    }

    function updateCrustOptions() {
        const type = pizzaTypeSelect ? pizzaTypeSelect.value : '';
        if (type === 'Neapolitan') {
            setCrustOptions(['neapolitan']);
        } else if (type === 'custom') {
            setCrustOptions(['thin', 'thick']);
        } else if (type) {
            // Non-custom predefined pizzas use thin crust
            setCrustOptions(['thin']);
        } else {
            setCrustOptions(['thin', 'thick']);
        }
    }

    if (pizzaTypeSelect && crustSelect) {
        updateCrustOptions();
        pizzaTypeSelect.addEventListener('change', function() {
            updateCrustOptions();
            updateOrderSummary(); // Update sidebar when pizza type changes
        });
    }

    // Size options logic: presets restricted to Small/Large
    function setSizeOptions(list) {
        const labelFor = (v) => {
            if (v === 'small') return 'Small';
            if (v === 'large') return 'Large';
            if (v === 'XL' || v === 'XXL') return v;
            return v.charAt(0).toUpperCase() + v.slice(1);
        };
        const label = '<option value="">Select size...</option>';
        const opts = list.map(v => `<option value="${v}">${labelFor(v)}</option>`).join('');
        const current = sizeSelect.value;
        sizeSelect.innerHTML = label + opts;
        sizeSelect.value = list.includes(current) ? current : list[0] || '';
    }

    function updateSizeOptions() {
        const type = pizzaTypeSelect ? pizzaTypeSelect.value : '';
        if (type && type !== 'custom') {
            setSizeOptions(['small', 'large']);
        } else {
            setSizeOptions(['small', 'large', 'XL', 'XXL']);
        }
    }

    if (pizzaTypeSelect && sizeSelect) {
        updateSizeOptions();
        pizzaTypeSelect.addEventListener('change', updateSizeOptions);
        
        // Add event listeners for size and crust changes
        sizeSelect.addEventListener('change', updateOrderSummary);
        crustSelect.addEventListener('change', updateOrderSummary);
    }

    // Toppings dropdown -> chips with removable hidden inputs
    const selectedToppings = new Set();

    function renderToppingChip(value, labelText, removable = true) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.dataset.value = value;
        const removeBtn = removable ? `<button type="button" class="chip-remove" aria-label="Remove ${labelText}">×</button>` : '';
        chip.innerHTML = `
            <span class="chip-label">${labelText}</span>
            ${removeBtn}
            <input type="hidden" name="pizza_topping" value="${value}">
        `;
        if (removable) {
            chip.querySelector('.chip-remove').addEventListener('click', () => {
                selectedToppings.delete(value);
                chip.remove();
                rebuildPizzaLayersFromSelectedChips();
                updateOrderSummary(); // Update sidebar when topping removed
            });
        }
        selectedToppingsEl.appendChild(chip);
        rebuildPizzaLayersFromSelectedChips();
        updateOrderSummary(); // Update sidebar when topping added
    }

    function addTopping(value) {
        if (!value) return;
        if (selectedToppings.has(value)) return;
        selectedToppings.add(value);
        // Find the label text from the select option
        const opt = Array.from(toppingsSelect.options).find(o => o.value === value);
        const labelText = opt ? opt.textContent : value;
        renderToppingChip(value, labelText, true);
        toppingsSelect.value = '';
    }

    function clearToppings() {
        selectedToppings.clear();
        selectedToppingsEl.innerHTML = '';
        if (toppingsSelect) toppingsSelect.value = '';
        rebuildPizzaLayersFromSelectedChips();
        updateOrderSummary(); // Update sidebar when toppings cleared
    }

    if (toppingsSelect && selectedToppingsEl) {
        toppingsSelect.addEventListener('change', (e) => {
            addTopping(e.target.value);
            // rebuildPizzaLayersFromSelectedChips() and updateOrderSummary() are called in addTopping
        });
    }

    // Sort toppings dropdown alphabetically (keep placeholder first)
    function sortSelectOptions(selectEl) {
        if (!selectEl) return;
        const opts = Array.from(selectEl.options);
        const placeholder = opts.shift();
        const sorted = opts.sort((a, b) => a.text.localeCompare(b.text));
        selectEl.innerHTML = '';
        if (placeholder) selectEl.appendChild(placeholder);
        sorted.forEach(o => selectEl.appendChild(o));
    }

    sortSelectOptions(toppingsSelect);

    // ---------- Drinks & Shakes ----------
    // Track unique variants (ignore quantity)
    const selectedMilkshakeKeys = new Set();
    const selectedSoftDrinkKeys = new Set();

    function variantKey(obj) {
        const typeValue = obj.type || obj.name || '';
        const size = obj.size || '';
        const flavor = obj.flavor || '';
        return `${obj.category}|${typeValue}|${size}|${flavor}`;
    }

    function populateMilkshakeSelect() {
        if (!milkshakeSelect) return;
        const base = '<option value="">Select milkshake...</option>';
        const entries = Object.entries((PRICES.items && PRICES.items.milkshakes) || {});
        const opts = entries
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, price]) => `<option value="${name}">${name} — ${price} NIS</option>`)
            .join('');
        milkshakeSelect.innerHTML = base + opts;
    }

    function populateSoftDrinkSelect() {
        if (!softDrinkSelect) return;
        const base = '<option value="">Select drink...</option>';
        const entries = Object.entries((PRICES.items && PRICES.items.soft_drinks) || {});
        const opts = entries
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, _obj]) => `<option value="${name}">${name}</option>`)
            .join('');
        softDrinkSelect.innerHTML = base + opts;
        if (softDrinkSizeSelect) softDrinkSizeSelect.innerHTML = '<option value="">Select size...</option>';
        if (softDrinkFlavorSelect) softDrinkFlavorSelect.innerHTML = '<option value="">Select flavor...</option>';
        if (softDrinkFlavorGroup) softDrinkFlavorGroup.style.display = 'none';
    }

    function populateSoftDrinkDetails() {
        const name = softDrinkSelect ? softDrinkSelect.value : '';
        const obj = (PRICES.items && PRICES.items.soft_drinks && PRICES.items.soft_drinks[name]) || null;
        if (softDrinkSizeSelect) softDrinkSizeSelect.innerHTML = '<option value="">Select size...</option>';
        if (softDrinkFlavorSelect) softDrinkFlavorSelect.innerHTML = '<option value="">Select flavor...</option>';
        if (softDrinkFlavorGroup) softDrinkFlavorGroup.style.display = 'none';
        if (!obj) return;
        const sizeKeys = Object.keys(obj).filter(k => k !== 'types');
        const sizeOpts = sizeKeys
            .map(size => `<option value="${size}">${size} — ${obj[size]} NIS</option>`)
            .join('');
        if (softDrinkSizeSelect) softDrinkSizeSelect.innerHTML = '<option value="">Select size...</option>' + sizeOpts;
        if (Array.isArray(obj.types) && obj.types.length && softDrinkFlavorSelect && softDrinkFlavorGroup) {
            const flavorOpts = obj.types
                .sort((a, b) => a.localeCompare(b))
                .map(t => `<option value="${t}">${t}</option>`)
                .join('');
            softDrinkFlavorSelect.innerHTML = '<option value="">Select flavor...</option>' + flavorOpts;
            softDrinkFlavorGroup.style.display = 'block';
        }
    }

    function renderExtraChip(item, container) {
        if (!container) return;
        const chip = document.createElement('span');
        chip.className = 'chip';
        const mainLabel = item.type || item.name; // support legacy 'name'
        const parts = [mainLabel];
        if (item.size) parts.push(item.size);
        if (item.flavor) parts.push(item.flavor);
        const qty = Math.max(1, Number(item.quantity) || 1);
        const priceText = `${parts.join(' — ')} (${item.price} NIS)`;
        const key = variantKey(item);
        chip.dataset.key = key;
        chip.innerHTML = `
            <span class=\"chip-label\">${priceText}</span>
            <div class=\"chip-qty\">
                <button type=\"button\" class=\"chip-qty-btn chip-qty-minus\" aria-label=\"Decrease quantity\">−</button>
                <span class=\"chip-qty-count\">${qty}</span>
                <button type=\"button\" class=\"chip-qty-btn chip-qty-plus\" aria-label=\"Increase quantity\">+</button>
            </div>
            <button type=\"button\" class=\"chip-remove\" aria-label=\"Remove ${priceText}\">×</button>
            <input type=\"hidden\" name=\"extra_item\" value='${JSON.stringify({ ...item, quantity: qty })}'>
        `;

        const hidden = chip.querySelector('input[name="extra_item"]');
        const qtyCount = chip.querySelector('.chip-qty-count');
        const minusBtn = chip.querySelector('.chip-qty-minus');
        const plusBtn = chip.querySelector('.chip-qty-plus');

        function setQuantity(newQty) {
            const finalQty = Math.max(1, parseInt(newQty, 10) || 1);
            qtyCount.textContent = String(finalQty);
            try {
                const cur = JSON.parse(hidden.value);
                cur.quantity = finalQty;
                hidden.value = JSON.stringify(cur);
            } catch (_) {}
            updateOrderSummary();
        }

        minusBtn.addEventListener('click', () => setQuantity((parseInt(qtyCount.textContent, 10) || 1) - 1));
        plusBtn.addEventListener('click', () => setQuantity((parseInt(qtyCount.textContent, 10) || 1) + 1));

        chip.querySelector('.chip-remove').addEventListener('click', () => {
            const dkey = chip.dataset.key;
            if (item.category === 'milkshake') selectedMilkshakeKeys.delete(dkey);
            if (item.category === 'soft_drink') selectedSoftDrinkKeys.delete(dkey);
            chip.remove();
            updateOrderSummary();
        });

        container.appendChild(chip);
        updateOrderSummary();
    }

    function addMilkshake() {
        const name = milkshakeSelect ? milkshakeSelect.value : '';
        if (!name) return;
        const price = PRICES.items.milkshakes[name];
        const quantity = Math.max(1, parseInt(milkshakeQtyInput && milkshakeQtyInput.value, 10) || 1);
        const payload = { category: 'milkshake', type: name, price, quantity };
        const key = variantKey(payload);
        const existing = selectedMilkshakesEl ? selectedMilkshakesEl.querySelector(`.chip[data-key="${CSS.escape(key)}"]`) : null;
        if (existing) {
            const qtySpan = existing.querySelector('.chip-qty-count');
            const hidden = existing.querySelector('input[name="extra_item"]');
            const curQty = Math.max(1, parseInt(qtySpan.textContent, 10) || 1);
            const newQty = curQty + quantity;
            qtySpan.textContent = String(newQty);
            try { const obj = JSON.parse(hidden.value); obj.quantity = newQty; hidden.value = JSON.stringify(obj); } catch(_){}
            updateOrderSummary();
        } else {
            selectedMilkshakeKeys.add(key);
            renderExtraChip(payload, selectedMilkshakesEl);
        }
        milkshakeSelect.value = '';
        if (milkshakeQtyInput) milkshakeQtyInput.value = '1';
    }

    function addSoftDrink() {
        const name = softDrinkSelect ? softDrinkSelect.value : '';
        const size = softDrinkSizeSelect ? softDrinkSizeSelect.value : '';
        const flavor = softDrinkFlavorSelect ? softDrinkFlavorSelect.value : '';
        if (!name || !size) return;
        const obj = PRICES.items.soft_drinks[name] || {};
        const price = obj[size];
        const quantity = Math.max(1, parseInt(softDrinkQtyInput && softDrinkQtyInput.value, 10) || 1);
        const payload = { category: 'soft_drink', type: name, size, price, quantity };
        if (Array.isArray(obj.types) && obj.types.length && flavor) payload.flavor = flavor;
        const key = variantKey(payload);
        const existing = selectedSoftDrinksEl ? selectedSoftDrinksEl.querySelector(`.chip[data-key="${CSS.escape(key)}"]`) : null;
        if (existing) {
            const qtySpan = existing.querySelector('.chip-qty-count');
            const hidden = existing.querySelector('input[name="extra_item"]');
            const curQty = Math.max(1, parseInt(qtySpan.textContent, 10) || 1);
            const newQty = curQty + quantity;
            qtySpan.textContent = String(newQty);
            try { const obj2 = JSON.parse(hidden.value); obj2.quantity = newQty; hidden.value = JSON.stringify(obj2); } catch(_){}
            updateOrderSummary();
        } else {
            selectedSoftDrinkKeys.add(key);
            renderExtraChip(payload, selectedSoftDrinksEl);
        }
        if (softDrinkQtyInput) softDrinkQtyInput.value = '1';
    }

    // init
    populateMilkshakeSelect();
    populateSoftDrinkSelect();
    if (softDrinkSelect) softDrinkSelect.addEventListener('change', populateSoftDrinkDetails);
    if (addMilkshakeBtn) addMilkshakeBtn.addEventListener('click', addMilkshake);
    if (addSoftDrinkBtn) addSoftDrinkBtn.addEventListener('click', addSoftDrink);

    // Order Summary Sidebar Update Functions
    function updateOrderSummary() {
        if (!orderSummary) return;
        
        // Calculate pizza and toppings total
        const { pizzaTotal, hasPizza } = calculatePizzaTotal();
        
        // Calculate extras total
        const inputs = Array.from(document.querySelectorAll('input[name="extra_item"]'));
        let extrasTotal = 0;
        let hasExtras = false;
        
        for (const i of inputs) {
            try {
                const obj = JSON.parse(i.value);
                const p = Number(obj.price) || 0;
                const q = Math.max(1, Number(obj.quantity) || 1);
                extrasTotal += p * q;
                hasExtras = true;
            } catch (_) {}
        }
        
        // Check if delivery is selected
        const orderType = orderTypeSelect ? orderTypeSelect.value : '';
        const isDelivery = orderType === 'delivery';
        const deliveryFee = isDelivery ? PRICES.delivery_fee : 0;
        
        // Calculate totals
        const subtotal = pizzaTotal + extrasTotal;
        const total = subtotal + deliveryFee;
        
        // Show/hide sections based on content
        const hasItems = hasPizza || hasExtras;
        updateEmptyState(hasItems);
        updatePizzaSection(hasPizza);
        updateExtrasSection(hasExtras);
        updateDeliverySection(isDelivery);
        updateTotals(subtotal, total);
        updateStatusIndicator(hasItems);
    }
    
    function calculatePizzaTotal() {
        const pizzaType = pizzaTypeSelect ? pizzaTypeSelect.value : '';
        const pizzaSize = sizeSelect ? sizeSelect.value : '';
        const pizzaCrust = crustSelect ? crustSelect.value : '';
        
        if (!pizzaType || !pizzaSize || !pizzaCrust) {
            return { pizzaTotal: 0, hasPizza: false };
        }
        
        // Calculate toppings cost
        const toppingChips = selectedToppingsEl ? selectedToppingsEl.querySelectorAll('.chip') : [];
        let toppingsTotal = 0;
        const toppingsList = [];
        
        for (const chip of toppingChips) {
            const toppingValue = chip.dataset.value;
            const toppingPrice = PRICES.items.toppings[toppingValue] || 0;
            toppingsTotal += toppingPrice;
            toppingsList.push({
                name: toppingValue,
                price: toppingPrice
            });
        }
        
        // Pizza base cost (currently 0)
        const basePrice = PRICES.pizza_base;
        const pizzaTotal = basePrice + toppingsTotal;
        
        return {
            pizzaTotal,
            hasPizza: true,
            basePrice,
            toppingsTotal,
            toppingsList,
            pizzaType,
            pizzaSize,
            pizzaCrust
        };
    }
    
    function updateEmptyState(hasItems) {
        if (!emptyOrder) return;
        emptyOrder.style.display = hasItems ? 'none' : 'block';
    }
    
    function updatePizzaSection(hasPizza) {
        if (!pizzaSection || !pizzaItem) return;
        
        pizzaSection.style.display = hasPizza ? 'block' : 'none';
        
        if (hasPizza) {
            const { basePrice, toppingsTotal, toppingsList, pizzaType, pizzaSize, pizzaCrust, pizzaTotal } = calculatePizzaTotal();
            
            pizzaItem.style.display = 'block';
            pizzaItem.innerHTML = `
                <div class="item-details">
                    <div class="item-name">${pizzaType === 'custom' ? 'Custom Pizza' : pizzaType}</div>
                    <div class="item-specs">
                        <span class="spec-size">${pizzaSize.charAt(0).toUpperCase() + pizzaSize.slice(1)}</span>
                        <span class="spec-crust">${pizzaCrust.charAt(0).toUpperCase() + pizzaCrust.slice(1)} Crust</span>
                    </div>
                    ${toppingsList.length > 0 ? createToppingsBreakdown(toppingsList, basePrice) : ''}
                </div>
                <div class="item-price">
                    <span class="price-amount">${pizzaTotal}</span>
                    <span class="price-currency">NIS</span>
                </div>
            `;
        }
    }
    
    function createToppingsBreakdown(toppingsList, basePrice) {
        const toppingsHtml = toppingsList.map(topping => {
            const displayName = topping.name.charAt(0).toUpperCase() + topping.name.slice(1);
            return `<span class="topping-item">+${displayName} (${topping.price} NIS)</span>`;
        }).join('');
        
        let breakdown = '';
        if (basePrice > 0) {
            breakdown += `<div class="pizza-breakdown"><small>Base: ${basePrice} NIS</small></div>`;
        }
        if (toppingsHtml) {
            breakdown += `<div class="item-toppings"><small>${toppingsHtml}</small></div>`;
        }
        
        return breakdown;
    }
    
    function updateExtrasSection(hasExtras) {
        if (!extrasSection || !extrasList) return;
        
        extrasSection.style.display = hasExtras ? 'block' : 'none';
        
        if (hasExtras) {
            // Update extras list
            const inputs = Array.from(document.querySelectorAll('input[name="extra_item"]'));
            extrasList.innerHTML = '';
            
            for (const input of inputs) {
                try {
                    const obj = JSON.parse(input.value);
                    const item = createExtrasListItem(obj);
                    extrasList.appendChild(item);
                } catch (_) {}
            }
        }
    }
    
    function createExtrasListItem(obj) {
        const item = document.createElement('div');
        item.className = 'summary-item';
        
        const typeValue = obj.type || obj.name;
        const parts = [typeValue];
        if (obj.size) parts.push(obj.size);
        if (obj.flavor) parts.push(obj.flavor);
        const qty = Math.max(1, Number(obj.quantity) || 1);
        const price = Number(obj.price) || 0;
        const totalPrice = price * qty;
        
        item.innerHTML = `
            <div class="item-details">
                <div class="item-name">${parts.join(' — ')}</div>
                ${qty > 1 ? `<div class="item-quantity">Qty: ${qty}</div>` : ''}
            </div>
            <div class="item-price">
                <span class="price-amount">${totalPrice}</span>
                <span class="price-currency">NIS</span>
            </div>
        `;
        
        return item;
    }
    
    function updateDeliverySection(isDelivery) {
        if (!deliverySection || !deliveryItem) return;
        
        deliverySection.style.display = isDelivery ? 'block' : 'none';
        
        if (isDelivery) {
            deliveryItem.style.display = 'block';
            deliveryItem.innerHTML = `
                <div class="item-details">
                    <div class="item-name">Delivery Fee</div>
                    <div class="item-address">
                        <small>To: Yavne, Israel</small>
                    </div>
                </div>
                <div class="item-price">
                    <span class="price-amount">${PRICES.delivery_fee}</span>
                    <span class="price-currency">NIS</span>
                </div>
            `;
        }
    }
    
    function updateTotals(subtotal, total) {
        if (orderSubtotal) {
            orderSubtotal.textContent = `${subtotal} NIS`;
        }
        
        if (orderTotal) {
            const amountSpan = orderTotal.querySelector('.amount');
            if (amountSpan) {
                amountSpan.textContent = total;
            }
        }
        
        // Show/hide estimated time
        if (estimatedTime) {
            const isDelivery = orderTypeSelect ? orderTypeSelect.value === 'delivery' : false;
            estimatedTime.style.display = isDelivery ? 'flex' : 'none';
            if (isDelivery) {
                estimatedTime.innerHTML = `
                    <i class="fas fa-clock"></i>
                    Est. delivery: ${PRICES.estimated_delivery_time}
                `;
            }
        }
    }
    
    function updateStatusIndicator(hasItems) {
        const statusIndicator = orderSummary ? orderSummary.querySelector('.status-indicator') : null;
        if (!statusIndicator) return;
        
        if (hasItems) {
            statusIndicator.textContent = 'Building...';
            statusIndicator.className = 'status-indicator building';
        } else {
            statusIndicator.textContent = 'Empty';
            statusIndicator.className = 'status-indicator building';
        }
    }

    function clearExtras() {
        selectedMilkshakeKeys.clear();
        selectedSoftDrinkKeys.clear();
        if (selectedMilkshakesEl) selectedMilkshakesEl.innerHTML = '';
        if (selectedSoftDrinksEl) selectedSoftDrinksEl.innerHTML = '';
        updateOrderSummary();
    }

    // Initialize the order summary and pizza visual
    updateOrderSummary();
    rebuildPizzaLayersFromSelectedChips();

    // Auto-lock toppings for predefined types
    const PRESET_TOPPINGS = {
        "Anti-Vegan Pizza": ["pepperoni", "salami", "chicken bits"],
        "Mediterrenean": ["tzatziki", "olives", "cooked tomatoes", "red onions"],
        "Neapolitan": ["basil"],
        "Mexican Bravery": ["jalapenos", "pepperoni", "chili flakes", "hot sauce"],
        "Moshe's Favorite": ["red onions", "broccoli", "pepperoni", "extra cheese", "black olives", "corn"]
    };

    // Map UI pizza type + size -> class name for JSON
    function mapPizzaTypeToClassName(uiType, sizeValue) {
        if (!uiType || uiType === 'custom') return 'Custom';
        const sizeKey = (sizeValue || '').toLowerCase();
        const map = {
            "Anti-Vegan Pizza": { small: "Anti_VeganP", large: "Anti_VeganF" },
            "Mediterrenean": { small: "MediterreneanP", large: "MediterreneanF" },
            "Neapolitan": { small: "NeapolitanP", large: "NeapolitanF" },
            "Mexican Bravery": { small: "Mexican_BraveryP", large: "Mexican_BraveryF" },
            "Moshe's Favorite": { small: "Moshes_FavoriteP", large: "Moshes_FavoriteF" }
        };
        const entry = map[uiType];
        if (!entry) return uiType; // fallback
        // default to small if size is missing/unexpected
        return entry[sizeKey] || entry.small;
    }

    function prefillToppings(list, removable = false) {
        clearToppings();
        const sortedList = [...list].sort((a, b) => a.localeCompare(b));
        sortedList.forEach(v => {
            const opt = Array.from(toppingsSelect.options).find(o => o.value === v);
            const labelText = opt ? opt.textContent : v;
            selectedToppings.add(v);
            renderToppingChip(v, labelText, removable);
        });
        rebuildPizzaLayersFromSelectedChips();
        updateOrderSummary(); // Update sidebar when preset toppings loaded
    }

    function updatePizzaTypeLocks() {
        const type = pizzaTypeSelect ? pizzaTypeSelect.value : '';
        updateCrustOptions();
        if (!toppingsSelect) return;
        if (type && type !== 'custom' && PRESET_TOPPINGS[type]) {
            prefillToppings(PRESET_TOPPINGS[type], false);
            toppingsSelect.disabled = true;
        } else {
            // custom or empty selection
            clearToppings();
            toppingsSelect.disabled = false;
        }
    }

    if (pizzaTypeSelect) {
        updatePizzaTypeLocks();
        pizzaTypeSelect.addEventListener('change', updatePizzaTypeLocks);
    }

    // Handle form submission
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        generateOrderPreview();
    });

    // Edit order button
    editOrderBtn.addEventListener('click', function() {
        orderPreview.style.display = 'none';
        orderForm.style.display = 'block';
    });

    // Confirm order button
    confirmOrderBtn.addEventListener('click', function() {
        saveOrder();
    });

    // Generate order preview
    function generateOrderPreview() {
        const formData = new FormData(orderForm);
        const orderData = {};
        for (let [key, value] of formData.entries()) {
            if (orderData.hasOwnProperty(key)) {
                if (Array.isArray(orderData[key])) {
                    orderData[key].push(value);
                } else {
                    orderData[key] = [orderData[key], value];
                }
            } else {
                orderData[key] = value;
            }
        }

        const isDelivery = orderData.order_type === 'delivery';
        const maskedCardPrev = (() => {
            if ((orderData.payment_method || '') !== 'card') return '';
            const digits = (orderData.card_number || '').replace(/\D/g, '');
            const last4 = digits.slice(-4);
            return last4 ? `**** **** **** ${last4}` : '';
        })();
        const tipAmountPrev = (() => {
            const choice = orderData.tip_choice;
            if (choice === 'yes') return parseFloat(orderData.tip_amount) || 0;
            return 0;
        })();
        const toppingsArrayPrev = Array.isArray(orderData.pizza_topping)
            ? [...orderData.pizza_topping]
            : (orderData.pizza_topping ? [orderData.pizza_topping] : []);
        toppingsArrayPrev.sort((a, b) => a.localeCompare(b));

        const pizzaTypeForJsonPrev = mapPizzaTypeToClassName(orderData.pizza_type, orderData.pizza_size);
        // Extras for preview: aggregate and flatten as separate item keys
        const extraInputsPrev = Array.from(document.querySelectorAll('input[name="extra_item"]'));
        const extrasParsedPrev = extraInputsPrev.map(i => { try { return JSON.parse(i.value); } catch(e){ return null; } }).filter(Boolean);
        const extrasAggPrev = new Map();
        for (const it of extrasParsedPrev) {
            const typeValue = it.type || it.name;
            const keyId = [it.category, typeValue, it.size || '', it.flavor || ''].join('|');
            const unit = Number(it.price) || 0;
            const qty = Math.max(1, Number(it.quantity) || 1);
            if (!extrasAggPrev.has(keyId)) {
                extrasAggPrev.set(keyId, { category: it.category, type: typeValue, size: it.size, flavor: it.flavor, price: unit, quantity: qty });
            } else {
                extrasAggPrev.get(keyId).quantity += qty;
            }
        }
        const extraItemsObjPrev = {};
        for (const [, v] of extrasAggPrev) {
            const payload = extraItemPayload(v);
            if (v.category === 'milkshake' && !extraItemsObjPrev.milkshake) {
                extraItemsObjPrev.milkshake = payload;
            } else if (v.category === 'soft_drink' && !extraItemsObjPrev.soft_drink) {
                extraItemsObjPrev.soft_drink = payload;
            }
        }

        const orderJson = {
            order: {
                customer_name: orderData.customer_name,
                order_type: orderData.order_type,
                phone_number: orderData.phone_number,
                email: orderData.email,
                table: isDelivery ? 'irrelevant' : orderData.table,
                notes: isDelivery ? (orderData.notes || '') : '',
                address: isDelivery ? {
                    city: orderData.city,
                    street: orderData.street,
                    "building number": parseInt(orderData.building_number) || 0,
                    entrance: orderData.entrance,
                    floor: orderData.floor,
                    apartment: parseInt(orderData.apartment) || 0
                } : 'irrelevant',
                items: {
                    pizza: {
                        type: pizzaTypeForJsonPrev,
                        size: orderData.pizza_size,
                        crust: orderData.pizza_crust,
                        topping: toppingsArrayPrev
                    },
                    ...extraItemsObjPrev
                },
                payment: {
                    method: orderData.payment_method || '',
                    card: maskedCardPrev
                },
                tip: tipAmountPrev
            }
        };

        jsonOutput.textContent = JSON.stringify(orderJson, null, 4);
        orderForm.style.display = 'none';
        orderPreview.style.display = 'block';
    }

    // Save order to backend
    async function saveOrder() {
        try {
            const formData = new FormData(orderForm);
            const orderData = {};
            for (let [key, value] of formData.entries()) {
                if (orderData.hasOwnProperty(key)) {
                    if (Array.isArray(orderData[key])) {
                        orderData[key].push(value);
                    } else {
                        orderData[key] = [orderData[key], value];
                    }
                } else {
                    orderData[key] = value;
                }
            }
            const isDelivery = orderData.order_type === 'delivery';
            const maskedCardSave = (() => {
                if ((orderData.payment_method || '') !== 'card') return '';
                const digits = (orderData.card_number || '').replace(/\D/g, '');
                const last4 = digits.slice(-4);
                return last4 ? `**** **** **** ${last4}` : '';
            })();
            const tipAmountSave = (() => {
                const choice = orderData.tip_choice;
                if (choice === 'yes') return parseFloat(orderData.tip_amount) || 0;
                return 0;
            })();
            const toppingsArraySave = Array.isArray(orderData.pizza_topping)
                ? [...orderData.pizza_topping]
                : (orderData.pizza_topping ? [orderData.pizza_topping] : []);
            toppingsArraySave.sort((a, b) => a.localeCompare(b));

            const pizzaTypeForJsonSave = mapPizzaTypeToClassName(orderData.pizza_type, orderData.pizza_size);
            // Build items including extras
            const extraInputsSave = Array.from(document.querySelectorAll('input[name="extra_item"]'));
            const extrasParsedSave = extraInputsSave.map(i => { try { return JSON.parse(i.value); } catch(e){ return null; } }).filter(Boolean);
            const itemsObj = {
                pizza: {
                    type: pizzaTypeForJsonSave,
                    size: orderData.pizza_size,
                    crust: orderData.pizza_crust,
                    topping: toppingsArraySave
                }
            };
            // aggregate extras and group under singular keys
            const extrasAggSave = new Map();
            for (const it of extrasParsedSave) {
                const typeValue = it.type || it.name;
                const keyId = [it.category, typeValue, it.size || '', it.flavor || ''].join('|');
                const unit = Number(it.price) || 0;
                const qty = Math.max(1, Number(it.quantity) || 1);
                if (!extrasAggSave.has(keyId)) {
                    extrasAggSave.set(keyId, { category: it.category, type: typeValue, size: it.size, flavor: it.flavor, price: unit, quantity: qty });
                } else {
                    extrasAggSave.get(keyId).quantity += qty;
                }
            }
            for (const [, v] of extrasAggSave) {
                const payload = extraItemPayload(v);
                if (v.category === 'milkshake' && !itemsObj.milkshake) {
                    itemsObj.milkshake = payload;
                } else if (v.category === 'soft_drink' && !itemsObj.soft_drink) {
                    itemsObj.soft_drink = payload;
                }
            }
            const orderJson = {
                order: {
                    customer_name: orderData.customer_name,
                    order_type: orderData.order_type,
                    phone_number: orderData.phone_number,
                    email: orderData.email,
                    table: isDelivery ? 'Irrelevant' : orderData.table,
                    notes: isDelivery ? (orderData.notes || '') : '',
                    address: isDelivery ? {
                        city: orderData.city,
                        street: orderData.street,
                        "building number": parseInt(orderData.building_number) || 0,
                        entrance: orderData.entrance,
                        floor: orderData.floor,
                        apartment: parseInt(orderData.apartment) || 0
                    } : 'Irrelevant',
                    items: itemsObj,
                    payment: {
                        method: orderData.payment_method || '',
                        card: maskedCardSave
                    },
                    tip: tipAmountSave
                }
            };

            const response = await fetch(PLACE_ORDER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderJson)
            });

            if (response.ok) {
                showSuccessMessage();
                orderForm.reset();
                clearToppings();
                clearExtras();
                orderPreview.style.display = 'none';
                orderForm.style.display = 'block';
                addressSection.style.display = 'none';
                updateOrderTypeUI(orderTypeSelect.value || '');
                updateCrustOptions();
                updateOrderSummary();
            } else {
                throw new Error('Failed to save order');
            }
        } catch (error) {
            console.error('Error saving order:', error);
            showErrorMessage();
        }
    }

    function showSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h3>Order Saved Successfully!</h3>
            <p>Your order has been saved.</p>
        `;
        document.querySelector('.order-section .container').appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 5000);
    }

    function showErrorMessage() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Saving Order</h3>
            <p>There was a problem saving your order. Please try again.</p>
        `;
        document.querySelector('.order-section .container').appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
});






