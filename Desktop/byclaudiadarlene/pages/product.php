<?php
declare(strict_types=1);

$slug = trim((string) get('slug', ''));
$stmt = db()->prepare('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.slug = ? AND p.is_active = 1 LIMIT 1');
$stmt->execute([$slug]);
$product = $stmt->fetch();

if (!$product) {
    flash('error', 'Product not found.');
    redirect('index.php?page=shop');
}

$vStmt = db()->prepare('SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY price ASC');
$vStmt->execute([$product['id']]);
$variants = $vStmt->fetchAll();
$defaultVariant = $variants[0] ?? null;

$gallery = [];
if (!empty($product['gallery'])) {
    $decoded = json_decode((string) $product['gallery'], true);
    if (is_array($decoded)) {
        $gallery = $decoded;
    }
}
$mainImage = null;
if (!empty($product['image']) && file_exists(ROOT_PATH . '/' . $product['image'])) {
    $mainImage = $product['image'];
} elseif ($gallery && file_exists(ROOT_PATH . '/' . $gallery[0])) {
    $mainImage = $gallery[0];
}
$thumbs = [];
foreach (array_merge($mainImage ? [$mainImage] : [], $gallery) as $img) {
    if (file_exists(ROOT_PATH . '/' . $img) && !in_array($img, $thumbs, true)) {
        $thumbs[] = $img;
    }
}

$pageTitle = $product['name'] . ' – Hair by Claudia Darlene';
$pageDescription = $product['short_description'] ?? $product['name'];

require ROOT_PATH . '/includes/header.php';
?>

<section class="py-12 sm:py-16">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 lg:gap-16">
    <div class="reveal">
      <?php if ($mainImage): ?>
        <div class="aspect-[4/5] rounded-[28px] overflow-hidden bg-white shadow-soft">
          <img id="product-main-image" src="<?= e(asset($mainImage)) ?>" alt="<?= e($product['name']) ?>" class="w-full h-full object-cover">
        </div>
        <?php if (count($thumbs) > 1): ?>
          <div class="mt-4 grid grid-cols-5 gap-3">
            <?php foreach ($thumbs as $i => $img): ?>
              <button type="button" data-thumb="<?= e(asset($img)) ?>"
                class="aspect-square rounded-2xl overflow-hidden border <?= $i === 0 ? 'border-brand-ink' : 'border-brand-ink/10' ?> hover:border-brand-ink transition">
                <img src="<?= e(asset($img)) ?>" alt="<?= e($product['name']) ?> view <?= $i + 1 ?>" class="w-full h-full object-cover">
              </button>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      <?php else: ?>
        <div class="aspect-[4/5] rounded-[28px] overflow-hidden bg-gradient-to-br from-brand-mist via-brand-blush/50 to-[#e8c4a8] shadow-soft flex items-end p-8">
          <h2 class="font-display text-4xl text-brand-ink/80 leading-tight max-w-sm"><?= e($product['name']) ?></h2>
        </div>
      <?php endif; ?>
    </div>

    <div class="reveal lg:pt-4">
      <?php if (!empty($product['category_name'])): ?>
        <p class="text-xs tracking-[0.22em] uppercase text-brand-soft mb-3"><?= e($product['category_name']) ?></p>
      <?php endif; ?>
      <h1 class="font-display text-4xl sm:text-5xl mb-3"><?= e($product['name']) ?></h1>
      <div class="flex items-center gap-3 mb-5">
        <div><?= stars((float) $product['rating']) ?></div>
        <span class="text-sm text-brand-soft">(<?= (int) $product['review_count'] ?> reviews)</span>
      </div>
      <p id="display-price" class="text-2xl font-medium mb-6" data-base="<?= e((string) ($defaultVariant['price'] ?? $product['base_price'])) ?>">
        <?= money((float) ($defaultVariant['price'] ?? $product['base_price'])) ?>
      </p>
      <p class="text-brand-soft leading-relaxed mb-8"><?= e($product['description'] ?? $product['short_description']) ?></p>

      <?php if ($variants): ?>
        <form data-add-to-cart method="post" class="space-y-6">
          <input type="hidden" name="action" value="add">
          <input type="hidden" name="product_id" value="<?= (int) $product['id'] ?>">
          <div>
            <label class="block text-xs tracking-[0.18em] uppercase text-brand-soft mb-3">Length</label>
            <div class="flex flex-wrap gap-2">
              <?php foreach ($variants as $i => $v): ?>
                <label class="cursor-pointer">
                  <input type="radio" name="variant_id" value="<?= (int) $v['id'] ?>" data-price="<?= e((string) $v['price']) ?>" class="peer sr-only" <?= $i === 0 ? 'checked' : '' ?> required>
                  <span class="inline-block px-4 py-2 rounded-full border border-brand-ink/15 text-sm peer-checked:bg-brand-ink peer-checked:text-white peer-checked:border-brand-ink transition"><?= e($v['label']) ?></span>
                </label>
              <?php endforeach; ?>
            </div>
          </div>
          <div>
            <label for="qty" class="block text-xs tracking-[0.18em] uppercase text-brand-soft mb-3">Quantity</label>
            <input id="qty" type="number" name="quantity" min="1" value="1" class="w-24 rounded-full border border-brand-ink/15 bg-white px-4 py-2.5 text-sm">
          </div>
          <button type="submit" class="btn-ink px-10 py-3.5 text-sm tracking-[0.12em] uppercase w-full sm:w-auto">Add to Cart</button>
        </form>
      <?php endif; ?>

      <div class="mt-10 pt-8 border-t border-brand-ink/10 grid sm:grid-cols-3 gap-4 text-sm text-brand-soft">
        <p>Worldwide shipping</p>
        <p>Klarna & Clearpay</p>
        <p>Secure checkout</p>
      </div>
    </div>
  </div>
</section>

<script>
(() => {
  const priceEl = document.getElementById('display-price');
  const radios = document.querySelectorAll('input[name="variant_id"]');
  const symbolMap = <?= json_encode(array_column(currency_rates(), 'symbol', 'code')) ?>;
  const rateMap = <?= json_encode(array_map('floatval', array_column(currency_rates(), 'rate_from_gbp', 'code'))) ?>;
  const currency = <?= json_encode(current_currency()) ?>;
  const format = (gbp) => {
    const amount = (gbp * (rateMap[currency] || 1)).toFixed(2);
    return (symbolMap[currency] || currency + ' ') + Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  radios.forEach((r) => r.addEventListener('change', () => {
    if (priceEl) priceEl.textContent = format(parseFloat(r.dataset.price));
  }));

  const mainImage = document.getElementById('product-main-image');
  document.querySelectorAll('[data-thumb]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (mainImage) mainImage.src = btn.dataset.thumb;
      document.querySelectorAll('[data-thumb]').forEach((b) => {
        b.classList.toggle('border-brand-ink', b === btn);
        b.classList.toggle('border-brand-ink/10', b !== btn);
      });
    });
  });
})();
</script>

<?php require ROOT_PATH . '/includes/footer.php'; ?>
