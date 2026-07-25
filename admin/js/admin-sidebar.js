/* ===== lightcirle 管理后台 公共侧边栏 / 移动端导航 =====
   菜单唯一数据源。新增后台页面只需：
   1) 在 <head> 引入本脚本与 admin/css/admin-sidebar.css
   2) 放置 <aside id="adminSidebar">（含 #adminNav 占位与静态 #logoutBtn）
   3) 放置 <nav id="adminMobileNav"></nav>
   菜单会自动渲染，并按当前文件名高亮，永远不会漏项。 */
(function () {
  'use strict';

  // 单一数据源：顺序即显示顺序。新增菜单项只改这里。
  var MENU = [
    { href: 'dashboard.html',  icon: 'fa-chart-pie',          label: '仪表盘' },
    { href: 'products.html',   icon: 'fa-tshirt',             label: '产品管理' },
    { href: 'articles.html',   icon: 'fa-newspaper',          label: '文章管理' },
    { href: 'categories.html', icon: 'fa-tags',               label: '分类管理' },
    { href: 'company.html',    icon: 'fa-building',           label: '公司信息' },
    { href: 'visitors.html',   icon: 'fa-chart-line',         label: '访客统计' },
    { href: 'quotes.html',     icon: 'fa-file-invoice-dollar', label: '报价线索' },
    { href: 'settings.html',   icon: 'fa-cog',                label: '站点设置' },
    { href: 'media.html',      icon: 'fa-images',             label: '媒体库' }
  ];

  function currentPage() {
    var seg = (location.pathname || '').split('/').pop();
    return seg || 'dashboard.html';
  }

  function renderNav() {
    var nav = document.getElementById('adminNav');
    if (!nav) return;
    var cur = currentPage();
    nav.innerHTML = MENU.map(function (m) {
      var active = m.href === cur ? ' active' : '';
      return '<a href="' + m.href + '" class="sb-link' + active + '">' +
             '<i class="fas ' + m.icon + ' w-5"></i>' + m.label + '</a>';
    }).join('');
  }

  function renderMobile() {
    var nav = document.getElementById('adminMobileNav');
    if (!nav) return;
    var cur = currentPage();
    nav.innerHTML = MENU.map(function (m) {
      var active = m.href === cur ? ' active' : '';
      return '<a href="' + m.href + '" class="' + active + '">' +
             '<i class="fas ' + m.icon + '"></i>' + m.label + '</a>';
    }).join('');
  }

  function init() {
    renderNav();
    renderMobile();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
