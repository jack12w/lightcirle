// Shared Media Picker — included by admin pages that need "从媒体库选择" functionality
// Usage: set window.__mediaPickCallback before calling openSharedMediaPicker()

function openSharedMediaPicker() {
  var modal = document.getElementById('sharedMediaPickerModal');
  if (!modal) { // Create modal if not exists
    modal = document.createElement('div');
    modal.id = 'sharedMediaPickerModal';
    modal.className = 'fixed inset-0 bg-black/40 z-50 hidden flex items-start justify-center p-4 pt-16 overflow-y-auto';
    modal.onclick = function(e) { if (e.target === modal) closeSharedMediaPicker(); };
    modal.innerHTML = '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6" onclick="event.stopPropagation()">' +
      '<div class="flex justify-between items-center mb-4">' +
        '<h2 class="text-lg font-serif font-bold">从媒体库选择</h2>' +
        '<button onclick="closeSharedMediaPicker()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>' +
      '</div>' +
      '<div id="sharedMediaPickerGrid" class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto">' +
        '<p class="text-gray-400 text-sm col-span-full">加载中...</p>' +
      '</div>' +
    '</div>';
    document.body.appendChild(modal);
  }
  modal.classList.remove('hidden');
  loadSharedMediaList();
}

function closeSharedMediaPicker() {
  var modal = document.getElementById('sharedMediaPickerModal');
  if (modal) modal.classList.add('hidden');
}

async function loadSharedMediaList() {
  var grid = document.getElementById('sharedMediaPickerGrid');
  if (!grid) return;
  grid.innerHTML = '<p class="text-gray-400 text-sm col-span-full">加载中...</p>';
  try {
    var res = await fetch(window.__API_BASE + '/media?limit=200', {
      headers: { 'Authorization': 'Bearer ' + window.__AUTH_TOKEN }
    });
    var files = await res.json();
    if (!Array.isArray(files) || !files.length) {
      grid.innerHTML = '<p class="text-gray-400 text-sm col-span-full">媒体库为空</p>';
      return;
    }
    grid.innerHTML = files.map(function(f) {
      var url = (f.filePath || '').replace(/'/g, "\\'");
      return '<div class="relative rounded-lg overflow-hidden border border-gray-100 hover:border-[#2D5A3D] cursor-pointer transition-colors" onclick="sharedPickMedia(\'' + url + '\')">' +
        '<img src="' + url + '" class="w-full h-24 object-cover" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23ccc%22 font-size=%2210%22>Broken</text></svg>\'">' +
        '<div class="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">' +
        '<span class="opacity-0 hover:opacity-100 bg-[#2D5A3D] text-white text-xs px-2 py-1 rounded">选择</span></div>' +
        '</div>';
    }).join('');
  } catch(e) {
    grid.innerHTML = '<p class="text-red-400 text-sm col-span-full">加载失败: ' + e.message + '</p>';
  }
}

function sharedPickMedia(url) {
  if (typeof window.__mediaPickCallback === 'function') {
    window.__mediaPickCallback(url);
  }
  closeSharedMediaPicker();
}
