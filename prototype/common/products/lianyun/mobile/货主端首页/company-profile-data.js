// 企业资料的只读原型示例数据；企业名称与「我的」页保持一致。
import { mineProfile } from './mine-data.js'

export const lianyunCompanyProfile = {
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
  },
}
