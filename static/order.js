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
    const orderPreview = document.getElementById('orderPreview');
    const jsonOutput = document.getElementById('jsonOutput');
    const editOrderBtn = document.getElementById('editOrder');
    const confirmOrderBtn = document.getElementById('confirmOrder');

    const PLACE_ORDER_URL = window.PLACE_ORDER_URL;

    // Swap Table/Notes and toggle address block based on order type
    const tableGroup = document.getElementById('tableGroup');
    const notesGroup = document.getElementById('notesGroup');
    const tableInput = document.getElementById('table');
    const notesTextarea = document.getElementById('notes');

    function updateOrderTypeUI(value) {
        const isDelivery = value === 'delivery';
        // Address visibility + required flags
        addressSection.style.display = isDelivery ? 'block' : 'none';
        const addressFields = addressSection.querySelectorAll('input');
        addressFields.forEach(field => field.required = isDelivery);

        // Swap table field with notes field
        tableGroup.style.display = isDelivery ? 'none' : 'block';
        notesGroup.style.display = isDelivery ? 'block' : 'none';
        // Disable whichever is hidden so FormData ignores it
        tableInput.disabled = isDelivery;
        notesTextarea.disabled = !isDelivery;
    }

    // Initialize and listen for changes
    updateOrderTypeUI(orderTypeSelect.value);
    orderTypeSelect.addEventListener('change', function() {
        updateOrderTypeUI(this.value);
    });

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
            });
        }
        selectedToppingsEl.appendChild(chip);
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
    }

    if (toppingsSelect && selectedToppingsEl) {
        toppingsSelect.addEventListener('change', (e) => addTopping(e.target.value));
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
        const toppingsArrayPrev = Array.isArray(orderData.pizza_topping)
            ? [...orderData.pizza_topping]
            : (orderData.pizza_topping ? [orderData.pizza_topping] : []);
        toppingsArrayPrev.sort((a, b) => a.localeCompare(b));

        const pizzaTypeForJsonPrev = mapPizzaTypeToClassName(orderData.pizza_type, orderData.pizza_size);
        const orderJson = {
            order: {
                customer_name: orderData.customer_name,
                order_type: orderData.order_type,
                phone_number: orderData.phone_number,
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
                    }
                }
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
            const toppingsArraySave = Array.isArray(orderData.pizza_topping)
                ? [...orderData.pizza_topping]
                : (orderData.pizza_topping ? [orderData.pizza_topping] : []);
            toppingsArraySave.sort((a, b) => a.localeCompare(b));

            const pizzaTypeForJsonSave = mapPizzaTypeToClassName(orderData.pizza_type, orderData.pizza_size);
            const orderJson = {
                order: {
                    customer_name: orderData.customer_name,
                    order_type: orderData.order_type,
                    phone_number: orderData.phone_number,
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
                    items: {
                        pizza: {
                            type: pizzaTypeForJsonSave,
                            size: orderData.pizza_size,
                            crust: orderData.pizza_crust,
                            topping: toppingsArraySave
                        }
                    }
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
                orderPreview.style.display = 'none';
                orderForm.style.display = 'block';
                addressSection.style.display = 'none';
                updateOrderTypeUI(orderTypeSelect.value || '');
                updateCrustOptions();
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
