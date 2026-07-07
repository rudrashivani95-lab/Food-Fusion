const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.getElementById('siteNav');
const themeToggle = document.getElementById('themeToggle');
const scrollTopButton = document.getElementById('scrollTop');
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');
const ordersList = document.getElementById('ordersList');
const ordersStatus = document.getElementById('ordersStatus');
const checkoutForm = document.getElementById('checkoutForm');
const customerNameInput = document.getElementById('customerName');
const customerAddressInput = document.getElementById('customerAddress');
const summaryItem = document.getElementById('summaryItem');
const summaryTotal = document.getElementById('summaryTotal');
const successPill = document.getElementById('successPill');
const cartButton = document.getElementById('cartButton');
const cartBadge = document.getElementById('cartBadge');
const confirmationCard = document.getElementById('confirmationCard');
const confirmationText = document.getElementById('confirmationText');

menuToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.site-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.body.setAttribute('data-theme', savedTheme);
  themeToggle.checked = savedTheme === 'dark';
}

themeToggle.addEventListener('change', () => {
  const nextTheme = themeToggle.checked ? 'dark' : 'light';
  document.body.setAttribute('data-theme', nextTheme);
  localStorage.setItem('theme', nextTheme);
});

window.addEventListener('scroll', () => {
  scrollTopButton.classList.toggle('show', window.scrollY > 500);
});

scrollTopButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

cartButton.addEventListener('click', () => {
  document.getElementById('orders').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function updateCartBadge(count) {
  cartBadge.textContent = String(count);
  cartBadge.classList.toggle('has-items', count > 0);
}

async function loadOrders() {
  try {
    const response = await fetch('/api/orders');
    if (!response.ok) throw new Error('Failed');
    const orders = await response.json();
    renderOrders(orders);
  } catch (error) {
    ordersStatus.textContent = 'Unable to load orders right now.';
  }
}

function renderOrders(orders) {
  ordersList.innerHTML = '';
  if (!orders.length) {
    ordersStatus.textContent = 'No orders yet. Click an Order button to place one.';
    return;
  }

  ordersStatus.textContent = 'Live updates • Recent orders';
  orders.forEach((order) => {
    const item = document.createElement('li');
    item.className = 'order-item';
    item.innerHTML = `
      <div class="order-meta">
        <strong>${order.itemName}</strong>
        <span>${order.price} • ${order.customerName}</span>
        <small>${order.createdAt}</small>
      </div>
      <button class="cancel-order-btn" type="button" data-id="${order.id}">Cancel</button>
    `;
    ordersList.appendChild(item);
  });
}

let selectedItem = null;
let cartCount = 0;
let liveRefreshTimer = null;
updateCartBadge(cartCount);

function startLiveUpdates() {
  if (liveRefreshTimer) {
    clearInterval(liveRefreshTimer);
  }
  liveRefreshTimer = window.setInterval(() => {
    loadOrders();
  }, 3000);
}

ordersList.addEventListener('click', async (event) => {
  const cancelButton = event.target.closest('.cancel-order-btn');
  if (!cancelButton) return;

  const orderId = cancelButton.dataset.id;
  const orderItem = cancelButton.closest('.order-item');
  cancelButton.disabled = true;
  cancelButton.textContent = 'Removing…';

  try {
    const response = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Cancel failed');
    if (orderItem) {
      orderItem.remove();
    }
    ordersStatus.textContent = 'Order cancelled successfully.';
    await loadOrders();
  } catch (error) {
    ordersStatus.textContent = 'Could not cancel the order.';
    cancelButton.disabled = false;
    cancelButton.textContent = 'Cancel';
  }
});

document.querySelectorAll('.menu-card button').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.menu-card');
    selectedItem = {
      itemName: card.querySelector('h3').textContent,
      price: card.querySelector('.menu-meta span').textContent,
    };
    const priceValue = Number.parseFloat(selectedItem.price.replace(/[^0-9.]/g, '')) || 0;
    summaryItem.textContent = `${selectedItem.itemName} — ${selectedItem.price}`;
    summaryTotal.textContent = `$${(priceValue + 2.5).toFixed(2)}`;
    ordersStatus.textContent = `Selected: ${selectedItem.itemName} for ${selectedItem.price}`;
    cartCount = 1;
    updateCartBadge(cartCount);
  });
});

checkoutForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!selectedItem) {
    ordersStatus.textContent = 'Please select a dish before placing the order.';
    return;
  }

  const customerName = customerNameInput.value.trim();
  const customerAddress = customerAddressInput.value.trim();

  if (!customerName || !customerAddress) {
    ordersStatus.textContent = 'Please enter your name and delivery address.';
    return;
  }

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemName: selectedItem.itemName,
        price: selectedItem.price,
        customerName,
        customerAddress,
      }),
    });

    if (!response.ok) throw new Error('Order failed');
    ordersStatus.textContent = 'Order placed successfully!';
    successPill.classList.add('show');
    confirmationText.textContent = `${selectedItem.itemName} is on the way.`;
    confirmationCard.classList.add('show');
    checkoutForm.reset();
    summaryItem.textContent = 'No item selected yet';
    summaryTotal.textContent = '$0.00';
    selectedItem = null;
    cartCount = 0;
    updateCartBadge(cartCount);
    await loadOrders();
    setTimeout(() => {
      successPill.classList.remove('show');
      confirmationCard.classList.remove('show');
    }, 2200);
  } catch (error) {
    ordersStatus.textContent = 'Could not place the order. Please try again.';
  }
});

loadOrders();
startLiveUpdates();

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const message = document.getElementById('message').value.trim();

  if (!name || !email || !phone || !message) {
    formMessage.textContent = 'Please fill in every field before sending.';
    formMessage.className = 'form-message error';
    return;
  }

  const emailPattern = /^\S+@\S+\.\S+$/;
  if (!emailPattern.test(email)) {
    formMessage.textContent = 'Please enter a valid email address.';
    formMessage.className = 'form-message error';
    return;
  }

  if (phone.length < 10) {
    formMessage.textContent = 'Please enter a phone number with at least 10 digits.';
    formMessage.className = 'form-message error';
    return;
  }

  formMessage.textContent = `Thanks, ${name}! Your message has been received.`;
  formMessage.className = 'form-message success';
  contactForm.reset();
});
