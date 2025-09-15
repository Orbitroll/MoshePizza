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
    const extrasSubtotalEl = document.getElementById('extrasSubtotal');

    const PLACE_ORDER_URL = window.PLACE_ORDER_URL;
    const STATIC_ASSETS_BASE = (window.STATIC_ASSETS_BASE || '').replace(/\\/g, '/');
    // Inline prices (from prices.json, without toppings)
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
            }
        }
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
        if (!pizzaLayersEl) return;
        pizzaLayersEl.innerHTML = '';
        const chips = selectedToppingsEl ? selectedToppingsEl.querySelectorAll('.chip') : [];
        chips.forEach((chip, chipIndex) => {
            const value = chip.dataset.value;
            const url = getToppingImageUrl(value);
            if (!url) return; // skip toppings without images

            // Determine number of pieces per topping
            const basePieces = 14; // default density
            const densityMap = {
                'extra cheese': 18,
                'pepperoni': 16,
                'olives': 18,
                'corn': 20,
                'jalapenos': 14,
                'tomato': 12,
                'mushrooms': 18,
                'onions': 18,
                'red onions': 18,
                'anchovy': 10,
                'broccoli': 14,
                'bell pepper': 14,
                'salami': 14,
                'chicken bits': 14,
                'tzatziki': 10,
                'black olives': 18,
                'basil': 10,
                'chili flakes': 24,
                'hot sauce': 10,
                'cooked tomatoes': 12
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
                    'pepperoni': 0.16,
                    'olives': 0.12,
                    'corn': 0.10,
                    'jalapenos': 0.13,
                    'extra cheese': 0.20,
                    'tomato': 0.18,
                    'mushrooms': 0.16,
                    'onions': 0.14,
                    'red onions': 0.14,
                    'anchovy': 0.20,
                    'broccoli': 0.18,
                    'bell pepper': 0.16,
                    'salami': 0.16,
                    'chicken bits': 0.16,
                    'tzatziki': 0.22,
                    'black olives': 0.12,
                    'basil': 0.22,
                    'chili flakes': 0.08,
                    'hot sauce': 0.22,
                    'cooked tomatoes': 0.18
                };
                const scale = scaleMap[value] || 0.14;

                const pizzaRadiusPct = 34; // fit within inner mask
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
        pizzaTypeSelect.addEventListener('change', updateCrustOptions);
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
            });
        }
        selectedToppingsEl.appendChild(chip);
        rebuildPizzaLayersFromSelectedChips();
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
    }

    if (toppingsSelect && selectedToppingsEl) {
        toppingsSelect.addEventListener('change', (e) => {
            addTopping(e.target.value);
            rebuildPizzaLayersFromSelectedChips();
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
            updateExtrasSubtotal();
        }

        minusBtn.addEventListener('click', () => setQuantity((parseInt(qtyCount.textContent, 10) || 1) - 1));
        plusBtn.addEventListener('click', () => setQuantity((parseInt(qtyCount.textContent, 10) || 1) + 1));

        chip.querySelector('.chip-remove').addEventListener('click', () => {
            const dkey = chip.dataset.key;
            if (item.category === 'milkshake') selectedMilkshakeKeys.delete(dkey);
            if (item.category === 'soft_drink') selectedSoftDrinkKeys.delete(dkey);
            chip.remove();
            updateExtrasSubtotal();
        });

        container.appendChild(chip);
        updateExtrasSubtotal();
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
            updateExtrasSubtotal();
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
            updateExtrasSubtotal();
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

    // Extras subtotal helpers
    function updateExtrasSubtotal() {
        if (!extrasSubtotalEl) return;
        const inputs = Array.from(document.querySelectorAll('input[name="extra_item"]'));
        let total = 0;
        for (const i of inputs) {
            try {
                const obj = JSON.parse(i.value);
                const p = Number(obj.price) || 0;
                const q = Math.max(1, Number(obj.quantity) || 1);
                total += p * q;
            } catch (_) {}
        }
        extrasSubtotalEl.textContent = `${total} NIS`;
    }

    function clearExtras() {
        selectedMilkshakeKeys.clear();
        selectedSoftDrinkKeys.clear();
        if (selectedMilkshakesEl) selectedMilkshakesEl.innerHTML = '';
        if (selectedSoftDrinksEl) selectedSoftDrinksEl.innerHTML = '';
        updateExtrasSubtotal();
    }

    updateExtrasSubtotal();

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
                updateExtrasSubtotal();
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






