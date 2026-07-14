<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/bootstrap.php';
db();
require_admin();

if (request_method() === 'POST' && verify_csrf(post('csrf_token'))) {
    $action = post('action');
    if ($action === 'toggle' && post('id')) {
        db()->prepare('UPDATE products SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?')
            ->execute([(int) post('id')]);
    }
    if ($action === 'delete' && post('id')) {
        db()->prepare('DELETE FROM products WHERE id = ?')->execute([(int) post('id')]);
    }
    header('Location: products.php');
    exit;
}

$q = trim((string) get('q', ''));
$sql = 'SELECT p.*, c.name AS category_name, '
     . '(SELECT COALESCE(SUM(stock),0) FROM product_variants v WHERE v.product_id = p.id) AS stock_total '
     . 'FROM products p LEFT JOIN categories c ON c.id = p.category_id';
$params = [];
if ($q !== '') {
    $sql .= ' WHERE p.name LIKE ? OR c.name LIKE ?';
    $params[] = '%' . $q . '%';
    $params[] = '%' . $q . '%';
}
$sql .= ' ORDER BY p.id DESC';
$stmt = db()->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

require __DIR__ . '/_layout_top.php';
?>

<div class="flex items-center justify-between mb-8 gap-4 flex-wrap">
  <h1 class="font-display text-4xl">Products</h1>
  <a href="product-edit.php" class="flex items-center gap-2 rounded-full bg-stone-900 text-white px-5 py-2.5 text-sm">
    <?= admin_icon('plus') ?> Add product
  </a>
</div>

<form method="get" class="mb-6 max-w-md relative">
  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"><?= admin_icon('search') ?></span>
  <input name="q" value="<?= e($q) ?>" placeholder="Search products…"
    class="w-full rounded-full border border-stone-200 bg-white pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3C4C4]">
</form>

<div class="bg-white rounded-2xl border border-stone-200 overflow-x-auto">
  <table class="w-full text-sm min-w-[760px]">
    <thead class="bg-stone-50 text-left text-stone-500">
      <tr>
        <th class="px-4 py-3">Name</th>
        <th class="px-4 py-3">Category</th>
        <th class="px-4 py-3">Price (GBP)</th>
        <th class="px-4 py-3">Stock</th>
        <th class="px-4 py-3">Status</th>
        <th class="px-4 py-3"></th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($products as $p): ?>
        <?php $stock = (int) $p['stock_total']; ?>
        <tr class="border-t border-stone-100">
          <td class="px-4 py-3"><?= e($p['name']) ?></td>
          <td class="px-4 py-3"><?= e($p['category_name'] ?? '—') ?></td>
          <td class="px-4 py-3">&pound;<?= number_format((float) $p['base_price'], 2) ?></td>
          <td class="px-4 py-3">
            <span class="<?= $stock <= 5 ? 'text-rose-600 font-semibold' : 'text-stone-700' ?>"><?= $stock ?></span>
            <?php if ($stock <= 5): ?><?= admin_icon('alert-triangle', 'w-3.5 h-3.5 inline text-rose-500') ?><?php endif; ?>
          </td>
          <td class="px-4 py-3">
            <?php if ($p['is_active']): ?>
              <span class="inline-block rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>
            <?php else: ?>
              <span class="inline-block rounded-full px-2.5 py-1 text-xs font-medium bg-stone-200 text-stone-600">Hidden</span>
            <?php endif; ?>
          </td>
          <td class="px-4 py-3 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-3">
              <a class="text-stone-500 hover:text-stone-900" title="Edit" href="product-edit.php?id=<?= (int) $p['id'] ?>"><?= admin_icon('pencil') ?></a>
              <form method="post" class="inline"><?= csrf_field() ?><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int) $p['id'] ?>"><button class="text-stone-500 hover:text-stone-900" title="Toggle active"><?= admin_icon('eye') ?></button></form>
              <form method="post" class="inline" onsubmit="return confirm('Delete product?')"><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int) $p['id'] ?>"><button class="text-rose-500 hover:text-rose-700" title="Delete"><?= admin_icon('trash-2') ?></button></form>
            </div>
          </td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$products): ?>
        <tr><td colspan="6" class="px-4 py-8 text-center text-stone-400"><?= $q !== '' ? 'No products match your search' : 'No products yet' ?></td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<?php require __DIR__ . '/_layout_bottom.php'; ?>
