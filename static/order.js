// Order form handling and JSON generation (refactored)
document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    const addressSection = document.getElementById('addressSection');
    const orderTypeSelect = document.getElementById('order_type');
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
    
    // New Pizza Builder Elements
    const addPizzaBtn = document.getElementById('addPizzaBtn');
    const currentPizzaForm = document.getElementById('currentPizzaForm');
    const pizzaNumber = document.getElementById('pizzaNumber');
    const currentPizzaTypeSelect = document.getElementById('current_pizza_type');
    const currentPizzaSizeSelect = document.getElementById('current_pizza_size');
    const currentPizzaCrustSelect = document.getElementById('current_pizza_crust');
    const currentToppingsSelect = document.getElementById('currentToppingsSelect');
    const currentSelectedToppingsEl = document.getElementById('currentSelectedToppings');
    const savePizzaBtn = document.getElementById('savePizzaBtn');
    const cancelPizzaBtn = document.getElementById('cancelPizzaBtn');
    const emptyPizzasMessage = document.getElementById('emptyPizzasMessage');
    const pizzasList = document.getElementById('pizzasList');
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
    const pizzasSection = document.getElementById('pizzasSection');
    const pizzaCount = document.getElementById('pizzaCount');
    const pizzasSummaryList = document.getElementById('pizzasSummaryList');
    const extrasSection = document.getElementById('extrasSection');
    const extrasList = document.getElementById('extrasList');
    const deliverySection = document.getElementById('deliverySection');
    const deliveryItem = document.getElementById('deliveryItem');
    const orderSubtotal = document.getElementById('orderSubtotal');
    const orderTotal = document.getElementById('orderTotal');
    const estimatedTime = document.getElementById('estimatedTime');
    
    // Pizza Management State
    const addedPizzas = [];
    let currentPizzaIndex = 0;
    let isEditingPizza = false;
    let editingPizzaIndex = -1;
    const currentToppings = new Set();

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
                "basil": 2, "chili flakes": 1, "hot sauce": 1
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

    // ============ PIZZA BUILDER FUNCTIONS ============
    
    function showPizzaBuilder() {
        if (currentPizzaForm) {
            currentPizzaForm.style.display = 'block';
            updatePizzaNumber();
            clearCurrentPizzaForm();
            updateCurrentCrustOptions();
            updateCurrentSizeOptions();
            sortSelectOptions(currentToppingsSelect);
            updateCurrentPizzaPreview(); // Ensure preview is updated when form is shown
        }
    }
    
    function hidePizzaBuilder() {
        if (currentPizzaForm) {
            currentPizzaForm.style.display = 'none';
            clearCurrentPizzaForm();
            isEditingPizza = false;
            editingPizzaIndex = -1;
        }
    }
    
    function updatePizzaNumber() {
        if (pizzaNumber) {
            const number = isEditingPizza ? editingPizzaIndex + 1 : addedPizzas.length + 1;
            pizzaNumber.textContent = `Pizza #${number}`;
        }
    }
    
    function clearCurrentPizzaForm() {
        if (currentPizzaTypeSelect) currentPizzaTypeSelect.value = '';
        if (currentPizzaSizeSelect) currentPizzaSizeSelect.value = '';
        if (currentPizzaCrustSelect) currentPizzaCrustSelect.value = '';
        if (currentToppingsSelect) currentToppingsSelect.value = '';
        clearCurrentToppings();
    }
    
    function clearCurrentToppings() {
        currentToppings.clear();
        if (currentSelectedToppingsEl) {
            currentSelectedToppingsEl.innerHTML = '';
        }
        updateCurrentPizzaPreview(); // Update preview when toppings are cleared
    }
    
    function addCurrentTopping(value) {
        if (!value || currentToppings.has(value)) return;
        currentToppings.add(value);
        
        const opt = Array.from(currentToppingsSelect.options).find(o => o.value === value);
        const labelText = opt ? opt.textContent : value;
        
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.dataset.value = value;
        chip.innerHTML = `
            <span class="chip-label">${labelText}</span>
            <button type="button" class="chip-remove" aria-label="Remove ${labelText}">×</button>
        `;
        
        chip.querySelector('.chip-remove').addEventListener('click', () => {
            currentToppings.delete(value);
            chip.remove();
            updateCurrentPizzaPreview(); // Update preview when topping is removed
        });
        
        if (currentSelectedToppingsEl) {
            currentSelectedToppingsEl.appendChild(chip);
        }
        
        if (currentToppingsSelect) {
            currentToppingsSelect.value = '';
        }
        
        updateCurrentPizzaPreview(); // Update preview when topping is added
    }
    
    function getCurrentPizzaData() {
        const type = currentPizzaTypeSelect ? currentPizzaTypeSelect.value : '';
        const size = currentPizzaSizeSelect ? currentPizzaSizeSelect.value : '';
        const crust = currentPizzaCrustSelect ? currentPizzaCrustSelect.value : '';
        const toppings = Array.from(currentToppings).sort();
        
        if (!type || !size || !crust) {
            return null;
        }
        
        return { type, size, crust, toppings };
    }
    
    function savePizza() {
        const pizzaData = getCurrentPizzaData();
        if (!pizzaData) {
            alert('Please fill in all pizza details (type, size, and crust).');
            return;
        }
        
        if (isEditingPizza && editingPizzaIndex >= 0) {
            // Update existing pizza
            addedPizzas[editingPizzaIndex] = pizzaData;
        } else {
            // Add new pizza
            addedPizzas.push(pizzaData);
        }
        
        hidePizzaBuilder();
        updatePizzasList();
        updateOrderSummary();
    }
    
    function removePizza(index) {
        if (index >= 0 && index < addedPizzas.length) {
            addedPizzas.splice(index, 1);
            updatePizzasList();
            updateOrderSummary();
        }
    }
    
    function editPizza(index) {
        if (index >= 0 && index < addedPizzas.length) {
            const pizza = addedPizzas[index];
            isEditingPizza = true;
            editingPizzaIndex = index;
            
            // Populate form with pizza data
            if (currentPizzaTypeSelect) currentPizzaTypeSelect.value = pizza.type;
            if (currentPizzaSizeSelect) currentPizzaSizeSelect.value = pizza.size;
            if (currentPizzaCrustSelect) currentPizzaCrustSelect.value = pizza.crust;
            
            // Update options based on selected type
            updateCurrentCrustOptions();
            updateCurrentSizeOptions();
            
            // Set crust and size again after options update
            if (currentPizzaCrustSelect) currentPizzaCrustSelect.value = pizza.crust;
            if (currentPizzaSizeSelect) currentPizzaSizeSelect.value = pizza.size;
            
            // Add toppings
            clearCurrentToppings();
            pizza.toppings.forEach(topping => {
                addCurrentTopping(topping);
            });
            
            showPizzaBuilder();
            updateCurrentPizzaPreview(); // Ensure preview shows the edited pizza
        }
    }
    
    function updatePizzasList() {
        if (!pizzasList || !emptyPizzasMessage) return;
        
        if (addedPizzas.length === 0) {
            emptyPizzasMessage.style.display = 'block';
            pizzasList.innerHTML = '';
            return;
        }
        
        emptyPizzasMessage.style.display = 'none';
        pizzasList.innerHTML = '';
        
        addedPizzas.forEach((pizza, index) => {
            const card = createPizzaCard(pizza, index);
            pizzasList.appendChild(card);
        });
    }
    
    function createPizzaCard(pizza, index) {
        const card = document.createElement('div');
        card.className = 'pizza-card';
        card.innerHTML = `
            <div class="pizza-card-header">
                <div class="pizza-card-title">
                    <i class="fas fa-pizza-slice"></i>
                    ${pizza.type === 'custom' ? 'Custom Pizza' : pizza.type}
                    <span class="pizza-card-number">Pizza #${index + 1}</span>
                </div>
                <div class="pizza-card-actions">
                    <button type="button" class="pizza-card-edit" data-index="${index}">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button type="button" class="pizza-card-remove" data-index="${index}">
                        <i class="fas fa-trash"></i>
                        Remove
                    </button>
                </div>
            </div>
            <div class="pizza-card-details">
                <div class="pizza-detail-item">
                    <div class="pizza-detail-label">Type</div>
                    <div class="pizza-detail-value">${pizza.type === 'custom' ? 'Custom' : pizza.type}</div>
                </div>
                <div class="pizza-detail-item">
                    <div class="pizza-detail-label">Size</div>
                    <div class="pizza-detail-value">${pizza.size}</div>
                </div>
                <div class="pizza-detail-item">
                    <div class="pizza-detail-label">Crust</div>
                    <div class="pizza-detail-value">${pizza.crust}</div>
                </div>
            </div>
            ${pizza.toppings.length > 0 ? `
                <div class="pizza-toppings">
                    <div class="pizza-toppings-label">
                        <i class="fas fa-plus"></i>
                        Toppings (${pizza.toppings.length})
                    </div>
                    <div class="pizza-toppings-grid">
                        ${pizza.toppings.map(topping => `
                            <span class="pizza-topping-chip">${topping}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        // Add event listeners
        const editBtn = card.querySelector('.pizza-card-edit');
        const removeBtn = card.querySelector('.pizza-card-remove');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => editPizza(index));
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to remove this pizza?')) {
                    removePizza(index);
                }
            });
        }
        
        return card;
    }
    
    // Current Pizza Crust and Size Options
    function updateCurrentCrustOptions() {
        const type = currentPizzaTypeSelect ? currentPizzaTypeSelect.value : '';
        
        function setCurrentCrustOptions(list) {
            const label = '<option value="">Select crust...</option>';
            const opts = list.map(v => `<option value="${v}">${v.charAt(0).toUpperCase() + v.slice(1)}</option>`).join('');
            const current = currentPizzaCrustSelect.value;
            currentPizzaCrustSelect.innerHTML = label + opts;
            currentPizzaCrustSelect.value = list.includes(current) ? current : list[0] || '';
            currentPizzaCrustSelect.disabled = false;
        }
        
        if (type === 'Neapolitan') {
            setCurrentCrustOptions(['neapolitan']);
        } else if (type === 'custom') {
            setCurrentCrustOptions(['thin', 'thick']);
        } else if (type) {
            // Non-custom predefined pizzas use thin crust
            setCurrentCrustOptions(['thin']);
        } else {
            setCurrentCrustOptions(['thin', 'thick']);
        }
    }
    
    function updateCurrentSizeOptions() {
        const type = currentPizzaTypeSelect ? currentPizzaTypeSelect.value : '';
        
        function setCurrentSizeOptions(list) {
            const labelFor = (v) => {
                if (v === 'small') return 'Small';
                if (v === 'large') return 'Large';
                if (v === 'XL' || v === 'XXL') return v;
                return v.charAt(0).toUpperCase() + v.slice(1);
            };
            const label = '<option value="">Select size...</option>';
            const opts = list.map(v => `<option value="${v}">${labelFor(v)}</option>`).join('');
            const current = currentPizzaSizeSelect.value;
            currentPizzaSizeSelect.innerHTML = label + opts;
            currentPizzaSizeSelect.value = list.includes(current) ? current : list[0] || '';
        }
        
        if (type && type !== 'custom') {
            setCurrentSizeOptions(['small', 'large']);
        } else {
            setCurrentSizeOptions(['small', 'large', 'XL', 'XXL']);
        }
    }
    
    function updateCurrentPizzaTypeLocks() {
        const type = currentPizzaTypeSelect ? currentPizzaTypeSelect.value : '';
        updateCurrentCrustOptions();
        
        if (!currentToppingsSelect) return;
        
        // Auto-lock toppings for predefined types
        const PRESET_TOPPINGS = {
            "Anti-Vegan Pizza": ["pepperoni", "salami", "chicken bits"],
            "Mediterrenean": ["tzatziki", "olives", "tomato", "red onions"],
            "Neapolitan": ["basil"],
            "Mexican Bravery": ["jalapenos", "pepperoni", "chili flakes", "hot sauce"],
            "Moshe's Favorite": ["red onions", "broccoli", "pepperoni", "extra cheese", "black olives", "corn"]
        };
        
        if (type && type !== 'custom' && PRESET_TOPPINGS[type]) {
            clearCurrentToppings();
            const sortedList = [...PRESET_TOPPINGS[type]].sort((a, b) => a.localeCompare(b));
            sortedList.forEach(v => {
                addCurrentTopping(v);
            });
            currentToppingsSelect.disabled = true;
        } else {
            // custom or empty selection
            if (!isEditingPizza) {
                clearCurrentToppings();
            }
            currentToppingsSelect.disabled = false;
        }
        updateCurrentPizzaPreview(); // Update preview when pizza type changes
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

    function updateCurrentPizzaPreview() {
        if (!pizzaLayersEl) {
            console.warn('Pizza layers element not found');
            return;
        }
        pizzaLayersEl.innerHTML = '';
        if (!currentSelectedToppingsEl) {
            return;
        }
        const chips = currentSelectedToppingsEl.querySelectorAll('.chip');
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
                'hot sauce': 5
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
                    'hot sauce': 0.18
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

    // ============ PIZZA BUILDER EVENT LISTENERS ============
    
    // Add Pizza Button
    if (addPizzaBtn) {
        addPizzaBtn.addEventListener('click', showPizzaBuilder);
    }
    
    // Save Pizza Button
    if (savePizzaBtn) {
        savePizzaBtn.addEventListener('click', savePizza);
    }
    
    // Cancel Pizza Button
    if (cancelPizzaBtn) {
        cancelPizzaBtn.addEventListener('click', hidePizzaBuilder);
    }
    
    // Current Pizza Type Changes
    if (currentPizzaTypeSelect) {
        currentPizzaTypeSelect.addEventListener('change', function() {
            updateCurrentPizzaTypeLocks();
            updateCurrentSizeOptions();
        });
    }
    
    // Current Pizza Size Changes
    if (currentPizzaSizeSelect) {
        currentPizzaSizeSelect.addEventListener('change', function() {
            // Size change doesn't need special handling for now
        });
    }
    
    // Current Pizza Crust Changes
    if (currentPizzaCrustSelect) {
        currentPizzaCrustSelect.addEventListener('change', function() {
            // Crust change doesn't need special handling for now
        });
    }
    
    // Current Toppings Selection
    if (currentToppingsSelect) {
        currentToppingsSelect.addEventListener('change', function(e) {
            addCurrentTopping(e.target.value);
        });
        sortSelectOptions(currentToppingsSelect);
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
        
        // Calculate pizzas total
        const { pizzasTotal, hasPizzas } = calculatePizzasTotal();
        
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
        const subtotal = pizzasTotal + extrasTotal;
        const total = subtotal + deliveryFee;
        
        // Show/hide sections based on content
        const hasItems = hasPizzas || hasExtras;
        updateEmptyState(hasItems);
        updatePizzasSection(hasPizzas);
        updateExtrasSection(hasExtras);
        updateDeliverySection(isDelivery);
        updateTotals(subtotal, total);
        updateStatusIndicator(hasItems);
    }
    
    function calculatePizzasTotal() {
        if (addedPizzas.length === 0) {
            return { pizzasTotal: 0, hasPizzas: false };
        }
        
        let totalCost = 0;
        const pizzasData = [];
        
        for (const pizza of addedPizzas) {
            // Calculate toppings cost for this pizza
            let toppingsTotal = 0;
            const toppingsList = [];
            
            for (const topping of pizza.toppings) {
                const toppingPrice = PRICES.items.toppings[topping] || 0;
                toppingsTotal += toppingPrice;
                toppingsList.push({
                    name: topping,
                    price: toppingPrice
                });
            }
            
            // Pizza base cost (currently 0)
            const basePrice = PRICES.pizza_base;
            const pizzaTotal = basePrice + toppingsTotal;
            totalCost += pizzaTotal;
            
            pizzasData.push({
                pizza,
                basePrice,
                toppingsTotal,
                toppingsList,
                pizzaTotal
            });
        }
        
        return {
            pizzasTotal: totalCost,
            hasPizzas: true,
            pizzasData
        };
    }
    
    function updateEmptyState(hasItems) {
        if (!emptyOrder) return;
        emptyOrder.style.display = hasItems ? 'none' : 'block';
    }
    
    function updatePizzasSection(hasPizzas) {
        if (!pizzasSection || !pizzasSummaryList || !pizzaCount) return;
        
        pizzasSection.style.display = hasPizzas ? 'block' : 'none';
        
        if (hasPizzas) {
            const { pizzasData } = calculatePizzasTotal();
            
            // Update pizza count
            pizzaCount.textContent = `(${addedPizzas.length})`;
            
            // Clear and populate pizzas list
            pizzasSummaryList.innerHTML = '';
            
            pizzasData.forEach((pizzaData, index) => {
                const pizza = pizzaData.pizza;
                const pizzaItem = document.createElement('div');
                pizzaItem.className = 'pizza-summary-item';
                
                pizzaItem.innerHTML = `
                    <div class="pizza-summary-header">
                        <div class="pizza-summary-name">${pizza.type === 'custom' ? 'Custom Pizza' : pizza.type}</div>
                        <div class="pizza-summary-number">Pizza #${index + 1}</div>
                    </div>
                    <div class="pizza-summary-specs">
                        <span class="pizza-summary-spec">${pizza.size}</span>
                        <span class="pizza-summary-spec">${pizza.crust} crust</span>
                    </div>
                    ${pizza.toppings.length > 0 ? `
                        <div class="pizza-summary-toppings">
                            <strong>Toppings:</strong> ${pizza.toppings.join(', ')}
                        </div>
                    ` : ''}
                    <div class="item-price">
                        <span class="price-amount">${pizzaData.pizzaTotal}</span>
                        <span class="price-currency">NIS</span>
                    </div>
                `;
                
                pizzasSummaryList.appendChild(pizzaItem);
            });
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

    // Initialize the order summary and pizza list
    updateOrderSummary();
    updatePizzasList();

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
        // Check if at least one pizza is added
        if (addedPizzas.length === 0) {
            alert('Please add at least one pizza to your order before proceeding.');
            return;
        }
        
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

        // Build items object with separate pizza entries
        const itemsObj = {};
        
        // Add each pizza as a separate item
        addedPizzas.forEach((pizza, index) => {
            const pizzaTypeForJson = mapPizzaTypeToClassName(pizza.type, pizza.size);
            const pizzaKey = addedPizzas.length === 1 ? 'pizza' : `pizza_${index + 1}`;
            itemsObj[pizzaKey] = {
                type: pizzaTypeForJson,
                size: pizza.size,
                crust: pizza.crust,
                topping: [...pizza.toppings].sort()
            };
        });
        
        // Add extras
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
        
        // Track counts for unique keys
        const categoryCounters = {};
        
        for (const [, v] of extrasAggPrev) {
            const payload = extraItemPayload(v);
            const category = v.category;
            
            // Initialize counter for this category if not exists
            if (!categoryCounters[category]) {
                categoryCounters[category] = 0;
            }
            
            // Create unique key for each extra item
            categoryCounters[category]++;
            const extraKey = categoryCounters[category] === 1 ? category : `${category}_${categoryCounters[category]}`;
            
            itemsObj[extraKey] = payload;
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
                items: itemsObj,
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

            // Build items object with separate pizza entries
            const itemsObj = {};
            
            // Add each pizza as a separate item
            addedPizzas.forEach((pizza, index) => {
                const pizzaTypeForJson = mapPizzaTypeToClassName(pizza.type, pizza.size);
                const pizzaKey = addedPizzas.length === 1 ? 'pizza' : `pizza_${index + 1}`;
                itemsObj[pizzaKey] = {
                    type: pizzaTypeForJson,
                    size: pizza.size,
                    crust: pizza.crust,
                    topping: [...pizza.toppings].sort()
                };
            });
            
            // Add extras
            const extraInputsSave = Array.from(document.querySelectorAll('input[name="extra_item"]'));
            const extrasParsedSave = extraInputsSave.map(i => { try { return JSON.parse(i.value); } catch(e){ return null; } }).filter(Boolean);
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
            
            // Track counts for unique keys
            const categoryCountersSave = {};
            
            for (const [, v] of extrasAggSave) {
                const payload = extraItemPayload(v);
                const category = v.category;
                
                // Initialize counter for this category if not exists
                if (!categoryCountersSave[category]) {
                    categoryCountersSave[category] = 0;
                }
                
                // Create unique key for each extra item
                categoryCountersSave[category]++;
                const extraKey = categoryCountersSave[category] === 1 ? category : `${category}_${categoryCountersSave[category]}`;
                
                itemsObj[extraKey] = payload;
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
                addedPizzas.length = 0; // Clear pizzas array
                clearExtras();
                orderPreview.style.display = 'none';
                orderForm.style.display = 'block';
                addressSection.style.display = 'none';
                updateOrderTypeUI(orderTypeSelect.value || '');
                updatePizzasList();
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











