// 修复分类 id 被填成中文的问题：
// 把 categories 表中"中文 id"改回标准英文 id，并级联更新 products/articles.category 外键，
// 最后重新导出 products.json / blog.json。
//
// 用法（生产容器 /app 内）：
//   node tools/fix-category-ids.js          # 检测 + 预览（不改动）
//   node tools/fix-category-ids.js --apply  # 执行修复并重新导出 JSON
//
// 注意：仅修正"分类 id 本身是中文"的情况。若 id 已是英文、只是 name 是中文，无需此脚本。

const { getDb } = require('../db/schema');
const { exportProducts, exportArticles } = require('../db/export');

// 中文 id -> 标准英文 id 映射（按你后台的标准分类）
const zhToEn = {
  '瑜伽裤': 'yoga-pants',
  '运动文胸': 'sports-bras',
  '瑜伽文胸': 'sports-bras',
  '瑜伽外套': 'yoga-outerwear',
  '卫衣': 'hoodies',
  '套裝': 'sets',
  '套装': 'sets',
  '无缝专区': 'seamless',
  '无缝': 'seamless',
  '面料知识': 'fabric-knowledge',
  '面料': 'fabric-knowledge',
  '商业技巧': 'business-tips',
  '商业贴士': 'business-tips',
  '行业新闻': 'industry-news'
};

const db = getDb();
const cats = db.prepare('SELECT id, name, type FROM categories').all();
const apply = process.argv.includes('--apply');

console.log('=== 当前分类 id 检查（非 ASCII 即视为中文 id）===');
const plan = [];
for (const c of cats) {
  const isAscii = /^[\x00-\x7F]*$/.test(c.id);
  if (!isAscii) {
    const newId = zhToEn[c.id];
    const conflict = newId && cats.some(x => x.id === newId);
    console.log(`  中文 id: "${c.id}"  类型:${c.type}  显示名:${c.name}  → 映射英文:${newId || '(无,需人工)'} ${conflict ? '⚠与现有 id 冲突' : ''}`);
    if (newId && !conflict) plan.push({ oldId: c.id, newId });
  }
}

if (plan.length === 0) {
  console.log('\n✅ 没有发现中文 id，分类数据正常。');
  process.exit(0);
}

console.log(`\n待修复: ${plan.length} 项`);
if (!apply) {
  console.log('（预览模式，未改动数据。加 --apply 执行修复）');
  process.exit(0);
}

// 执行修复（事务 + 级联 + 重新导出）
const tx = db.transaction(() => {
  for (const { oldId, newId } of plan) {
    db.prepare('UPDATE categories SET id=? WHERE id=?').run(newId, oldId);
    db.prepare('UPDATE products SET category=? WHERE category=?').run(newId, oldId);
    db.prepare('UPDATE articles SET category=? WHERE category=?').run(newId, oldId);
  }
});
tx();
exportProducts();
exportArticles();
console.log(`\n✅ 已修复 ${plan.length} 个分类 id，并级联更新产品/文章外键，重新导出 JSON 完成。`);
