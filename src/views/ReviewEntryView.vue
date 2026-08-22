<template>
  <main class="entry-view">
    <section class="entry-card">
      <div class="entry-brand">T</div>
      <p class="entry-eyebrow">TMS 3.0 原型评审</p>
      <h1>请使用产品提供的版本评审链接</h1>
      <p class="entry-description">
        每个研发版本都有独立的评审地址。通过具体版本进入后，可在同一工作台查看需求目录、原型页面和修改记录。
      </p>
      <div class="entry-note">示例：/review/TMS-COMMON-202608-01</div>
    </section>
  </main>
</template>

<style scoped>
.entry-view {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background: linear-gradient(145deg, #eef4ff 0%, #f7f9fc 55%, #edf2f7 100%);
}

.entry-card {
  width: min(560px, 100%);
  padding: 48px;
  border: 1px solid #e4e9f1;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 48px rgba(35, 61, 112, 0.1);
  text-align: center;
}

.entry-brand {
  width: 48px;
  height: 48px;
  margin: 0 auto 18px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #165dff;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
}

.entry-eyebrow {
  margin: 0 0 10px;
  color: #165dff;
  font-size: 13px;
  font-weight: 600;
}

h1 {
  margin: 0;
  color: #1d2939;
  font-size: 26px;
}

.entry-description {
  margin: 16px 0 22px;
  color: #667085;
  font-size: 14px;
  line-height: 1.8;
}

.entry-note {
  padding: 11px 14px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #667085;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
}
</style>
