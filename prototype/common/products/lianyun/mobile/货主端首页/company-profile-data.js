// 企业资料与认证的原型示例数据；企业名称与认证状态与「我的」页保持一致。
import { mineProfile } from './mine-data.js'

export const lianyunCompanyProfile = {
  certification: {
    status: mineProfile.certification,
    subject: mineProfile.enterpriseName,
    type: '企业实名认证',
    verifiedAt: '2026-08-18',
    validUntil: '长期有效',
    channel: '平台企业认证',
  },
  enterprise: {
    fullName: mineProfile.enterpriseName,
    shortName: '恒远制造',
    creditCode: '91330206MA2AF4XK3P',
    legalRepresentative: mineProfile.name,
    registeredAddress: '浙江省宁波市北仑区明州路 168 号',
    contactAddress: '浙江省宁波市北仑区明州路 168 号 3 幢',
    contactName: mineProfile.name,
    contactPhone: '138****2039',
  },
  license: {
    name: '营业执照',
    status: '审核通过',
  },
}
