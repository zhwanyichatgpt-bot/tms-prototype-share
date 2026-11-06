<template>
  <div class="aia-statusbar" aria-hidden="true">
    <span class="aia-statusbar__time">9:41</span>
    <span class="aia-statusbar__icons">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
      <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
      <span class="aia-statusbar__battery"/>
    </span>
  </div>
</template>

<style scoped>
.aia-statusbar {
  position: relative;
  z-index: 2;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  color: #0c0c0c;
}
.aia-statusbar__time { font-size: 15px; font-weight: 600; letter-spacing: .3px; }
.aia-statusbar__icons { display: flex; align-items: center; gap: 5px; }
.aia-statusbar__battery {
  position: relative;
  display: inline-block;
  width: 22.8px;
  height: 11.75px;
  border: 2px solid rgba(12, 12, 12, .35);
  border-radius: 1.5px;
}
.aia-statusbar__battery::before { content: ''; position: absolute; inset: 0; background: #0c0c0c; border-radius: .7px; }
.aia-statusbar__battery::after { content: ''; position: absolute; top: 1.8px; right: -3.4px; width: 1.4px; height: 4.15px; background: rgba(12, 12, 12, .35); border-radius: .7px; }
</style>
