<?php
declare(strict_types=1);
/** @var array $product */
$minPrice = (float) $product['base_price'];
?>
<div class="product-card reveal group relative block">
  <button type="button"
    data-compare-toggle="<?= (int) $product['id'] ?>"
    aria-label="Add to compare"
    title="Add to compare"
    class="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-soft/50 hover:bg-white transition">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h2m6-16h2a2 2 0 012 2v12a2 2 0 01-2 2h-2m-3-18v20"/></svg>
  </button>
  <a href="<?= e(url('index.php?page=product&slug=' . urlencode($product['slug']))) ?>" class="block">
    <div class="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white mb-4 shadow-soft/50">
      <?php if (!empty($product['on_sale'])): ?>
        <span class="absolute top-3 left-3 z-10 text-[10px] tracking-[0.14em] uppercase bg-brand-ink text-white px-2.5 py-1 rounded-full">Sale</span>
      <?php endif; ?>
      <?php if (!empty($product['image']) && file_exists(ROOT_PATH . '/' . $product['image'])): ?>
        <img src="<?= e(asset($product['image'])) ?>" alt="<?= e($product['name']) ?>" class="w-full h-full object-cover">
      <?php else: ?>
        <div class="product-placeholder w-full h-full flex items-end p-5 bg-gradient-to-br from-brand-mist via-brand-blush/40 to-[#e8c4a8]">
          <span class="font-display text-xl text-brand-ink/70 leading-tight"><?= e(explode('–', $product['name'])[0]) ?></span>
        </div>
      <?php endif; ?>
    </div>
    <h3 class="font-display text-lg sm:text-xl leading-snug mb-1 group-hover:opacity-70 transition"><?= e($product['name']) ?></h3>
    <div class="text-sm mb-1"><?= stars((float) $product['rating']) ?></div>
    <p class="text-sm font-medium"><?= money($minPrice) ?><?= !empty($product['compare_at_price']) ? ' <span class="text-brand-soft line-through ml-1">' . money((float) $product['compare_at_price']) . '</span>' : '' ?></p>
  </a>
</div>
