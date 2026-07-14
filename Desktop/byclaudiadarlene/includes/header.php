<?php
declare(strict_types=1);
/** @var array $config */
$pageTitle = $pageTitle ?? $config['app_name'];
$pageDescription = $pageDescription ?? 'Luxury hair for every curl story.';
$user = current_user();
$cartCount = cart_count();
$currencies = currency_rates();
$activeCurrency = current_currency();
$promo = setting('promo_banner', 'Worldwide Shipping Available | Klarna & Clearpay | Checkout in your currency');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= e($pageTitle) ?></title>
  <meta name="description" content="<?= e($pageDescription) ?>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              blush: '#F3C4C4',
              blushDeep: '#E8A8A8',
              cream: '#FBF7F2',
              mist: '#F7EDE8',
              ink: '#1C1917',
              soft: '#8A7A76'
            }
          },
          fontFamily: {
            display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
            sans: ['Outfit', 'system-ui', 'sans-serif']
          },
          boxShadow: {
            soft: '0 18px 50px rgba(28, 25, 23, 0.08)'
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="<?= e(asset('assets/css/app.css')) ?>">
</head>
<body class="bg-brand-cream text-brand-ink font-sans antialiased">
  <div class="promo-bar text-center text-[11px] sm:text-xs tracking-[0.14em] uppercase py-2.5 px-4 bg-black text-white">
    <?= e($promo) ?>
  </div>

  <header class="sticky top-0 z-50 bg-brand-blush/95 backdrop-blur border-b border-brand-ink/5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 sm:h-20 gap-4">
        <nav class="hidden md:flex items-center gap-7 text-[13px] tracking-[0.16em] uppercase">
          <a class="<?= active_nav('home') ?>" href="<?= e(url('index.php?page=home')) ?>">Home</a>
          <a class="<?= active_nav('shop') ?>" href="<?= e(url('index.php?page=shop')) ?>">Shop</a>
          <a class="<?= active_nav('about') ?>" href="<?= e(url('index.php?page=about')) ?>">About</a>
          <a class="<?= active_nav('blog') ?>" href="<?= e(url('index.php?page=blog')) ?>">Blog</a>
          <a class="<?= active_nav('faq') ?>" href="<?= e(url('index.php?page=faq')) ?>">FAQ</a>
        </nav>

        <button id="mobile-menu-btn" class="md:hidden p-2" aria-label="Open menu">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>

        <a href="<?= e(url('index.php?page=home')) ?>" class="absolute left-1/2 -translate-x-1/2 text-center brand-mark">
          <span class="block text-[10px] tracking-[0.35em] uppercase text-brand-ink/50 mb-0.5">Hair by</span>
          <span class="font-display text-2xl sm:text-3xl tracking-[0.04em] leading-none">Claudia Darlene</span>
        </a>

        <div class="flex items-center gap-2 sm:gap-3 ml-auto">
          <form method="get" action="<?= e(url('index.php')) ?>" class="hidden sm:block">
            <input type="hidden" name="page" value="shop">
            <label class="sr-only" for="currency">Currency</label>
            <select id="currency" name="currency" onchange="window.location='<?= e(url('api/currency.php')) ?>?code='+this.value" class="bg-transparent text-xs tracking-wide border border-brand-ink/15 rounded-full px-3 py-1.5">
              <?php foreach ($currencies as $code => $c): ?>
                <option value="<?= e($code) ?>" <?= $code === $activeCurrency ? 'selected' : '' ?>><?= e($code) ?></option>
              <?php endforeach; ?>
            </select>
          </form>

          <a href="<?= e(url('index.php?page=' . ($user ? 'account' : 'login'))) ?>" class="p-2 hover:opacity-70" aria-label="Account">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </a>
          <a href="<?= e(url('index.php?page=cart')) ?>" class="relative p-2 hover:opacity-70" aria-label="Cart">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1.4 9.2A2 2 0 0115.62 20H8.38a2 2 0 01-1.98-1.8L5 9z"/></svg>
            <span id="cart-count" class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-brand-ink text-white text-[10px] flex items-center justify-center px-1"><?= (int) $cartCount ?></span>
          </a>
        </div>
      </div>
    </div>
    <div id="mobile-menu" class="hidden md:hidden border-t border-brand-ink/10 bg-brand-blush">
      <div class="px-4 py-4 flex flex-col gap-3 text-sm tracking-[0.14em] uppercase">
        <a href="<?= e(url('index.php?page=home')) ?>">Home</a>
        <a href="<?= e(url('index.php?page=shop')) ?>">Shop</a>
        <a href="<?= e(url('index.php?page=about')) ?>">About</a>
        <a href="<?= e(url('index.php?page=blog')) ?>">Blog</a>
        <a href="<?= e(url('index.php?page=faq')) ?>">FAQ</a>
        <a href="<?= e(url('index.php?page=contact')) ?>">Contact</a>
        <div class="pt-2">
          <select onchange="window.location='<?= e(url('api/currency.php')) ?>?code='+this.value" class="w-full bg-white/50 border border-brand-ink/10 rounded-full px-4 py-2 text-xs">
            <?php foreach ($currencies as $code => $c): ?>
              <option value="<?= e($code) ?>" <?= $code === $activeCurrency ? 'selected' : '' ?>><?= e($c['name'] . ' (' . $code . ')') ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>
    </div>
  </header>

  <?php if ($msg = flash('success')): ?>
    <div class="max-w-7xl mx-auto px-4 mt-4"><div class="rounded-2xl bg-emerald-50 text-emerald-800 px-4 py-3 text-sm"><?= e($msg) ?></div></div>
  <?php endif; ?>
  <?php if ($msg = flash('error')): ?>
    <div class="max-w-7xl mx-auto px-4 mt-4"><div class="rounded-2xl bg-rose-50 text-rose-800 px-4 py-3 text-sm"><?= e($msg) ?></div></div>
  <?php endif; ?>

  <main>
