/**
 * 叙境数据层 — 故宫点位数据
 * =====================================
 * 所有信息基于公开史料与故宫官方资料整理
 * 与后端 seed.ts 保持同步
 */

export interface SpotDetail {
  id: string
  name: string
  shortName: string
  description: string
  teaser: string
  location: string
  dynasty: string
  yearBuilt: string
  highlights: string[]
  architecturalStyle?: string
  keyArtifacts?: string[]
  funFacts?: string[]
  images?: {
    cover?: string
    gallery?: string[]
  }
}

export const SPOTS: Record<string, SpotDetail> = {
  'spot-clock': {
    id: 'spot-clock',
    name: '钟表馆',
    shortName: '钟表馆',
    description: '中外钟表精品，机械与艺术的极致融合',
    teaser: '滴答声里，两个帝国的对话已持续了三百年。',
    location: '紫禁城内廷东侧，东六宫以南',
    dynasty: '明永乐始建，清代重建',
    yearBuilt: '1420年（明永乐十八年）',
    highlights: [
      '馆藏中外钟表200余件',
      '铜壶滴漏——故宫唯一存世古代滴漏',
      '铜镀金写字人钟——英国使团贡品',
      '硬木雕花楼式自鸣钟——故宫最大自鸣钟',
    ],
    architecturalStyle: '工字形大殿，黄琉璃瓦重檐庑殿顶，金龙和玺彩画',
    keyArtifacts: ['铜镀金写字人钟', '硬木雕花楼式自鸣钟', '铜壶滴漏', '珐琅钟盘'],
    funFacts: [
      '康熙帝在宫内设立自鸣钟处，专门制作和维修钟表',
      '馆藏钟表以广州、苏州、宫内造办处制品及英法德日等国贡品为主',
      '珐琅钟盘颜料中含有研磨后的宝石粉末，历经三百年色泽不减',
    ],
    images: { cover: undefined },
  },

  'spot-treasure': {
    id: 'spot-treasure',
    name: '珍宝馆',
    shortName: '珍宝馆',
    description: '清宫皇家珍藏，金碧辉煌的极致呈现',
    teaser: '一座为归隐而建、却从未真正归隐的宫殿。',
    location: '紫禁城内廷东北部',
    dynasty: '清乾隆',
    yearBuilt: '1771—1776年（乾隆三十六至四十一年）',
    highlights: [
      '金瓯永固杯——500克黄金打造，镶嵌珍珠宝石',
      '点翠嵌珠后妃凤冠——明万历年间孝端显皇后所用',
      '田黄三连章——乾隆帝御用印章',
      '象牙编织席——以象牙劈成0.2毫米薄片编织',
    ],
    architecturalStyle: '仿紫禁城中路格局建造的太上皇宫，含皇极殿、宁寿宫、畅音阁、花园等',
    keyArtifacts: ['金瓯永固杯', '点翠嵌珠后妃凤冠', '田黄三连章', '象牙编织席'],
    funFacts: [
      '宁寿宫区是乾隆皇帝为自己退位后准备的太上皇宫，但他从未真正入住',
      '金瓯永固杯是清代皇帝每年元旦饮屠苏酒的专用酒杯',
      '点翠工艺需消耗数百只翠鸟背部羽毛，乾隆以后因过于残酷及资源枯竭而禁止',
    ],
    images: { cover: '/assets/card-treasure.jpg' },
  },

  'spot-ceramic': {
    id: 'spot-ceramic',
    name: '武英殿·陶瓷馆',
    shortName: '陶瓷馆',
    description: '从新石器到清末，八千年陶瓷文明',
    teaser: '八千年窑火不熄，每一代匠人都在土与火中创造奇迹。',
    location: '紫禁城外朝西路',
    dynasty: '明永乐始建',
    yearBuilt: '1420年（明永乐十八年）',
    highlights: [
      '新石器时代至清末陶瓷精品',
      '宋代汝官哥钧定五大名窑代表作',
      '元代青花瓷——苏麻离青料绘制',
      '清代粉彩、珐琅彩——"东方油画"',
    ],
    architecturalStyle: '黄琉璃瓦歇山顶，面阔五间，清代修书处旧址',
    keyArtifacts: ['汝窑天青釉器', '元青花', '成化斗彩鸡缸杯', '粉彩九桃天球瓶', '各种釉彩大瓶'],
    funFacts: [
      '武英殿曾为康熙帝御门听政之所，后设修书处刊刻《武英殿聚珍版丛书》',
      '督陶官唐英驻景德镇二十余年，著有中国古代最系统的陶瓷工艺专著《陶冶图说》',
      '成化斗彩鸡缸杯全球仅存十余件真品，2014年一只拍出2.8亿港元',
    ],
    images: { cover: '/assets/card-ceramic.jpg' },
  },

  'spot-yanxi': {
    id: 'spot-yanxi',
    name: '延禧宫',
    shortName: '延禧宫',
    description: '紫禁城中唯一的西洋式"烂尾楼"',
    teaser: '一个帝国末日的前夜，有人想做一场最华丽的梦。',
    location: '紫禁城东六宫之一',
    dynasty: '明永乐始建，清末改建',
    yearBuilt: '1420年始建，1909年改建灵沼轩',
    highlights: [
      '东六宫之一，初名长寿宫',
      '灵沼轩——清末计划中的"水晶宫"',
      '西洋式钢筋混凝土结构',
      '故宫中唯一的"烂尾楼"',
    ],
    architecturalStyle: '汉白玉须弥座基座 + 西洋式钢筋混凝土框架 + 巴洛克风格装饰',
    keyArtifacts: ['灵沼轩遗址', '延禧宫建筑构件'],
    funFacts: [
      '宣统元年隆裕太后下令修建水晶宫，因辛亥革命爆发而停建',
      '灵沼轩采用当时欧洲最先进的钢筋混凝土技术，钢材可能来自德国',
      '原设计为三层玻璃结构，地下一层蓄养金鱼',
    ],
    images: { cover: '/assets/card-yanxi.jpg' },
  },

  'spot-shoukang': {
    id: 'spot-shoukang',
    name: '寿康宫',
    shortName: '寿康宫',
    description: '乾隆为生母崇庆皇太后所建的颐养之所',
    teaser: '一座宫殿的福气，来自一位活了八十六岁的母亲。',
    location: '紫禁城内廷外西路',
    dynasty: '清乾隆',
    yearBuilt: '1736年始建，1749年建成（乾隆元年至十四年）',
    highlights: [
      '崇庆皇太后（甄嬛原型）居所',
      '清代皇太后固定居所',
      '原状陈列——皇太后的真实生活空间',
      '乾隆帝至孝之作',
    ],
    architecturalStyle: '两进院落，正殿五间黄琉璃瓦歇山顶，门槛较低、采光充足，专为老年人居住设计',
    keyArtifacts: ['崇庆皇太后宝座', '紫檀家具', '苏绣帐幔', '原状寝宫陈设'],
    funFacts: [
      '崇庆皇太后享年86岁，是清代最长寿的皇太后',
      '寿康宫现为原状陈列，可看到皇太后真实的生活场景',
      '殿内家具以紫檀、黄花梨为主，采用榫卯结构，不用一钉一胶',
    ],
    images: { cover: '/assets/card-shoukang.jpg' },
  },

  'spot-cining': {
    id: 'spot-cining',
    name: '慈宁宫',
    shortName: '慈宁宫',
    description: '清代皇太后正宫，现为历代雕塑精品陈列',
    teaser: '从皇太后的寝宫到艺术的殿堂，这座宫殿见证了权力与美的交替。',
    location: '紫禁城内廷外西路',
    dynasty: '明嘉靖始建，清顺治重修',
    yearBuilt: '1536年（明嘉靖十五年）',
    highlights: [
      '清代皇太后正宫',
      '孝庄文皇后、孝圣宪皇后曾居于此',
      '慈宁宫花园——紫禁城内较开阔的园林',
      '现为故宫博物院雕塑馆',
    ],
    architecturalStyle: '正殿七间黄琉璃瓦重檐歇山顶，殿前月台陈设铜鹤、铜龟、日晷、嘉量',
    keyArtifacts: ['战国陶俑', '秦汉兵马俑', '南北朝佛教造像', '唐代石雕', '清代铜鎏金佛像'],
    funFacts: [
      '孝庄文皇后是顺治帝生母、康熙帝祖母，辅佐两代幼主',
      '孝庄去世后，康熙将慈宁宫正殿改为奉殿，供奉祖母神位',
      '慈宁宫花园面积约6800平方米，古木参天，是太后礼佛休憩之所',
    ],
    images: { cover: '/assets/card-cining.jpg' },
  },
}

