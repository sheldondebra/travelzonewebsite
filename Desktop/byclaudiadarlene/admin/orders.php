<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/bootstrap.php';
db();
require_admin();

if (request_method() === 'POST' && verify_csrf(post('csrf_token'))) {
    if (post('action') === 'ship' && post('id')) {
        db()->prepare("UPDATE orders SET status = 'shipped' WHERE id = ?")->execute([(int) post('id')]);
    }
    $qs = [];
    if (($r = trim((string) post('return_q'))) !== '') { $qs['q'] = $r; }
    if (($rs = trim((string) post('return_status'))) !== '') { $qs['status'] = $rs; }
    header('Location: orders.php' . ($qs ? '?' . http_build_query($qs) : ''));
    exit;
}

$statuses = ['pending','paid','processing','shipped','delivered','cancelled','refunded'];
$q = trim((string) get('q', ''));
$status = (string) get('status', '');
$status = in_array($status, $statuses, true) ? $status : '';

$sql = 'SELECT * FROM orders';
$where = [];
$params = [];
if ($q !== '') {
    $where[] = '(order_number LIKE ? OR email LIKE ?)';
    $params[] = '%' . $q . '%';
    $params[] = '%' . $q . '%';
}
if ($status !== '') {
    $where[] = 'status = ?';
    $params[] = $status;
}
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY id DESC LIMIT 200';
$stmt = db()->prepare($sql);
$stmt->execute($params);
$orders = $stmt->fetchAll();

require __DIR__ . '/_layout_top.php';
?>

<h1 class="font-display text-4xl mb-8">Orders</h1>

<form method="get" class="mb-6 flex flex-wrap gap-3 items-center">
  <div class="relative flex-1 min-w-[220px] max-w-md">
    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"><?= admin_icon('search') ?></span>
    <input name="q" value="<?= e($q) ?>" placeholder="Search order # or email…"
      class="w-full rounded-full border border-stone-200 bg-white pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F3C4C4]">
  </div>
  <select name="status" onchange="this.form.submit()" class="rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm">
    <option value="">All statuses</option>
    <?php foreach ($statuses as $s): ?>
      <option value="<?= $s ?>" <?= $status === $s ? 'selected' : '' ?>><?= ucfirst($s) ?></option>
    <?php endforeach; ?>
  </select>
  <button class="rounded-full bg-stone-900 text-white px-5 py-2.5 text-sm">Filter</button>
</form>

<div class="bg-white rounded-2xl border border-stone-200 overflow-x-auto">
  <table class="w-full text-sm min-w-[820px]">
    <thead class="bg-stone-50 text-left text-stone-500">
      <tr>
        <th class="px-4 py-3">Order</th>
        <th class="px-4 py-3">Email</th>
        <th class="px-4 py-3">Payment</th>
        <th class="px-4 py-3">Status</th>
        <th class="px-4 py-3">Total</th>
        <th class="px-4 py-3"></th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($orders as $o): ?>
        <tr class="border-t border-stone-100">
          <td class="px-4 py-3"><a class="underline" href="order.php?id=<?= (int) $o['id'] ?>"><?= e($o['order_number']) ?></a></td>
          <td class="px-4 py-3"><?= e($o['email']) ?></td>
          <td class="px-4 py-3"><?= e((string) $o['payment_method']) ?></td>
          <td class="px-4 py-3"><?= admin_status_badge((string) $o['status']) ?></td>
          <td class="px-4 py-3"><?= e($o['currency'] . ' ' . number_format((float) $o['total'], 2)) ?></td>
          <td class="px-4 py-3 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-3">
              <a class="flex items-center gap-1 text-stone-500 hover:text-stone-900" href="order.php?id=<?= (int) $o['id'] ?>"><?= admin_icon('eye') ?> View</a>
              <?php if (!in_array($o['status'], ['shipped','delivered','cancelled','refunded'], true)): ?>
                <form method="post" class="inline">
                  <?= csrf_field() ?>
                  <input type="hidden" name="action" value="ship">
                  <input type="hidden" name="id" value="<?= (int) $o['id'] ?>">
                  <input type="hidden" name="return_q" value="<?= e($q) ?>">
                  <input type="hidden" name="return_status" value="<?= e($status) ?>">
                  <button class="flex items-center gap-1 text-indigo-600 hover:text-indigo-800" title="Mark shipped"><?= admin_icon('truck') ?> Ship</button>
                </form>
              <?php endif; ?>
            </div>
          </td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$orders): ?>
        <tr><td colspan="6" class="px-4 py-8 text-center text-stone-400">No orders match your filters</td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<?php require __DIR__ . '/_layout_bottom.php'; ?>
