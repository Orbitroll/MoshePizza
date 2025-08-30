// Order form handling and JSON generation
document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    const addressSection = document.getElementById('addressSection');
    const orderTypeSelect = document.getElementById('order_type');
    const orderPreview = document.getElementById('orderPreview');
    const jsonOutput = document.getElementById('jsonOutput');
    const editOrderBtn = document.getElementById('editOrder');
    const confirmOrderBtn = document.getElementById('confirmOrder');

const PLACE_ORDER_URL = window.PLACE_ORDER_URL;

    // Show/hide address section based on order type
    orderTypeSelect.addEventListener('change', function() {
        if (this.value === 'delivery') {
            addressSection.style.display = 'block';
            // Make address fields required
            const addressFields = addressSection.querySelectorAll('input');
            addressFields.forEach(field => field.required = true);
        } else {
            addressSection.style.display = 'none';
            // Remove required from address fields
            const addressFields = addressSection.querySelectorAll('input');
            addressFields.forEach(field => field.required = false);
        }
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

        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            orderData[key] = value;
        }

        // Build the JSON structure matching the example
        const orderJson = {
            order: {
                customer_name: orderData.customer_name,
                order_type: orderData.order_type,
                phone_number: orderData.phone_number,
                table: orderData.table,
                address: orderData.order_type === 'delivery' ? {
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

        // Display the preview
        jsonOutput.textContent = JSON.stringify(orderJson, null, 4);
        orderForm.style.display = 'none';
        orderPreview.style.display = 'block';
    }



    // Save order to JSON file
    async function saveOrder() {
        try {
            const formData = new FormData(orderForm);
            const orderData = {};

            // Convert FormData to object
            for (let [key, value] of formData.entries()) {
                orderData[key] = value;
            }

            // Build the final JSON structure
            const orderJson = {
                order: {
                    customer_name: orderData.customer_name,
                    order_type: orderData.order_type,
                    phone_number: orderData.phone_number,
                    table: orderData.table,
                    address: orderData.order_type === 'delivery' ? {
                        city: orderData.city,
                        street: orderData.street,
                        "building number": parseInt(orderData.building_number) || 0,
                        entrance: orderData.entrance,
                        floor: orderData.floor,
                        apartment: parseInt(orderData.apartment) || 0
                    } : null,
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

            // Send to server to save
            const response = await fetch(PLACE_ORDER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderJson)
            });

            if (response.ok) {
                showSuccessMessage();
                // Reset form
                orderForm.reset();
                orderPreview.style.display = 'none';
                orderForm.style.display = 'block';
                addressSection.style.display = 'none';
            } else {
                throw new Error('Failed to save order');
            }
        } catch (error) {
            console.error('Error saving order:', error);
            showErrorMessage();
        }
    }

    // Show success message
    function showSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h3>Order Saved Successfully!</h3>
            <p>Your order has been saved to order.json</p>
        `;
        
        document.querySelector('.order-section .container').appendChild(successDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    // Show error message
    function showErrorMessage() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Saving Order</h3>
            <p>There was a problem saving your order. Please try again.</p>
        `;
        
        document.querySelector('.order-section .container').appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
});