export const SPOT_IDS = Object.keys(SPOTS)

export const SPOT_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(SPOTS).map(([id, spot]) => [id, spot.name])
)

export const SPOT_SHORT_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(SPOTS).map(([id, spot]) => [id, spot.shortName])
)

export function getSpotById(id: string): SpotDetail | undefined {
  return SPOTS[id]
}

export function getAllSpots(): SpotDetail[] {
  return Object.values(SPOTS)
}

/* ---------- 点位拓扑图（距离/步行时间）---------- */

export interface SpotEdge {
  distance: number
  walkTime: number
}

/** 无向图：邻接矩阵，单位：米 / 分钟 */
export const SPOT_GRAPH: Record<string, Record<string, SpotEdge>> = {
  'spot-clock': {
    'spot-treasure': { distance: 250, walkTime: 4 },
    'spot-yanxi': { distance: 200, walkTime: 3 },
    'spot-ceramic': { distance: 700, walkTime: 11 },
    'spot-shoukang': { distance: 500, walkTime: 8 },
    'spot-cining': { distance: 550, walkTime: 9 },
  },
  'spot-treasure': {
    'spot-clock': { distance: 250, walkTime: 4 },
    'spot-yanxi': { distance: 200, walkTime: 3 },
    'spot-ceramic': { distance: 650, walkTime: 10 },
    'spot-shoukang': { distance: 450, walkTime: 7 },
    'spot-cining': { distance: 500, walkTime: 8 },
  },
  'spot-ceramic': {
    'spot-clock': { distance: 700, walkTime: 11 },
    'spot-treasure': { distance: 650, walkTime: 10 },
    'spot-yanxi': { distance: 550, walkTime: 9 },
    'spot-shoukang': { distance: 350, walkTime: 6 },
    'spot-cining': { distance: 300, walkTime: 5 },
  },
  'spot-yanxi': {
    'spot-clock': { distance: 200, walkTime: 3 },
    'spot-treasure': { distance: 200, walkTime: 3 },
    'spot-ceramic': { distance: 550, walkTime: 9 },
    'spot-shoukang': { distance: 400, walkTime: 6 },
    'spot-cining': { distance: 450, walkTime: 7 },
  },
  'spot-shoukang': {
    'spot-clock': { distance: 500, walkTime: 8 },
    'spot-treasure': { distance: 450, walkTime: 7 },
    'spot-ceramic': { distance: 350, walkTime: 6 },
    'spot-yanxi': { distance: 400, walkTime: 6 },
    'spot-cining': { distance: 150, walkTime: 2 },
  },
  'spot-cining': {
    'spot-clock': { distance: 550, walkTime: 9 },
    'spot-treasure': { distance: 500, walkTime: 8 },
    'spot-ceramic': { distance: 300, walkTime: 5 },
    'spot-yanxi': { distance: 450, walkTime: 7 },
    'spot-shoukang': { distance: 150, walkTime: 2 },
  },
}

export function getEdge(from: string, to: string): SpotEdge | undefined {
  return SPOT_GRAPH[from]?.[to]
}

/** MVP 阶段静态配置，与后端 seed.ts 对齐 */
const CROWD_CONFIG: Record<string, 'smooth' | 'moderate' | 'crowded'> = {
  'spot-clock':    'crowded',   // 钟表馆：热门，常拥挤
  'spot-treasure': 'crowded',   // 珍宝馆：热门，常拥挤
  'spot-ceramic':  'moderate',  // 陶瓷馆：中等人流
  'spot-yanxi':    'smooth',    // 延禧宫：冷门，需引流
  'spot-shoukang': 'smooth',    // 寿康宫：冷门，需引流
  'spot-cining':   'smooth',    // 慈宁宫：冷门，需引流
}

export function getCrowdLevel(spotId: string): 'smooth' | 'moderate' | 'crowded' {
  return CROWD_CONFIG[spotId] ?? 'smooth'
}
