// tools/fix-category-data.js
// 检查并修复 products / articles 表的 category 字段：
//   - 期望存分类的英文 id（如 yoga-pants）
//   - 若被写成了中文名称/分类名，则根据 categories 表的 (name <-> id) 映射改回 id
// 用法：
//   node tools/fix-category-data.js          # 仅检测，打印问题项
//   node tools/fix-category-data.js --fix    # 检测并自动修复
const { getDb } = require('../db/schema');
const db = getDb();

const DO_FIX = process.argv.includes('--fix');

function isId(v) { return /^[a-z0-9][a-z0-9-]*$/.test(String(v)); }

const cats = db.prepare('SELECT id, name FROM categories').all();
// name -> id（兼容中文名、英文名、历史值）
const nameToId = {};
cats.forEach(c => { nameToId[c.id] = c.id; if (c.name) nameToId[c.name] = c.id; });
const validIds = new Set(cats.map(c => c.id));

function scan(table) {
  const rows = db.prepare(`SELECT id, category FROM ${table}`).all();
  const bad = [];
  rows.forEach(r => {
    if (!validIds.has(r.category)) {
      const mapped = nameToId[r.category];
      bad.push({ id: r.id, category: r.category, fixTo: mapped || null });
    }
  });
  return bad;
}

const pBad = scan('products');
const aBad = scan('articles');

console.log(`\n[检测] categories 数量=${cats.length}，合法 id=${[...validIds].join(', ')}`);
console.log(`[检测] products 异常 category ${pBad.length} 条:`);
pBad.forEach(b => console.log(`   - ${b.id} : "${b.category}"  → 修复为 ${b.fixTo || '?(无映射)'}`));
console.log(`[检测] articles 异常 category ${aBad.length} 条:`);
aBad.forEach(b => console.log(`   - ${b.id} : "${b.category}"  → 修复为 ${b.fixTo || '?(无映射)'}`));

if (!DO_FIX) {
  console.log('\n（仅检测模式，未修改数据。如需自动修复，运行：node tools/fix-category-data.js --fix）');
  process.exit(0);
}

let fixed = 0;
pBad.concat(aBad).forEach(b => {
  if (b.fixTo) {
    db.prepare(`UPDATE ${b.table || (b.id.startsWith('a-') ? 'articles' : 'products')} SET category=? WHERE id=?`)
      .run(b.fixTo, b.id);
    fixed++;
  }
});
// 上面 table 字段没设，简单分别处理
if (pBad.length) {
  const st = db.prepare('UPDATE products SET category=? WHERE id=?');
  pBad.forEach(b => { if (b.fixTo) { st.run(b.fixTo, b.id); } });
}
if (aBad.length) {
  const st = db.prepare('UPDATE articles SET category=? WHERE id=?');
  aBad.forEach(b => { if (b.fixTo) { st.run(b.fixTo, b.id); } });
}
console.log(`\n[修复] 已更新 ${pBad.filter(b=>b.fixTo).length + aBad.filter(b=>b.fixTo).length} 条`);

// 修复后重新导出静态 JSON，确保前端读到正确数据
require('../db/export').exportProducts();
require('../db/export').exportArticles();
console.log('[修复] 已重新导出 products.json / blog.json');
