document.addEventListener('DOMContentLoaded', function() {
    // Product thumbnails functionality
    const mainImage = document.querySelector('.main-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Update main image
            mainImage.src = this.src;
            
            // Update active thumbnail
            thumbnails.forEach(thumb => {
                thumb.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Quantity selector functionality
    const quantityInput = document.getElementById('quantity');
    const minusBtn = document.querySelector('.quantity-btn.minus');
    const plusBtn = document.querySelector('.quantity-btn.plus');
    
    minusBtn.addEventListener('click', function() {
        let currentValue = parseFloat(quantityInput.value);
        if (currentValue > parseFloat(quantityInput.min)) {
            quantityInput.value = (currentValue - parseFloat(quantityInput.step)).toFixed(1);
        }
    });
    
    plusBtn.addEventListener('click', function() {
        let currentValue = parseFloat(quantityInput.value);
        if (currentValue < parseFloat(quantityInput.max)) {
            quantityInput.value = (currentValue + parseFloat(quantityInput.step)).toFixed(1);
        }
    });
    
    // Add to cart functionality
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    const notification = document.getElementById('notification');
    
    addToCartBtn.addEventListener('click', function() {
        // Here you would typically add the product to a cart system
        // For now, we'll just show the notification
        
        // Show notification
        notification.classList.add('show');
        
        // Hide notification after 3 seconds
        setTimeout(function() {
            notification.classList.remove('show');
        }, 3000);
        
        // Mock adding to cart
        const productName = document.querySelector('.product-info h1').textContent;
        const quantity = document.getElementById('quantity').value;
        console.log(`Added to cart: ${quantity}kg of ${productName}`);
        
        // In a real application, you would send this data to a server or store it in localStorage
    });
    
    // Prevent form submission when pressing Enter in quantity input
    quantityInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            return false;
        }
    });
    
    // Validate quantity input
    quantityInput.addEventListener('change', function() {
        let value = parseFloat(this.value);
        let min = parseFloat(this.min);
        let max = parseFloat(this.max);
        
        if (isNaN(value) || value < min) {
            this.value = min;
        } else if (value > max) {
            this.value = max;
        } else {
            this.value = value.toFixed(1);
        }
    });
});