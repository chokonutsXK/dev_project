class ECommerceApp {

            
            

            setupNightMode() {
  const toggle = document.getElementById('nightModeToggle');
  toggle.checked = this.nightMode;
  this.applyNightMode();
  
  toggle.addEventListener('change', () => {
    this.nightMode = toggle.checked;
    this.saveNightModePreference();
    this.applyNightMode();
  });
}

applyNightMode() {
  if (this.nightMode) {
    document.body.classList.add('night-mode');
  } else {
    document.body.classList.remove('night-mode');
  }
}

saveNightModePreference() {
  localStorage.setItem('nightMode', JSON.stringify(this.nightMode));
}

loadNightModePreference() {
  const saved = localStorage.getItem('nightMode');
  return saved ? JSON.parse(saved) : false;
}



            constructor() {
                this.products = [];
                this.categories = [];
                this.currentPage = 1;
                this.productsPerPage = 12;
                this.currentCategory = 'all';
                this.searchQuery = '';
                this.nightMode = this.loadNightModePreference();
                this.currentDetailProduct = null;
                this.detailQuantity = 1;
                this.currentUser = this.loadUser();
                this.registeredUsers = this.loadRegisteredUsers();
                this.cart = this.loadCart();
                this.wishlist = this.loadWishlist();
                this.init();
            }

            async init() {
                this.updateAuthUI();
                this.updateWishlistUI();
                await this.loadProducts();
                await this.loadCategories();
                this.setupEventListeners();
                this.updateCartUI();
                this.setupNightMode();
            }

            async loadProducts() {
                try {
                    const response = await fetch('https://dummyjson.com/products?limit=100');
                    const data = await response.json();
                    this.products = data.products;
                    this.displayProducts();
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('productsContainer').style.display = 'flex';
                } catch (error) {
                    console.error('Erreur lors du chargement des produits:', error);
                    document.getElementById('loading').innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des produits</div>';
                }
            }

            async loadCategories() {
                try {
                    const response = await fetch('https://dummyjson.com/products/categories');
                    this.categories = await response.json();
                    this.displayCategoryButtons();
                } catch (error) {
                    console.error('Erreur lors du chargement des catégories:', error);
                }
            }

            displayCategoryButtons() {
                const container = document.getElementById('categoryButtons');
                if (!container) return;
                
                this.categories.forEach(category => {
                    const hasProducts = this.products.some(product => product.category === category.slug);

                    if (hasProducts) {
                        const button = document.createElement('button');
                        button.className = 'btn btn-category';
                        button.setAttribute('data-category', category.slug);
                        button.textContent = category.name;
                        container.appendChild(button);
                    }
                });
            }

            getFilteredProducts() {
                let filtered = this.products;

                if (this.currentCategory !== 'all') {
                    filtered = filtered.filter(product => product.category === this.currentCategory);
                }

                if (this.searchQuery) {
                    filtered = filtered.filter(product =>
                        product.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                        product.description.toLowerCase().includes(this.searchQuery.toLowerCase())
                    );
                }

                return filtered;
            }

            displayProducts() {
                const filtered = this.getFilteredProducts();
                const startIndex = (this.currentPage - 1) * this.productsPerPage;
                const endIndex = startIndex + this.productsPerPage;
                const paginatedProducts = filtered.slice(startIndex, endIndex);

                const container = document.getElementById('productsContainer');
                container.innerHTML = '';

                if (paginatedProducts.length === 0) {
                    container.innerHTML = '<div class="col-12"><div class="alert alert-info text-center">Aucun produit trouvé</div></div>';
                    return;
                }

                paginatedProducts.forEach(product => {
                    const discountPrice = product.price * (1 - product.discountPercentage / 100);
                    const isInWishlist = this.wishlist.some(item => item.id === product.id);

                    const productCard = `
    <div class="col-lg-3 col-md-4 col-sm-6">
        <div class="card product-card h-100 position-relative">
            <button class="btn-wishlist ${isInWishlist ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleWishlist(${product.id})">
                <i class="fas fa-heart"></i>
            </button>
            <div onclick="app.showProductDetails(${product.id})">
                ${product.discountPercentage > 0 ? `<div class="discount-badge">-${Math.round(product.discountPercentage)}%</div>` : ''}
                <img src="${product.thumbnail}" class="card-img-top product-image" alt="${product.title}">
                <div class="card-body d-flex flex-column night-mode-compatible">
                    <h6 class="card-title text-dark-emphasis night-mode-text">${product.title}</h6>
                    <p class="card-text text-muted small flex-grow-1 night-mode-text">${product.description.substring(0, 50)}...</p>
                    <div class="mb-2">
                        <span class="price">${discountPrice.toFixed(2)} €</span>
                        ${product.discountPercentage > 0 ? `<span class="original-price ms-2">${product.price.toFixed(2)} €</span>` : ''}
                    </div>
                    <div class="d-flex align-items-center mb-2">
                        <div class="text-warning me-2">
                            ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
                        </div>
                        <small class="text-muted night-mode-text">(${product.rating})</small>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); app.addToCart(${product.id})">
                        <i class="fas fa-cart-plus me-1"></i>Ajouter au panier
                    </button>
                </div>
            </div>
        </div>
    </div>`;
                    container.innerHTML += productCard;
                });

                this.displayPagination(filtered.length);
            }

            displayPagination(totalProducts) {
                const totalPages = Math.ceil(totalProducts / this.productsPerPage);
                const pagination = document.getElementById('pagination');
                pagination.innerHTML = '';

                if (totalPages <= 1) return;

                // Previous button
                const prevLi = document.createElement('li');
                prevLi.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
                prevLi.innerHTML = `<a class="page-link" href="#" onclick="app.changePage(${this.currentPage - 1})">Précédent</a>`;
                pagination.appendChild(prevLi);

                // Page numbers
                const startPage = Math.max(1, this.currentPage - 2);
                const endPage = Math.min(totalPages, this.currentPage + 2);

                for (let i = startPage; i <= endPage; i++) {
                    const li = document.createElement('li');
                    li.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
                    li.innerHTML = `<a class="page-link" href="#" onclick="app.changePage(${i})">${i}</a>`;
                    pagination.appendChild(li);
                }

                // Next button
                const nextLi = document.createElement('li');
                nextLi.className = `page-item ${this.currentPage === totalPages ? 'disabled' : ''}`;
                nextLi.innerHTML = `<a class="page-link" href="#" onclick="app.changePage(${this.currentPage + 1})">Suivant</a>`;
                pagination.appendChild(nextLi);
            }

            changePage(page) {
                const filtered = this.getFilteredProducts();
                const totalPages = Math.ceil(filtered.length / this.productsPerPage);
                
                if (page >= 1 && page <= totalPages) {
                    this.currentPage = page;
                    this.displayProducts();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }

            setupEventListeners() {
                const homeLink = document.getElementById('homeLink');
                if (homeLink) {
                    homeLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.resetFilters();
                    });
                }

                // Category filters
                document.addEventListener('click', (e) => {
                    if (e.target.classList.contains('btn-category')) {
                        const category = e.target.getAttribute('data-category');
                        
                        if (category === 'all') {
                            this.resetFilters();
                        } else {
                            document.querySelectorAll('.btn-category').forEach(btn => {
                                btn.classList.remove('active');
                            });
                            e.target.classList.add('active');
                            
                            this.currentCategory = category;
                            this.currentPage = 1;
                            this.displayProducts();
                        }
                    }
                });

                // Search
                const searchInput = document.getElementById('searchInput');
                const searchBtn = document.getElementById('searchBtn');
                const suggestionsContainer = document.getElementById('search-suggestions');

                searchInput.addEventListener('input', () => this.displaySearchSuggestions());
                
                document.addEventListener('click', (e) => {
                    const searchContainer = document.querySelector('.search-form-container');
                    if (searchContainer && !searchContainer.contains(e.target)) {
                        if (suggestionsContainer) {
                            suggestionsContainer.style.display = 'none';
                        }
                    }
                });
                
                if (suggestionsContainer) {
                    suggestionsContainer.addEventListener('click', (e) => {
                        const item = e.target.closest('.suggestion-item');
                        if (item) {
                            const productId = parseInt(item.dataset.productId, 10);
                            this.showProductDetails(productId);
                            suggestionsContainer.style.display = 'none';
                            searchInput.value = '';
                        }
                    });
                }

                const performSearch = () => {
                    this.searchQuery = searchInput.value;
                    this.currentPage = 1;
                    this.displayProducts();
                    if (suggestionsContainer) {
                        suggestionsContainer.style.display = 'none';
                    }
                };

                searchBtn.addEventListener('click', performSearch);
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') performSearch();
                });

                // Auth buttons
                const loginBtn = document.getElementById('loginBtn');
                if (loginBtn) {
                    loginBtn.addEventListener('click', () => {
                        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
                        modal.show();
                    });
                }

                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        this.logout();
                    });
                }

                const loginForm = document.getElementById('loginForm');
                if (loginForm) {
                    loginForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const username = document.getElementById('username').value;
                        const password = document.getElementById('password').value;
                        this.login(username, password);
                    });
                }

                const registerForm = document.getElementById('registerForm');
                if (registerForm) {
                    registerForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.register({
                            firstName: document.getElementById('regFirstName').value,
                            lastName: document.getElementById('regLastName').value,
                            username: document.getElementById('regUsername').value,
                            email: document.getElementById('regEmail').value,
                            password: document.getElementById('regPassword').value,
                        });
                    });
                }

                const showRegisterForm = document.getElementById('showRegisterForm');
                if (showRegisterForm) {
                    showRegisterForm.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.toggleAuthForms(false);
                    });
                }
                
                const showLoginForm = document.getElementById('showLoginForm');
                if (showLoginForm) {
                    showLoginForm.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.toggleAuthForms(true);
                    });
                }

                const deleteAccountBtn = document.getElementById('deleteAccountBtn');
                if (deleteAccountBtn) {
                    deleteAccountBtn.addEventListener('click', () => {
                        const modal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
                        modal.show();
                    });
                }
                
                const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
                if (confirmDeleteBtn) {
                    confirmDeleteBtn.addEventListener('click', () => {
                        this.deleteAccount();
                    });
                }

                // Cart buttons
                document.getElementById('clearCartBtn').addEventListener('click', () => {
                    this.clearCart();
                });

                document.getElementById('checkoutBtn').addEventListener('click', () => {
                    if (this.cart.length === 0) {
                        alert('Votre panier est vide');
                        return;
                    }
                    alert('Commande validée ! Merci pour votre achat.');
                    this.clearCart();
                });
            }

            addToCart(productId) {
                const product = this.products.find(p => p.id === productId);
                if (!product) return;

                const existingItem = this.cart.find(item => item.id === productId);
                
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    this.cart.push({
                        id: product.id,
                        title: product.title,
                        price: product.price * (1 - product.discountPercentage / 100),
                        originalPrice: product.price,
                        thumbnail: product.thumbnail,
                        quantity: 1
                    });
                }

                this.saveCart();
                this.updateCartUI();
                this.showToast('Produit ajouté au panier !');
            }

            removeFromCart(productId) {
                this.cart = this.cart.filter(item => item.id !== productId);
                this.saveCart();
                this.updateCartUI();
            }

            updateQuantity(productId, quantity) {
                const item = this.cart.find(item => item.id === productId);
                if (item) {
                    if (quantity <= 0) {
                        this.removeFromCart(productId);
                    } else {
                        item.quantity = quantity;
                        this.saveCart();
                        this.updateCartUI();
                    }
                }
            }

            clearCart() {
                this.cart = [];
                this.saveCart();
                this.updateCartUI();
            }

            updateCartUI() {
                const cartCount = document.getElementById('cartCount');
                const cartItems = document.getElementById('cartItems');
                const cartTotal = document.getElementById('cartTotal');

                const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
                const totalPrice = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                cartCount.textContent = totalItems;
                cartTotal.textContent = totalPrice.toFixed(2) + ' €';

                if (this.cart.length === 0) {
                    cartItems.innerHTML = '<div class="text-center text-muted">Votre panier est vide</div>';
                    return;
                }

                cartItems.innerHTML = this.cart.map(item => `
                    <div class="card mb-2">
                        <div class="card-body p-2">
                            <div class="d-flex align-items-center">
                                <img src="${item.thumbnail}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: cover; cursor:pointer;" class="me-2" onclick="app.showProductDetails(${item.id})" data-bs-dismiss="offcanvas">
                                <div class="flex-grow-1" style="cursor:pointer;" onclick="app.showProductDetails(${item.id})" data-bs-dismiss="offcanvas">
                                    <h6 class="mb-1" style="font-size: 0.9rem;">${item.title}</h6>
                                    <div class="fw-bold">${(item.price * item.quantity).toFixed(2)} €</div>
                                </div>
                                <div class="text-end">
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-sm btn-outline-secondary" onclick="event.stopPropagation(); app.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                                        <span class="mx-2">${item.quantity}</span>
                                        <button class="btn btn-sm btn-outline-secondary" onclick="event.stopPropagation(); app.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="event.stopPropagation(); app.removeFromCart(${item.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            saveCart() {
                localStorage.setItem(`cart_${this.currentUser.username}`, JSON.stringify(this.cart));
            }

            loadCart() {
                if (!this.currentUser) return [];
                return JSON.parse(localStorage.getItem(`cart_${this.currentUser.username}`)) || [];
            }

            showToast(message) {
                const toastContainer = document.getElementById('toast-container');
                if (!toastContainer) return;

                // Clear existing toasts to only show one at a time
                toastContainer.innerHTML = '';

                const toastId = 'toast-' + Date.now();
                const toastHTML = `
                    <div id="${toastId}" class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
                        <div class="d-flex">
                            <div class="toast-body">
                                ${message}
                            </div>
                            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                        </div>
                    </div>
                `;
                
                toastContainer.insertAdjacentHTML('beforeend', toastHTML);
                
                const toastElement = document.getElementById(toastId);
                const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
                toast.show();

                toastElement.addEventListener('hidden.bs.toast', () => {
                    // It's already cleared on show, but good practice to remove
                    if (document.body.contains(toastElement)) {
                        toastElement.remove();
                    }
                });
            }

            async showProductDetails(productId) {
                try {
                    const product = this.products.find(p => p.id === productId);
                    if (!product) return;
            
                    this.currentDetailProduct = product;
                    this.detailQuantity = 1;
            
                    const discountPrice = product.price * (1 - product.discountPercentage / 100);
            
                    document.getElementById('detailProductImage').src = product.images[0] || product.thumbnail;
                    document.getElementById('detailProductTitle').textContent = product.title;
                    document.getElementById('detailDescription').textContent = product.description;
                    document.getElementById('detailPrice').textContent = `${discountPrice.toFixed(2)} €`;
                    document.getElementById('detailRating').innerHTML = `${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}`;
                    document.getElementById('detailReviews').textContent = `(${product.rating} avis)`;
                    document.getElementById('detailQuantity').textContent = this.detailQuantity;
            
                    const originalPriceElem = document.getElementById('detailOriginalPrice');
                    const discountElem = document.getElementById('detailDiscount');
            
                    if (product.discountPercentage > 0) {
                        originalPriceElem.textContent = `${product.price.toFixed(2)} €`;
                        discountElem.textContent = `-${Math.round(product.discountPercentage)}%`;
                        originalPriceElem.style.display = 'inline';
                        discountElem.style.display = 'inline-block';
                    } else {
                        originalPriceElem.style.display = 'none';
                        discountElem.style.display = 'none';
                    }
            
                    // Thumbnails
                    for(let i=0; i<3; i++) {
                        const thumb = document.getElementById(`detailThumb${i+1}`);
                        if(product.images[i]) {
                            thumb.src = product.images[i];
                            thumb.style.display = 'inline-block';
                            thumb.onclick = () => { document.getElementById('detailProductImage').src = product.images[i]; };
                        } else {
                            thumb.style.display = 'none';
                        }
                    }
            
                    // Specs
                    const specsList = document.getElementById('detailSpecs');
                    specsList.innerHTML = `
                        <li><strong>Marque:</strong> ${product.brand}</li>
                        <li><strong>Catégorie:</strong> ${product.category}</li>
                        <li><strong>En stock:</strong> ${product.stock}</li>
                    `;
            
                    const modal = new bootstrap.Modal(document.getElementById('productDetailsModal'));
                    modal.show();
                } catch (error) {
                    console.error('Erreur lors de la récupération des détails du produit:', error);
                }
            }
        
            increaseQuantity() {
                this.detailQuantity++;
                document.getElementById('detailQuantity').textContent = this.detailQuantity;
            }
        
            decreaseQuantity() {
                if (this.detailQuantity > 1) {
                    this.detailQuantity--;
                    document.getElementById('detailQuantity').textContent = this.detailQuantity;
                }
            }
        
            addDetailToCart() {
                if (!this.currentDetailProduct) return;
        
                const product = this.currentDetailProduct;
                const existingItem = this.cart.find(item => item.id === product.id);
        
                if (existingItem) {
                    existingItem.quantity += this.detailQuantity;
                } else {
                    this.cart.push({
                        id: product.id,
                        title: product.title,
                        price: product.price * (1 - product.discountPercentage / 100),
                        originalPrice: product.price,
                        thumbnail: product.thumbnail,
                        quantity: this.detailQuantity
                    });
                }
        
                this.saveCart();
                this.updateCartUI();
                this.showToast(`${this.detailQuantity} × ${product.title} ajouté(s) au panier!`);
                
                const modalElement = document.getElementById('productDetailsModal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                modal.hide();
            }

            async login(username, password) {
                const errorDiv = document.getElementById('login-error');
                errorDiv.style.display = 'none';

                // First, check local registered users
                const localUser = this.registeredUsers.find(u => u.username === username);
                if (localUser) {
                    if (localUser.password === password) {
                        // Log in successful from local storage
                        this.currentUser = localUser;
                        this.saveUser();
                        this.updateAuthUI();
                        
                        const modalElement = document.getElementById('loginModal');
                        const modal = bootstrap.Modal.getInstance(modalElement);
                        if (modal) modal.hide();

                        // Load wishlist for the newly logged-in user
                        this.wishlist = this.loadWishlist();
                        this.updateWishlistUI();
                        this.displayProducts(); // Re-render products to show correct wishlist status

                        this.cart = this.loadCart();
                        this.updateCartUI();
                        this.showToast('Connexion réussie !');

                        return true;
                    } else {
                        // Wrong password for local user
                        errorDiv.textContent = `Erreur: Mot de passe incorrect.`;
                        errorDiv.style.display = 'block';
                        return false;
                    }
                }

                // If not a local user, try the API
                try {
                    const response = await fetch('https://dummyjson.com/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: username,
                            password: password,
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Failed to login');
                    }

                    this.currentUser = data;
                    this.saveUser();
                    this.updateAuthUI();

                    // Load wishlist for the newly logged-in user
                    this.wishlist = this.loadWishlist();
                    this.updateWishlistUI();
                    this.displayProducts(); // Re-render products to show correct wishlist status

                    const modalElement = document.getElementById('loginModal');
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    modal.hide();

                    this.showToast(`Bienvenue, ${this.currentUser.firstName}! Votre compte a été créé.`);

                    this.cart = this.loadCart();
                    this.updateCartUI();

                    return true;
                } catch (error) {
                    errorDiv.textContent = `Erreur: ${error.message}`;
                    errorDiv.style.display = 'block';
                    return false;
                }
            }
        
            logout() {
                this.currentUser = null;
                this.cart = [];
                this.wishlist = [];
                localStorage.removeItem('currentUser');
                this.updateAuthUI();
                this.updateCartUI();
                this.updateWishlistUI();
                this.displayProducts();
            }
        
            saveUser() {
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }
        
            loadUser() {
                const user = localStorage.getItem('currentUser');
                return user ? JSON.parse(user) : null;
            }
        
            loadRegisteredUsers() {
                const users = localStorage.getItem('registeredUsers');
                return users ? JSON.parse(users) : [];
            }
        
            saveRegisteredUsers() {
                localStorage.setItem('registeredUsers', JSON.stringify(this.registeredUsers));
            }

            updateAuthUI() {
                const usernameDisplay = document.getElementById('username-display');
                const loginBtn = document.getElementById('loginBtn');
                const logoutBtn = document.getElementById('logoutBtn');
                const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        
                if (this.currentUser) {
                    // Check if the current user is a locally registered one
                    const isLocalUser = this.registeredUsers.some(u => u.username === this.currentUser.username);
        
                    usernameDisplay.textContent = `Bienvenue, ${this.currentUser.firstName}`;
                    usernameDisplay.style.display = 'inline';
                    loginBtn.style.display = 'none';
                    logoutBtn.style.display = 'inline-block';
                    deleteAccountBtn.style.display = isLocalUser ? 'inline-block' : 'none';
                } else {
                    usernameDisplay.style.display = 'none';
                    loginBtn.style.display = 'inline-block';
                    logoutBtn.style.display = 'none';
                    deleteAccountBtn.style.display = 'none';
                }
            }

            toggleAuthForms(showLogin) {
                const loginForm = document.getElementById('loginForm');
                const registerForm = document.getElementById('registerForm');
                const modalTitle = document.getElementById('authModalTitle');
                const loginError = document.getElementById('login-error');
                const registerError = document.getElementById('register-error');
        
                if (showLogin) {
                    loginForm.style.display = 'block';
                    registerForm.style.display = 'none';
                    modalTitle.textContent = 'Connexion';
                } else {
                    loginForm.style.display = 'none';
                    registerForm.style.display = 'block';
                    modalTitle.textContent = 'Inscription';
                }
                loginError.style.display = 'none';
                registerError.style.display = 'none';
            }

            async register(userData) {
                const errorDiv = document.getElementById('register-error');
                errorDiv.style.display = 'none';
        
                try {
                    const response = await fetch('https://dummyjson.com/users/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData)
                    });
        
                    const data = await response.json();
        
                    if (!response.ok) {
                        throw new Error(data.message || 'Failed to register');
                    }
        
                    // The API returns the new user object but without the password.
                    // We'll add it back before saving.
                    const newUser = { ...data, password: userData.password };

                    this.registeredUsers.push(newUser);
                    this.saveRegisteredUsers();

                    this.currentUser = newUser;
                    this.saveUser();
                    this.updateAuthUI();
        
                    const modalElement = document.getElementById('loginModal');
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    modal.hide();
        
                    this.showToast(`Bienvenue, ${this.currentUser.firstName}! Votre compte a été créé.`);
        
                } catch (error) {
                    errorDiv.textContent = `Erreur: ${error.message}`;
                    errorDiv.style.display = 'block';
                }
            }

            deleteAccount() {
                if (!this.currentUser) return;
        
                // Filter out the current user from the list of registered users
                this.registeredUsers = this.registeredUsers.filter(user => user.username !== this.currentUser.username);
                this.saveRegisteredUsers();
        
                this.logout(); // This will clear currentUser and update UI
        
                const modalElement = document.getElementById('deleteAccountModal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
        
                // Also remove their wishlist from localStorage
                if (this.currentUser && this.currentUser.username) {
                    localStorage.removeItem(`wishlist_${this.currentUser.username}`);
                }
        
                this.showToast('Votre compte a été supprimé avec succès.');
            }

            loadWishlist() {
                if (!this.currentUser) return [];
                const wishlist = localStorage.getItem(`wishlist_${this.currentUser.username}`);
                return wishlist ? JSON.parse(wishlist) : [];
            }
        
            saveWishlist() {
                if (!this.currentUser) return;
                localStorage.setItem(`wishlist_${this.currentUser.username}`, JSON.stringify(this.wishlist));
            }
        
            toggleWishlist(productId) {
                if (!this.currentUser) {
                    this.showToast('Veuillez vous connecter pour gérer votre liste de souhaits.');
                    // Optionally, open the login modal
                    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
                    modal.show();
                    return;
                }
        
                const productIndex = this.wishlist.findIndex(item => item.id === productId);
                
                if (productIndex > -1) {
                    // Remove from wishlist
                    this.wishlist.splice(productIndex, 1);
                    this.showToast('Produit retiré de la liste de souhaits!');
                } else {
                    // Add to wishlist
                    const product = this.products.find(p => p.id === productId);
                    if (product) {
                        this.wishlist.push(product);
                        this.showToast('Produit ajouté à la liste de souhaits!');
                    }
                }
        
                this.saveWishlist();
                this.updateWishlistUI();
                this.displayProducts(); // Re-render to update the heart icons
            }
        
            updateWishlistUI() {
                const wishlistCount = document.getElementById('wishlistCount');
                const wishlistItems = document.getElementById('wishlistItems');
        
                if (!wishlistCount || !wishlistItems) return;
        
                wishlistCount.textContent = this.wishlist.length;
        
                if (this.wishlist.length === 0) {
                    wishlistItems.innerHTML = '<div class="text-center text-muted">Votre liste de souhaits est vide</div>';
                    return;
                }
        
                wishlistItems.innerHTML = this.wishlist.map(item => `
                    <div class="card mb-2">
                        <div class="card-body p-2">
                            <div class="d-flex align-items-center">
                                <img src="${item.thumbnail}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: cover; cursor:pointer;" class="me-2" onclick="app.showProductDetails(${item.id})" data-bs-dismiss="offcanvas">
                                <div class="flex-grow-1" style="cursor:pointer;" onclick="app.showProductDetails(${item.id})" data-bs-dismiss="offcanvas">
                                    <h6 class="mb-1" style="font-size: 0.9rem;">${item.title}</h6>
                                    <div class="price">${(item.price * (1 - item.discountPercentage / 100)).toFixed(2)} €</div>
                                </div>
                                <div class="text-end">
                                    <button class="btn btn-sm btn-primary me-2" title="Ajouter au panier" onclick="event.stopPropagation(); app.addToCart(${item.id});">
                                        <i class="fas fa-cart-plus"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" title="Retirer" onclick="event.stopPropagation(); app.toggleWishlist(${item.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            displaySearchSuggestions() {
                const searchInput = document.getElementById('searchInput');
                const suggestionsContainer = document.getElementById('search-suggestions');
                const query = searchInput.value.toLowerCase().trim();

                if (query.length < 2) {
                    suggestionsContainer.style.display = 'none';
                    suggestionsContainer.innerHTML = '';
                    return;
                }

                const filtered = this.products.filter(product =>
                    product.title.toLowerCase().includes(query)
                ).slice(0, 7);

                if (filtered.length === 0) {
                    suggestionsContainer.style.display = 'none';
                    suggestionsContainer.innerHTML = '';
                    return;
                }

                suggestionsContainer.innerHTML = filtered.map(product => `
                    <li class="suggestion-item" data-product-id="${product.id}">
                        <img src="${product.thumbnail}" alt="${product.title}">
                        <div class="suggestion-item-info">
                            <div class="suggestion-item-title">${product.title}</div>
                            <div class="suggestion-item-category">${product.category}</div>
                        </div>
                    </li>
                `).join('');

                suggestionsContainer.style.display = 'block';
            }

            resetFilters() {
                this.currentCategory = 'all';
                this.searchQuery = '';
                this.currentPage = 1;
        
                // Visually reset category buttons
                document.querySelectorAll('.btn-category').forEach(btn => {
                    if (btn.dataset.category === 'all') {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
        
                this.displayProducts();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        // Initialize the app
        const app = new ECommerceApp(); 