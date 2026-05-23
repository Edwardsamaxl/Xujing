import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const campaign = await prisma.campaign.create({
    data: {
      name: '叙境试点：青铜文明特展',
      attractionName: '市立博物馆',
      status: 'active',
      spots: {
        create: [
          { name: '青铜馆', description: '商周青铜器精品展', type: 'hot', status: 'crowded', sortOrder: 1, qrPayload: 'bronze' },
          { name: '钟表馆', description: '欧洲机械钟表收藏', type: 'cold', status: 'targeted', sortOrder: 2, qrPayload: 'clock' },
          { name: '书画厅', description: '明清书画真迹', type: 'cold', status: 'normal', sortOrder: 3, qrPayload: 'painting' },
          { name: '特展厅', description: '限时主题展览', type: 'hot', status: 'normal', sortOrder: 4, qrPayload: 'special' },
          { name: '文创店', description: '博物馆文创商品', type: 'merchant', status: 'normal', sortOrder: 5, qrPayload: 'shop' },
        ],
      },
    },
  })

  const spots = await prisma.spot.findMany({ where: { campaignId: campaign.id } })

  const bronze = spots.find(s => s.name === '青铜馆')!
  const clock = spots.find(s => s.name === '钟表馆')!
  const painting = spots.find(s => s.name === '书画厅')!
  const special = spots.find(s => s.name === '特展厅')!
  const shop = spots.find(s => s.name === '文创店')!

  await prisma.narrativeTemplate.createMany({
    data: [
      { spotId: bronze.id, interestTag: '历史', title: '鼎中秘史', baseContent: '这件青铜鼎铸造于商代晚期，内壁铭文记载了王室祭祀的详细规程。', flavorText: '千年前的烟火气仿佛还在鼎身缭绕。' },
      { spotId: bronze.id, interestTag: '悬疑', title: '消失的铭文', baseContent: '青铜鼎内壁原本有48字铭文，其中最关键的两行在出土时已被刻意磨去。', flavorText: '是谁在隐藏真相？' },
      { spotId: bronze.id, interestTag: '亲子', title: '国王的大锅', baseContent: '三千年前，这个"大锅"用来煮祭祀用的肉，一次能煮一整头牛！', flavorText: '想象一下，古代小朋友闻到香味跑过来。' },
      { spotId: bronze.id, interestTag: '建筑', title: '失蜡法的智慧', baseContent: '青铜器的铸造采用失蜡法，蜡模熔化后铜液注入，冷却后形成中空器物。', flavorText: '工匠的智慧藏在每一寸纹路里。' },
      { spotId: bronze.id, interestTag: '人物', title: '铸鼎之人', baseContent: '铭文末尾记载了铸造官"亚醜"的名字，他是商王武丁时期的重臣。', flavorText: '他的名字穿越三千年，被我们重新念出。' },
      { spotId: bronze.id, interestTag: '工艺', title: '饕餮纹的秘密', baseContent: '鼎身饕餮纹并非装饰，而是氏族图腾，具有明确的身份标识功能。', flavorText: '每一道纹路都是一部家族密码。' },

      { spotId: clock.id, interestTag: '历史', title: '时间的礼物', baseContent: '这座钟表是乾隆年间英国使团进贡的礼品，机芯至今仍在运转。', flavorText: '滴答声里藏着两个帝国的对话。' },
      { spotId: clock.id, interestTag: '悬疑', title: '停走的指针', baseContent: '钟表曾在某个深夜无故停走，维修师傅在机芯夹层发现了一张泛黄的纸条。', flavorText: '纸条上只有一个时间和地点。' },
      { spotId: clock.id, interestTag: '亲子', title: '会唱歌的钟', baseContent: '每到整点，这座钟会播放一段简单的旋律，古代没有手机，人们靠它知道时间。', flavorText: '要不要猜猜现在几点？' },
      { spotId: clock.id, interestTag: '建筑', title: '齿轮里的建筑', baseContent: '钟表的内部结构如同微缩建筑，齿轮咬合精度达到0.01毫米。', flavorText: '一座装在玻璃罩里的机械宫殿。' },
      { spotId: clock.id, interestTag: '人物', title: '修钟人', baseContent: '最后一位能修复此类机芯的匠人已于上世纪末离世，技艺面临失传。', flavorText: '有些手艺，注定只能留在时间里。' },
      { spotId: clock.id, interestTag: '工艺', title: '珐琅的火焰', baseContent: '钟盘采用掐丝珐琅工艺，历经三百年色泽不减，因为颜料中含有研磨后的宝石粉末。', flavorText: '火焰与矿石的永恒之舞。' },

      { spotId: painting.id, interestTag: '历史', title: '画中人', baseContent: '这幅肖像画中的女子是明代内阁首辅的千金，画作完成三年后她远嫁边疆。', flavorText: '画家为她多画了一双眼睛，藏在背景的山水里。' },
      { spotId: painting.id, interestTag: '悬疑', title: '多出来的印章', baseContent: '画卷右下角有一枚从未被鉴定的印章，与任何已知的收藏家都不匹配。', flavorText: '是谁在深夜悄悄盖下了这枚印记？' },
      { spotId: painting.id, interestTag: '亲子', title: '找一找', baseContent: '画家在画里藏了七只小动物，有蝴蝶、小鸟和一只睡懒觉的猫。', flavorText: '你能把它们都找出来吗？' },
      { spotId: painting.id, interestTag: '建筑', title: '画中的园林', baseContent: '背景建筑的透视和比例严格遵循《营造法式》，是研究明代建筑的重要图像资料。', flavorText: '每一笔都是测量过的。' },
      { spotId: painting.id, interestTag: '人物', title: '画家与模特', baseContent: '画家与这位千金有过一段不被世俗接受的情谊，这幅画是他晚年的封笔之作。', flavorText: '他把不能说出口的话，都藏在了颜料里。' },
      { spotId: painting.id, interestTag: '工艺', title: '矿物颜料', baseContent: '画中蓝色取自青金石，红色取自朱砂，白色取自贝壳粉，历经五百年不褪色。', flavorText: '大地和海洋的颜色被留在了纸上。' },

      { spotId: special.id, interestTag: '历史', title: '限时真相', baseContent: '本次特展首次公开了一批从未面世的考古笔记，记录了1923年的一次秘密发掘。', flavorText: '有些历史，被刻意封存了一百年。' },
      { spotId: special.id, interestTag: '悬疑', title: '空白页', baseContent: '考古笔记中间有十二页被整页撕去，边缘残留着细微的指纹痕迹。', flavorText: '撕掉的内容，比留下的更可怕。' },
      { spotId: special.id, interestTag: '亲子', title: '小小考古家', baseContent: '这里展示了一个真实的探方，你可以看到土层是如何一层一层被挖开的。', flavorText: '每一层土都是一本历史书。' },
      { spotId: special.id, interestTag: '建筑', title: '发掘现场', baseContent: '特展还原了考古发掘现场，展示了如何在不破坏遗迹的前提下提取文物。', flavorText: '考古是最耐心的建筑。' },
      { spotId: special.id, interestTag: '人物', title: '笔记的主人', baseContent: '笔记的主人是当时的发掘领队，他在最后一次发掘后神秘失踪。', flavorText: '他发现了什么？又去了哪里？' },
      { spotId: special.id, interestTag: '工艺', title: '修复台', baseContent: '展柜旁设有透明修复室，游客可以观看文物修复师的工作过程。', flavorText: '破碎的历史在这里被重新拼合。' },

      { spotId: shop.id, interestTag: '历史', title: '带一段历史回家', baseContent: '文创店推出了以青铜鼎纹样为设计元素的文具系列，每一件都有对应的文物故事卡。', flavorText: '历史可以被握在手里。' },
      { spotId: shop.id, interestTag: '悬疑', title: '解密套装', baseContent: '以钟表馆神秘纸条为灵感设计的解谜书，包含复刻版纸条和一系列线索道具。', flavorText: '你能否解开百年前的谜题？' },
      { spotId: shop.id, interestTag: '亲子', title: '考古盲盒', baseContent: '模拟考古发掘体验的盲盒玩具，包含石膏块和微型工具，可以亲手"挖出"文物模型。', flavorText: '每个孩子都能当一次考古学家。' },
      { spotId: shop.id, interestTag: '建筑', title: '营造积木', baseContent: '以《营造法式》为基础设计的古建筑榫卯积木，可以亲手搭建一座微缩殿宇。', flavorText: '一木一榫，都是古人的智慧。' },
      { spotId: shop.id, interestTag: '人物', title: '画中人的信笺', baseContent: '复刻了明代女子信笺样式的笔记本，封面印有画中人的侧影。', flavorText: '写一封信，穿越五百年。' },
      { spotId: shop.id, interestTag: '工艺', title: '矿物颜料盒', baseContent: '以画中矿物颜料为概念设计的调色盘，包含六种传统矿物色粉。', flavorText: '用古人一样的颜色画一幅画。' },
    ],
  })

  await prisma.reward.create({
    data: {
      campaignId: campaign.id,
      name: '青铜文明探索者',
      type: 'badge',
      imageUrl: '/badges/bronze-explorer.png',
      unlockText: '你完成了青铜文明特展的全部探索，获得了"青铜文明探索者"称号。',
      triggerCondition: 'complete_all',
    },
  })

  console.log('Seed completed. Campaign ID:', campaign.id)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
