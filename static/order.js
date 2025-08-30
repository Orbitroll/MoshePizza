// Order form handling and JSON generation (refactored)
document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    const addressSection = document.getElementById('addressSection');
    const orderTypeSelect = document.getElementById('order_type');
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
            orderData[key] = value;
        }

        const isDelivery = orderData.order_type === 'delivery';
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
                        type: orderData.pizza_type,
                        size: orderData.pizza_size,
                        crust: orderData.pizza_crust,
                        topping: orderData.pizza_topping
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
                orderData[key] = value;
            }
            const isDelivery = orderData.order_type === 'delivery';
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
                            type: orderData.pizza_type,
                            size: orderData.pizza_size,
                            crust: orderData.pizza_crust,
                            topping: orderData.pizza_topping
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
                orderPreview.style.display = 'none';
                orderForm.style.display = 'block';
                addressSection.style.display = 'none';
                updateOrderTypeUI(orderTypeSelect.value || '');
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
