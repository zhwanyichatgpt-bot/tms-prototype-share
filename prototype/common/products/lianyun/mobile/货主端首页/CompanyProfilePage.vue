<template>
  <section class="ly-service-page ly-company-page" aria-label="企业资料与认证">
    <header class="ly-service-nav">
      <button type="button" aria-label="返回我的" @click="$emit('back')"><van-icon name="arrow-left" /></button>
      <h1>企业资料与认证</h1>
      <span aria-hidden="true" />
    </header>

    <main class="ly-service-content ly-company-content">
      <section class="ly-company-hero">
        <span class="ly-company-badge"><van-icon name="certificate" />{{ profile.certification.status }}</span>
        <h2>{{ profile.enterprise.fullName }}</h2>
        <p>{{ profile.certification.type }} · {{ profile.certification.validUntil }}</p>
      </section>

      <section class="ly-company-card" aria-labelledby="ly-company-cert-title">
        <h2 id="ly-company-cert-title">认证信息</h2>
        <dl class="ly-company-rows">
          <div v-for="row in certificationRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
      </section>

      <section class="ly-company-card" aria-labelledby="ly-company-enterprise-title">
        <h2 id="ly-company-enterprise-title">企业资料</h2>
        <dl class="ly-company-rows">
          <div v-for="row in enterpriseRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
      </section>

      <section class="ly-company-card" aria-labelledby="ly-company-license-title">
        <h2 id="ly-company-license-title">营业执照</h2>
        <div class="ly-company-license">
          <span class="ly-company-license-icon" aria-hidden="true"><van-icon name="description-o" /></span>
          <div>
            <strong>{{ profile.license.name }}</strong>
            <small>统一社会信用代码 {{ profile.enterprise.creditCode }}</small>
          </div>
          <span class="ly-company-license-status"><van-icon name="checked" />{{ profile.license.status }}</span>
        </div>
        <p class="ly-company-note">证照影像与认证材料不在原型中展示；修改企业资料需重新提交认证审核。</p>
      </section>
    </main>
  </section>
</template>

<script setup>
import { lianyunCompanyProfile } from './company-profile-data.js'

defineEmits(['back'])

const profile = lianyunCompanyProfile
const certificationRows = [
  { label: '认证主体', value: profile.certification.subject },
  { label: '认证类型', value: profile.certification.type },
  { label: '认证时间', value: profile.certification.verifiedAt },
  { label: '有效期', value: profile.certification.validUntil },
  { label: '认证渠道', value: profile.certification.channel },
]
const enterpriseRows = [
  { label: '企业全称', value: profile.enterprise.fullName },
  { label: '企业简称', value: profile.enterprise.shortName },
  { label: '统一社会信用代码', value: profile.enterprise.creditCode },
  { label: '法定代表人', value: profile.enterprise.legalRepresentative },
  { label: '注册地址', value: profile.enterprise.registeredAddress },
  { label: '联系地址', value: profile.enterprise.contactAddress },
  { label: '联系人', value: profile.enterprise.contactName },
  { label: '联系电话', value: profile.enterprise.contactPhone },
]
</script>

<style scoped>
.ly-company-page .ly-service-nav button { display: grid; place-items: center; height: 44px; }
.ly-company-content { padding: 12px 15px 24px; }
.ly-company-hero { position: relative; overflow: hidden; padding: 17px 16px; border-radius: 14px; background: linear-gradient(135deg, #3a65ff, #5b83ff); color: #fff; box-shadow: 0 8px 20px #3a65ff26; }
.ly-company-hero::after { content: ''; position: absolute; top: -58px; right: -42px; width: 132px; height: 132px; border-radius: 50%; background: #ffffff1f; }
.ly-company-badge { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; background: #fff3; font-size: 11px; line-height: 16px; }
.ly-company-badge .van-icon { font-size: 13px; }
.ly-company-hero h2 { position: relative; z-index: 1; margin: 10px 0 4px; font-size: 18px; line-height: 26px; font-weight: 600; }
.ly-company-hero p { position: relative; z-index: 1; margin: 0; color: #ffffffcc; font-size: 12px; line-height: 18px; }
.ly-company-card { margin-top: 10px; padding: 14px; border-radius: 12px; background: #fff; }
.ly-company-card h2 { margin: 0 0 4px; color: #30343b; font-size: 15px; font-weight: 600; line-height: 22px; }
.ly-company-rows { margin: 0; }
.ly-company-rows > div { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 12px; padding: 10px 0; border-bottom: 1px solid #f0f2f7; font-size: 13px; line-height: 20px; }
.ly-company-rows > div:last-child { padding-bottom: 0; border-bottom: 0; }
.ly-company-rows dt { color: #969dab; }
.ly-company-rows dd { margin: 0; color: #30343b; text-align: right; overflow-wrap: anywhere; }
.ly-company-license { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 12px; border-radius: 10px; background: #f7f9ff; }
.ly-company-license-icon { display: grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: 9px; background: #e8efff; color: #3a65ff; font-size: 22px; }
.ly-company-license > div { flex: 1; min-width: 0; }
.ly-company-license strong { display: block; color: #30343b; font-size: 13px; font-weight: 500; line-height: 19px; }
.ly-company-license small { display: block; margin-top: 3px; overflow: hidden; color: #8b94a6; font-size: 11px; line-height: 16px; text-overflow: ellipsis; white-space: nowrap; }
.ly-company-license-status { display: inline-flex; flex: none; align-items: center; gap: 3px; color: #0f9f6e; font-size: 11px; }
.ly-company-note { margin: 10px 0 0; color: #9aa2b1; font-size: 11px; line-height: 18px; }
</style>
