(function() {
  'use strict';

  // 状态管理
  let token = localStorage.getItem('adminToken');
  let currentPage = 1;
  let totalPages = 1;
  let messages = [];
  const pageSize = 10;

  // 状态映射
  const statusMap = {
    unread: { label: '未读', class: 'status-unread' },
    read: { label: '已读', class: 'status-read' },
    timeout: { label: '超时', class: 'status-timeout' },
    confirmed: { label: '已确认', class: 'status-confirmed' },
    rejected: { label: '已退回', class: 'status-rejected' }
  };

  // DOM 元素引用
  let elements = {};

  // 初始化
  document.addEventListener('DOMContentLoaded', function() {
    // 缓存 DOM 元素
    elements = {
      loginPage: document.getElementById('loginPage'),
      adminPage: document.getElementById('adminPage'),
      loginForm: document.getElementById('loginForm'),
      loginBtn: document.getElementById('loginBtn'),
      loginError: document.getElementById('loginError'),
      usernameInput: document.getElementById('username'),
      passwordInput: document.getElementById('password'),
      userName: document.getElementById('userName'),
      logoutBtn: document.getElementById('logoutBtn'),
      statusFilter: document.getElementById('statusFilter'),
      batchTimeoutBtn: document.getElementById('batchTimeoutBtn'),
      batchCancelTimeoutBtn: document.getElementById('batchCancelTimeoutBtn'),
      refreshBtn: document.getElementById('refreshBtn'),
      selectAll: document.getElementById('selectAll'),
      messageTableBody: document.getElementById('messageTableBody'),
      prevBtn: document.getElementById('prevBtn'),
      nextBtn: document.getElementById('nextBtn'),
      pageInfo: document.getElementById('pageInfo')
    };

    // 绑定事件
    bindEvents();

    // 检查登录状态
    if (token) {
      showAdminPage();
      loadMessages();
    }
  });

  // 绑定所有事件
  function bindEvents() {
    // 登录表单提交
    elements.loginForm.addEventListener('submit', handleLogin);

    // 退出登录
    elements.logoutBtn.addEventListener('click', logout);

    // 状态筛选
    elements.statusFilter.addEventListener('change', function() {
      currentPage = 1;
      loadMessages();
    });

    // 批量设为超时
    elements.batchTimeoutBtn.addEventListener('click', function() {
      batchSetTimeout(true);
    });

    // 批量取消超时
    elements.batchCancelTimeoutBtn.addEventListener('click', function() {
      batchSetTimeout(false);
    });

    // 刷新
    elements.refreshBtn.addEventListener('click', loadMessages);

    // 全选
    elements.selectAll.addEventListener('change', toggleSelectAll);

    // 上一页
    elements.prevBtn.addEventListener('click', function() {
      changePage(-1);
    });

    // 下一页
    elements.nextBtn.addEventListener('click', function() {
      changePage(1);
    });

    // 使用事件委托处理表格内的按钮点击
    elements.messageTableBody.addEventListener('click', handleTableClick);
  }

  // 处理登录
  async function handleLogin(e) {
    e.preventDefault();
    const username = elements.usernameInput.value;
    const password = elements.passwordInput.value;

    elements.loginBtn.disabled = true;
    elements.loginBtn.textContent = '登录中...';
    elements.loginError.textContent = '';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.user.role !== 'admin') {
          elements.loginError.textContent = '只有管理员才能登录此系统';
          return;
        }
        token = data.data.token;
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(data.data.user));
        showAdminPage();
        loadMessages();
      } else {
        elements.loginError.textContent = data.error || '登录失败';
      }
    } catch (error) {
      elements.loginError.textContent = '网络错误，请重试';
    } finally {
      elements.loginBtn.disabled = false;
      elements.loginBtn.textContent = '登录';
    }
  }

  // 显示管理页面
  function showAdminPage() {
    elements.loginPage.style.display = 'none';
    elements.adminPage.style.display = 'block';
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    elements.userName.textContent = '欢迎, ' + (user.name || '管理员');
  }

  // 退出登录
  function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    token = null;
    elements.loginPage.style.display = 'flex';
    elements.adminPage.style.display = 'none';
  }

  // 加载消息列表
  async function loadMessages() {
    elements.messageTableBody.innerHTML = '<tr><td colspan="9" class="loading">加载中...</td></tr>';

    const status = elements.statusFilter.value;
    let url = '/api/admin/messages?page=' + currentPage + '&pageSize=' + pageSize;
    if (status) {
      url += '&status=' + status;
    }

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      const data = await response.json();

      if (data.success) {
        messages = data.data.items;
        totalPages = data.data.totalPages;
        renderMessages();
        updatePagination();
      } else {
        if (response.status === 401) {
          logout();
          showToast('登录已过期，请重新登录', 'error');
        } else {
          elements.messageTableBody.innerHTML = '<tr><td colspan="9" class="empty">加载失败: ' + data.error + '</td></tr>';
        }
      }
    } catch (error) {
      elements.messageTableBody.innerHTML = '<tr><td colspan="9" class="empty">网络错误，请重试</td></tr>';
    }
  }

  // 渲染消息列表
  function renderMessages() {
    if (messages.length === 0) {
      elements.messageTableBody.innerHTML = '<tr><td colspan="9" class="empty">暂无消息数据</td></tr>';
      return;
    }

    let html = '';
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const status = statusMap[msg.status] || { label: msg.status, class: '' };
      const canSetTimeout = msg.status === 'unread' || msg.status === 'read';
      const canCancelTimeout = msg.status === 'timeout';
      
      html += '<tr>';
      html += '<td class="checkbox-cell">';
      html += '<input type="checkbox" class="msg-checkbox" value="' + msg.id + '"';
      if (!canSetTimeout && !canCancelTimeout) {
        html += ' disabled';
      }
      html += '>';
      html += '</td>';
      html += '<td>' + msg.id + '</td>';
      html += '<td>' + (msg.violation ? msg.violation.plateNumber : '-') + ' - ' + (msg.violation ? msg.violation.vehicleType : '') + '</td>';
      html += '<td>' + (msg.police ? msg.police.name : '-') + '</td>';
      html += '<td>' + (msg.villageChief ? msg.villageChief.name : '-') + '</td>';
      html += '<td>' + (msg.villageChief && msg.villageChief.village ? msg.villageChief.village.name : '-') + '</td>';
      html += '<td><span class="status-badge ' + status.class + '">' + status.label + '</span></td>';
      html += '<td>' + formatDate(msg.sentAt) + '</td>';
      html += '<td>';
      if (canSetTimeout) {
        html += '<button class="btn-action btn-timeout" style="padding:6px 12px;font-size:12px" data-action="set-timeout" data-id="' + msg.id + '">设为超时</button>';
      }
      if (canCancelTimeout) {
        html += '<button class="btn-action btn-cancel-timeout" style="padding:6px 12px;font-size:12px" data-action="cancel-timeout" data-id="' + msg.id + '">取消超时</button>';
      }
      html += '</td>';
      html += '</tr>';
    }
    elements.messageTableBody.innerHTML = html;
  }

  // 处理表格点击事件（事件委托）
  function handleTableClick(e) {
    const target = e.target;
    if (target.tagName === 'BUTTON') {
      const action = target.getAttribute('data-action');
      const id = parseInt(target.getAttribute('data-id'), 10);
      
      if (action === 'set-timeout') {
        setMessageTimeout(id, true);
      } else if (action === 'cancel-timeout') {
        setMessageTimeout(id, false);
      }
    }
  }

  // 格式化日期
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 更新分页信息
  function updatePagination() {
    elements.pageInfo.textContent = '第 ' + currentPage + ' 页 / 共 ' + (totalPages || 1) + ' 页';
    elements.prevBtn.disabled = currentPage <= 1;
    elements.nextBtn.disabled = currentPage >= totalPages;
  }

  // 翻页
  function changePage(delta) {
    currentPage += delta;
    loadMessages();
  }

  // 全选/取消全选
  function toggleSelectAll() {
    const selectAll = elements.selectAll.checked;
    const checkboxes = document.querySelectorAll('.msg-checkbox:not(:disabled)');
    for (let i = 0; i < checkboxes.length; i++) {
      checkboxes[i].checked = selectAll;
    }
  }

  // 获取选中的消息ID
  function getSelectedIds() {
    const checkboxes = document.querySelectorAll('.msg-checkbox:checked');
    const ids = [];
    for (let i = 0; i < checkboxes.length; i++) {
      ids.push(parseInt(checkboxes[i].value, 10));
    }
    return ids;
  }

  // 设置单条消息超时状态
  async function setMessageTimeout(messageId, isTimeout) {
    try {
      const response = await fetch('/api/admin/messages/' + messageId + '/timeout', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ isTimeout: isTimeout })
      });

      const data = await response.json();

      if (data.success) {
        showToast(data.message || '操作成功', 'success');
        loadMessages();
      } else {
        showToast(data.error || '操作失败', 'error');
      }
    } catch (error) {
      showToast('网络错误，请重试', 'error');
    }
  }

  // 批量设置超时状态
  async function batchSetTimeout(isTimeout) {
    const ids = getSelectedIds();
    
    if (ids.length === 0) {
      showToast('请先选择消息', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/messages/batch-timeout', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ messageIds: ids, isTimeout: isTimeout })
      });

      const data = await response.json();

      if (data.success) {
        showToast(data.message || '操作成功', 'success');
        elements.selectAll.checked = false;
        loadMessages();
      } else {
        showToast(data.error || '操作失败', 'error');
      }
    } catch (error) {
      showToast('网络错误，请重试', 'error');
    }
  }

  // 显示 Toast 消息
  function showToast(message, type) {
    type = type || 'success';
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function() {
      toast.remove();
    }, 3000);
  }
})();
