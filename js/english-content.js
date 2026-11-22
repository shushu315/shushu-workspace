/* 英语课程内容库：商务词库 + 外贸场景文章 + 语法技巧 */
(function (global) {
  const W = (en, zh, ex, cat) => ({ en, zh, ex, cat });

  /* 商务英语词库（按场景分类，每类约 20 个） */
  const WORDS = [
    // 询盘与报价
    W('quote', '报价；引述', 'Could you send us a quote for 500 units?', 'inquiry'),
    W('quotation', '报价单', 'Please find the attached quotation.', 'inquiry'),
    W('inquiry', '询盘；询问', 'We received an inquiry from a German buyer.', 'inquiry'),
    W('MOQ', '最小起订量', 'Our MOQ is 200 pieces per design.', 'inquiry'),
    W('lead time', '交期；生产周期', 'The lead time is about 25 days.', 'inquiry'),
    W('FOB', '离岸价', 'We quote FOB Shenzhen.', 'inquiry'),
    W('CIF', '到岸价（成本+保险+运费）', 'CIF Hamburg is also acceptable.', 'inquiry'),
    W('sample', '样品', 'We can provide a free sample.', 'inquiry'),
    W('specification', '规格', 'Please check the specification sheet.', 'inquiry'),
    W('catalog', '产品目录', 'I have attached our latest catalog.', 'inquiry'),
    W('unit price', '单价', 'The unit price is 18 dollars.', 'inquiry'),
    W('discount', '折扣', 'We offer a 5% discount for bulk orders.', 'inquiry'),
    W('validity', '有效期', 'The price validity is 30 days.', 'inquiry'),
    W('bulk order', '大批量订单', 'A bulk order will lower the cost.', 'inquiry'),
    W('payment terms', '付款方式', 'Our payment terms are 30% deposit.', 'inquiry'),
    W('price list', '价格表', 'Here is our updated price list.', 'inquiry'),
    W('request', '请求；要求', 'They requested a customized package.', 'inquiry'),
    W('available', '可获得的；有货的', 'The fabric is available in three colors.', 'inquiry'),
    W('detail', '细节', 'We need more details about the size.', 'inquiry'),
    W('follow up', '跟进', 'I will follow up with the supplier.', 'inquiry'),

    // 议价与谈判
    W('negotiate', '谈判；协商', 'We need to negotiate the price.', 'negotiation'),
    W('negotiation', '谈判', 'The negotiation went smoothly.', 'negotiation'),
    W('margin', '利润空间', 'The margin is quite thin.', 'negotiation'),
    W('concession', '让步', 'We made a small concession on price.', 'negotiation'),
    W('counterpart', '对方；对手方', 'Our counterpart agreed to the terms.', 'negotiation'),
    W('terms', '条款；条件', 'Let us discuss the payment terms.', 'negotiation'),
    W('volume', '数量；批量', 'Higher volume means a better price.', 'negotiation'),
    W('competitive', '有竞争力的', 'Our price is competitive in the market.', 'negotiation'),
    W('acceptable', '可接受的', 'Is this price acceptable to you?', 'negotiation'),
    W('compromise', '妥协；折中', 'We reached a compromise.', 'negotiation'),
    W('win-win', '双赢', 'We are looking for a win-win solution.', 'negotiation'),
    W('budget', '预算', 'That is beyond our budget.', 'negotiation'),
    W('firm', '坚定的；（价格）不可更改的', 'Our price is firm.', 'negotiation'),
    W('meet halfway', '各让一步', 'Let us meet halfway on the shipping cost.', 'negotiation'),
    W('leverage', '利用；影响力', 'We leveraged our long relationship.', 'negotiation'),
    W('proposal', '提议；方案', 'We sent a revised proposal.', 'negotiation'),
    W('counteroffer', '还盘；反报价', 'They made a counteroffer yesterday.', 'negotiation'),
    W('agree on', '就…达成一致', 'We agreed on the delivery date.', 'negotiation'),
    W('flexible', '灵活的', 'We can be flexible on the design.', 'negotiation'),
    W('bottom line', '底线', 'The bottom line is 15 dollars.', 'negotiation'),

    // 下单与生产
    W('confirm', '确认', 'Please confirm the order details.', 'production'),
    W('deposit', '定金', 'We received the deposit.', 'production'),
    W('production schedule', '生产排期', 'The production schedule is tight.', 'production'),
    W('workshop', '车间；工厂', 'The workshop runs two shifts.', 'production'),
    W('quality control', '质量控制', 'We have strict quality control.', 'production'),
    W('inspection', '验货；检验', 'A third-party inspection is planned.', 'production'),
    W('delay', '延误', 'There is a two-day delay.', 'production'),
    W('capacity', '产能', 'Our monthly capacity is 5,000 units.', 'production'),
    W('raw material', '原材料', 'Raw material costs are rising.', 'production'),
    W('craftsmanship', '工艺；手艺', 'The craftsmanship is excellent.', 'production'),
    W('sample approval', '样品确认', 'We are waiting for sample approval.', 'production'),
    W('mass production', '量产', 'Mass production starts next week.', 'production'),
    W('quality standard', '质量标准', 'It meets our quality standard.', 'production'),
    W('defect', '瑕疵；次品', 'We found a small defect.', 'production'),
    W('rework', '返工', 'The item needs rework.', 'production'),
    W('supplier', '供应商', 'We changed the supplier.', 'production'),
    W('in stock', '有库存', 'The item is in stock.', 'production'),
    W('out of stock', '缺货', 'The color is out of stock.', 'production'),
    W('process', '流程；工序', 'The process has six steps.', 'production'),
    W('finalize', '最终确定', 'Let us finalize the design.', 'production'),

    // 物流与发货
    W('shipment', '发货；装运', 'The shipment leaves on Friday.', 'logistics'),
    W('carrier', '承运商', 'We use a reliable carrier.', 'logistics'),
    W('tracking number', '运单号', 'I will send the tracking number.', 'logistics'),
    W('customs', '海关', 'The goods are at customs.', 'logistics'),
    W('invoice', '发票', 'Please find the commercial invoice.', 'logistics'),
    W('packing list', '装箱单', 'The packing list is attached.', 'logistics'),
    W('delivery', '交付；送货', 'Delivery takes seven days.', 'logistics'),
    W('warehouse', '仓库', 'We ship from our warehouse.', 'logistics'),
    W('freight', '运费；货物', 'Freight charges have increased.', 'logistics'),
    W('insurance', '保险', 'Shipping insurance is included.', 'logistics'),
    W('bill of lading', '提单', 'The bill of lading is ready.', 'logistics'),
    W('clearance', '清关', 'Customs clearance was fast.', 'logistics'),
    W('dispatch', '发送；派遣', 'We will dispatch the goods today.', 'logistics'),
    W('eta', '预计到达时间', 'The ETA is next Tuesday.', 'logistics'),
    W('fragile', '易碎的', 'Please mark the box fragile.', 'logistics'),
    W('package', '包装', 'The package arrived damaged.', 'logistics'),
    W('consignee', '收货人', 'Please check the consignee address.', 'logistics'),
    W('port', '港口', 'The port is congested.', 'logistics'),
    W('container', '集装箱', 'A full container was loaded.', 'logistics'),
    W('on time', '准时', 'The goods arrived on time.', 'logistics'),

    // 营销与电商
    W('campaign', '营销活动', 'We launched a spring campaign.', 'marketing'),
    W('listing', '商品页面；上架', 'The listing needs better photos.', 'marketing'),
    W('conversion', '转化；转化率', 'The conversion rate improved.', 'marketing'),
    W('engagement', '互动；参与度', 'Engagement is growing steadily.', 'marketing'),
    W('audience', '受众', 'We know our target audience.', 'marketing'),
    W('brand awareness', '品牌知名度', 'It builds brand awareness.', 'marketing'),
    W('promotion', '促销；推广', 'The promotion starts tomorrow.', 'marketing'),
    W('follower', '粉丝；关注者', 'We gained 200 followers.', 'marketing'),
    W('launch', '发布；上线', 'We launch the new collection in May.', 'marketing'),
    W('highlight', '亮点；强调', 'Let us highlight the craftsmanship.', 'marketing'),
    W('visual', '视觉的', 'The visual story matters.', 'marketing'),
    W('traffic', '流量', 'Traffic comes from short videos.', 'marketing'),
    W('content', '内容', 'Good content drives sales.', 'marketing'),
    W('niche', '小众的；细分市场', 'We serve a niche market.', 'marketing'),
    W('positioning', '定位', 'Our positioning is quiet luxury.', 'marketing'),
    W('testimonial', '客户好评', 'We shared a customer testimonial.', 'marketing'),
    W('click-through rate', '点击率', 'The click-through rate is 3%.', 'marketing'),
    W('retargeting', '再营销', 'Retargeting brought back buyers.', 'marketing'),
    W('influencer', '达人；网红', 'We cooperated with an influencer.', 'marketing'),
    W('seasonal', '季节性的', 'Demand is seasonal.', 'marketing'),

    // 会议与沟通
    W('agenda', '议程', 'Let us go through the agenda.', 'meeting'),
    W('recap', '回顾；总结', 'A quick recap of last week.', 'meeting'),
    W('align', '对齐；达成一致', 'Let us align on the next step.', 'meeting'),
    W('action item', '行动项', 'We have three action items.', 'meeting'),
    W('stakeholder', '利益相关方', 'All stakeholders are informed.', 'meeting'),
    W('deadline', '截止日期', 'The deadline is Friday.', 'meeting'),
    W('brainstorm', '头脑风暴', 'Let us brainstorm ideas.', 'meeting'),
    W('decision', '决定', 'We made a quick decision.', 'meeting'),
    W('minutes', '会议纪要', 'I will send the meeting minutes.', 'meeting'),
    W('schedule a call', '安排电话会议', 'Can we schedule a call?', 'meeting'),
    W('circle back', '稍后再讨论', 'Let us circle back on this.', 'meeting'),
    W('on the same page', '意见一致', 'We are on the same page.', 'meeting'),
    W('clarify', '澄清', 'Let me clarify one point.', 'meeting'),
    W('prioritize', '确定优先级', 'We need to prioritize tasks.', 'meeting'),
    W('update', '更新；汇报', 'Please update me on progress.', 'meeting'),
    W('remind', '提醒', 'Please remind the team.', 'meeting'),
    W('attendee', '参会者', 'All attendees joined on time.', 'meeting'),
    W('wrapping up', '收尾', 'Before wrapping up, one more thing.', 'meeting'),

    // 售后与客户关系
    W('complaint', '投诉', 'We received a complaint.', 'aftersales'),
    W('refund', '退款', 'We issued a full refund.', 'aftersales'),
    W('replacement', '替换件；更换', 'We sent a replacement.', 'aftersales'),
    W('feedback', '反馈', 'Thank you for your feedback.', 'aftersales'),
    W('resolve', '解决', 'We resolved the issue quickly.', 'aftersales'),
    W('warranty', '保修', 'It is under warranty.', 'aftersales'),
    W('damage', '损坏', 'The item arrived with damage.', 'aftersales'),
    W('claim', '索赔；声称', 'They filed a claim.', 'aftersales'),
    W('apology', '道歉', 'Please accept our apology.', 'aftersales'),
    W('satisfaction', '满意度', 'Customer satisfaction matters.', 'aftersales'),
    W('trust', '信任', 'Trust takes time to build.', 'relationship'),
    W('rapport', '融洽关系', 'We built a good rapport.', 'relationship'),
    W('loyal', '忠诚的', 'She is a loyal customer.', 'relationship'),
    W('referral', '转介绍', 'We got a referral from her.', 'relationship'),
    W('appreciate', '感激；欣赏', 'We appreciate your support.', 'relationship'),
    W('partnership', '合作关系', 'We value this partnership.', 'relationship'),
    W('long-term', '长期的', 'We seek a long-term relationship.', 'relationship'),
    W('milestone', '里程碑', 'It is a milestone for our brand.', 'relationship'),
    W('sincere', '真诚的', 'Please accept my sincere thanks.', 'relationship'),
    W('keep in touch', '保持联系', 'Let us keep in touch.', 'relationship'),

    // 通用商务
    W('deadline', '截止日期', 'The deadline is approaching.', 'general'),
    W('priority', '优先级', 'This is my top priority.', 'general'),
    W('efficient', '高效的', 'She is very efficient.', 'general'),
    W('schedule', '日程；安排', 'Let me check my schedule.', 'general'),
    W('confirm', '确认', 'Please confirm by email.', 'general'),
    W('attach', '附上', 'I attached the file.', 'general'),
    W('regarding', '关于', 'Regarding your question…', 'general'),
    W('according to', '根据', 'According to the plan…', 'general'),
    W('in addition', '此外', 'In addition, the cost is lower.', 'general'),
    W('therefore', '因此', 'Therefore, we accept the offer.', 'general'),
    W('however', '然而', 'However, there is a risk.', 'general'),
    W('recommend', '推荐', 'I recommend this option.', 'general'),
    W('suggest', '建议', 'We suggest a small change.', 'general'),
    W('ensure', '确保', 'We ensure on-time delivery.', 'general'),
    W('improve', '改善', 'We improved the packaging.', 'general'),
    W('increase', '增加', 'Sales increased by 20%.', 'general'),
    W('reduce', '减少', 'We reduced the cost.', 'general'),
    W('consider', '考虑', 'Please consider our proposal.', 'general'),
    W('expect', '预期', 'We expect a quick reply.', 'general'),
    W('appreciate', '感谢', 'I appreciate your time.', 'general')
  ];

  /* 外贸真实场景文章 */
  const SCENARIOS = [
    {
      key: 'inquiry', cat: 'inquiry', title: 'Scenario 1 · Inquiry & Quotation 询盘与报价',
      articleEN: `Dear Shushu, We received your catalog at the design fair and are interested in your solid wood dining chair. Could you send us a quotation for 500 units? We would like to know the unit price, the MOQ, and the lead time. Please also let us know if the price is FOB Shenzhen or CIF Hamburg. We are a small retailer in a niche market, so a reasonable discount would help us a lot. If the sample is available, we would love to order one first. Looking forward to your reply. Best regards, Emma`,
      articleCN: `亲爱的树树：我们在设计展上收到了你们的产品目录，对你们的实木餐椅很感兴趣。能否给我们发一份 500 件的报价？我们想了解单价、最小起订量和交期。也请告知价格是深圳离岸价还是汉堡到岸价。我们是小众市场的零售商，合理的折扣对我们帮助很大。如果有样品，我们想先订一件。期待回复。此致，Emma`,
      comp: [
        { q: 'What product is the buyer interested in?', opts: ['A wooden desk', 'A solid wood dining chair', 'A fabric sofa', 'A lamp'], a: 1, why: '文章明确提到 "your solid wood dining chair"，属于细节定位题。看到关键词 product / interested in，就回原文找对应名词。' },
        { q: 'How many units does the buyer want to quote?', opts: ['200', '300', '500', '1000'], a: 2, why: '数字题要回原文定位数字："a quotation for 500 units"。不要凭印象选，先圈出数字再比对选项。' }
      ],
      speak: [
        { cn: '请发一份 500 件的报价。', target: 'Could you send us a quote for five hundred units?' },
        { cn: '交期大约 25 天。', target: 'The lead time is about twenty-five days.' },
        { cn: '我们的最小起订量是 200 件。', target: 'Our MOQ is two hundred pieces.' }
      ]
    },
    {
      key: 'negotiation', cat: 'negotiation', title: 'Scenario 2 · Price Negotiation 价格谈判',
      articleEN: `Dear Emma, Thank you for your inquiry. Our unit price is 18 dollars, and the price validity is 30 days. For a bulk order of 500 units, we can offer a 5% discount. However, the margin is quite thin, so the price is firm. We can be flexible on the packaging design. I hope this price is acceptable to you, and we are looking for a win-win solution. If you can increase the volume to 800 units, we will meet you halfway on the shipping cost. Please let me know your thoughts. Best, Shushu`,
      articleCN: `亲爱的 Emma：谢谢你的询盘。我们的单价是 18 美元，价格有效期 30 天。500 件的大批量订单可享 5% 折扣。不过利润空间很薄，所以价格不可再降。包装设计我们可以灵活处理。希望这个价格你能接受，我们寻求双赢方案。如果数量增加到 800 件，运费上我们可以各让一步。请告知你的想法。祝好，树树`,
      comp: [
        { q: 'Why is the price firm?', opts: ['The margin is thin', 'The quality is poor', 'The order is small', 'The shipping is free'], a: 0, why: '因果题：原文 "the margin is quite thin, so the price is firm"。找 so 前后的因果链即可。' },
        { q: 'What will happen if the volume reaches 800 units?', opts: ['A 10% discount', 'Free samples', 'Sharing the shipping cost', 'A longer validity'], a: 2, why: '条件题：定位 "meet you halfway on the shipping cost"，意为运费各让一步，即分摊运费。' }
      ],
      speak: [
        { cn: '利润空间很薄，价格不能再降了。', target: 'The margin is thin, so the price is firm.' },
        { cn: '我们寻求一个双赢的方案。', target: 'We are looking for a win-win solution.' },
        { cn: '运费上我们可以各让一步。', target: 'We can meet you halfway on the shipping cost.' }
      ]
    },
    {
      key: 'production', cat: 'production', title: 'Scenario 3 · Order & Production 下单与生产',
      articleEN: `Hi Emma, We have confirmed your order and received the 30% deposit. Mass production starts next week, and the production schedule is tight. Our workshop runs two shifts to protect the lead time. Raw material costs are rising, but we will not change the price. We have strict quality control and a third-party inspection is planned before shipment. The craftsmanship of each chair is carefully checked. We will send you photos after sample approval. Please finalize the design by Friday. Best, Shushu`,
      articleCN: `Hi Emma：订单已确认，30% 定金已收到。量产下周开始，排期很紧。车间实行两班倒以保障交期。原材料成本在上涨，但我们不会改价。我们有严格质控，发货前会安排第三方验货。每把椅子的工艺都会仔细检查。样品确认后我们会发照片。请在周五前敲定设计。祝好，树树`,
      comp: [
        { q: 'How does the workshop protect the lead time?', opts: ['By adding workers', 'By running two shifts', 'By delaying inspection', 'By raising the price'], a: 1, why: '细节题：原文 "Our workshop runs two shifts to protect the lead time"。注意目的状语 to protect...' },
        { q: 'What is planned before shipment?', opts: ['A discount', 'A third-party inspection', 'A new design', 'A refund'], a: 1, why: '定位 "a third-party inspection is planned before shipment"，时间状语 before shipment 是关键信号。' }
      ],
      speak: [
        { cn: '订单已确认，定金已收到。', target: 'We have confirmed your order and received the deposit.' },
        { cn: '发货前我们会安排第三方验货。', target: 'A third-party inspection is planned before shipment.' },
        { cn: '请在周五前敲定设计。', target: 'Please finalize the design by Friday.' }
      ]
    },
    {
      key: 'logistics', cat: 'logistics', title: 'Scenario 4 · Logistics & Shipment 物流与发货',
      articleEN: `Hi Emma, Good news — your shipment is ready. We will dispatch the goods on Friday from our warehouse in Shenzhen. The carrier is reliable and the freight charges are unchanged. I have attached the commercial invoice and the packing list. The bill of lading will follow after customs clearance. The ETA at Hamburg is next Tuesday. Please check the consignee address again. We also included shipping insurance, and each box is marked fragile. I will send the tracking number once available. Best, Shushu`,
      articleCN: `Hi Emma：好消息——货已备好。周五从深圳仓库发货。承运商可靠，运费不变。商业发票和装箱单见附件。提单将在清关后补发。预计下周二到汉堡。请再次核对收货人地址。我们还买了运输保险，每个箱子都标注易碎。运单号一出我就发你。祝好，树树`,
      comp: [
        { q: 'When will the goods be dispatched?', opts: ['Monday', 'Wednesday', 'Friday', 'Next Tuesday'], a: 2, why: '时间题：区分 dispatch（发货 Friday）与 ETA（到货 next Tuesday），不要混淆两个时间。' },
        { q: 'What will follow after customs clearance?', opts: ['The invoice', 'The bill of lading', 'The sample', 'The discount'], a: 1, why: '原文 "The bill of lading will follow after customs clearance"。after 引导的从句提示顺序。' }
      ],
      speak: [
        { cn: '周五发货，运单号一出我就发你。', target: 'We will dispatch on Friday and send the tracking number once available.' },
        { cn: '请再次核对收货人地址。', target: 'Please check the consignee address again.' },
        { cn: '每个箱子都标注了易碎。', target: 'Each box is marked fragile.' }
      ]
    },
    {
      key: 'marketing', cat: 'marketing', title: 'Scenario 5 · Brand & Marketing 品牌与营销',
      articleEN: `Hi team, Our brand positioning is quiet luxury for a niche market. The spring campaign launches in May. We will highlight the craftsmanship in every visual story. Short videos drive most of our traffic, and the conversion rate improved after we updated the listing photos. Engagement is growing steadily, and we gained 200 followers last week. We also cooperated with an influencer for a testimonial. Good content builds brand awareness and loyalty. Let us keep the tone sincere and poetic. Best, Shushu`,
      articleCN: `团队好：我们的品牌定位是小众市场的静奢风。春季营销活动五月上线。每个视觉故事都会突出工艺。短视频带来大部分流量，更新商品图后转化率提升了。互动稳步增长，上周涨了 200 粉。我们还与一位达人合作了好评内容。好内容建立品牌知名度与忠诚度。保持真诚文艺的调性。祝好，树树`,
      comp: [
        { q: 'What drives most of the traffic?', opts: ['Email', 'Short videos', 'Print ads', 'Trade fairs'], a: 1, why: '细节题：原文 "Short videos drive most of our traffic"。drive traffic 是高频搭配，意为带来流量。' },
        { q: 'What happened after the listing photos were updated?', opts: ['The price rose', 'The conversion rate improved', 'The MOQ changed', 'The shipment delayed'], a: 1, why: '因果/时间题：定位 "the conversion rate improved after we updated the listing photos"。' }
      ],
      speak: [
        { cn: '我们的品牌定位是静奢风。', target: 'Our brand positioning is quiet luxury.' },
        { cn: '好内容能建立品牌知名度。', target: 'Good content builds brand awareness.' },
        { cn: '短视频带来了大部分流量。', target: 'Short videos drive most of our traffic.' }
      ]
    },
    {
      key: 'meeting', cat: 'meeting', title: 'Scenario 6 · Meetings & Follow-up 会议与跟进',
      articleEN: `Hi all, Let us go through the agenda. First, a quick recap of last week: we finalized the design and aligned on the price. Today we need to prioritize three action items. Please clarify any deadline you cannot meet. We are all on the same page about the launch date. After we brainstorm ideas, I will make the decision and send the meeting minutes. Before wrapping up, let us schedule a call with the supplier. Please update me on progress by Friday. Thanks, Shushu`,
      articleCN: `大家好：我们过一下议程。先简单回顾上周：设计已敲定，价格已对齐。今天需要确定三项行动项的优先级。如果有无法完成的截止日期请说明。关于上线日期我们意见一致。头脑风暴后我会做决定并发送会议纪要。收尾前，我们安排一次与供应商的电话会。周五前请向我汇报进度。谢谢，树树`,
      comp: [
        { q: 'What will Shushu do after brainstorming?', opts: ['Cancel the meeting', 'Make the decision and send minutes', 'Raise the price', 'Delay the launch'], a: 1, why: '顺序题：原文 "After we brainstorm ideas, I will make the decision and send the meeting minutes."' },
        { q: 'What does "on the same page" mean here?', opts: ['In agreement', 'Reading together', 'In the same room', 'Confused'], a: 0, why: '习语题：on the same page = 意见一致。高频商务习语，建议收入单词本。' }
      ],
      speak: [
        { cn: '我们过一下今天的议程。', target: 'Let us go through the agenda.' },
        { cn: '关于上线日期我们意见一致。', target: 'We are on the same page about the launch date.' },
        { cn: '周五前请向我汇报进度。', target: 'Please update me on progress by Friday.' }
      ]
    },
    {
      key: 'aftersales', cat: 'aftersales', title: 'Scenario 7 · After-sales & Care 售后与客户关系',
      articleEN: `Dear Emma, Thank you for your feedback. I am sorry the package arrived with damage. Please accept our sincere apology. We have already arranged a replacement and a full refund for the damaged item, and it is still under warranty. We will resolve this issue within 48 hours. We truly appreciate your trust and value this long-term partnership. Your satisfaction is our priority, and we hope you will keep in touch. Thank you for growing with us. Best, Shushu`,
      articleCN: `亲爱的 Emma：谢谢你的反馈。很抱歉包裹到货时已损坏。请接受我们真诚的歉意。我们已安排更换并对损坏件全额退款，且仍在保修期内。48 小时内解决。我们由衷感谢你的信任，珍视这段长期合作。你的满意度是我们的首要任务，希望保持联系。谢谢你与我们一起成长。祝好，树树`,
      comp: [
        { q: 'What did they arrange for the damaged item?', opts: ['A discount', 'A replacement and a full refund', 'A new catalog', 'A delay'], a: 1, why: '细节题：原文 "arranged a replacement and a full refund for the damaged item"。注意两个并列宾语。' },
        { q: 'How soon will the issue be resolved?', opts: ['Immediately', 'In 48 hours', 'Next month', 'In a week'], a: 1, why: '时间题：定位 "within 48 hours"。within 表示"在…之内"。' }
      ],
      speak: [
        { cn: '请接受我们真诚的歉意。', target: 'Please accept our sincere apology.' },
        { cn: '我们会在 48 小时内解决这个问题。', target: 'We will resolve this issue within forty-eight hours.' },
        { cn: '我们珍视这段长期合作。', target: 'We value this long-term partnership.' }
      ]
    },
    {
      key: 'relationship', cat: 'relationship', title: 'Scenario 8 · Client Relationship 客户维护',
      articleEN: `Hi Emma, It has been a pleasure working with you this season. We built a good rapport, and your referral last month meant a lot to our small brand. Trust takes time to build, and we never take it for granted. As we wrap up the year, I want to sincerely thank you for your loyalty. We are planning a new collection for spring and will keep you in touch with the updates. Here is to a long-term relationship and many milestones ahead. Warm regards, Shushu`,
      articleCN: `Hi Emma：这一季与你合作很愉快。我们建立了融洽的关系，上个月你的转介绍对我们小品牌意义重大。信任需要时间建立，我们从不视之为理所当然。年末之际，真诚感谢你的忠诚。我们正在筹备春季新品，会及时向你更新。愿长期合作、共创更多里程碑。温暖的问候，树树`,
      comp: [
        { q: 'What did the client do last month that meant a lot?', opts: ['Placed a big order', 'Gave a referral', 'Asked for a refund', 'Left a complaint'], a: 1, why: '细节题：原文 "your referral last month meant a lot"。referral = 转介绍，是外贸客户维护高频词。' },
        { q: 'What does "take it for granted" mean?', opts: ['Value it deeply', 'Assume it without appreciation', 'Forget it', 'Return it'], a: 1, why: '习语题：take ... for granted = 想当然、不珍惜。前面有 never，表示"从不视之为理所当然"。' }
      ],
      speak: [
        { cn: '信任需要时间建立。', target: 'Trust takes time to build.' },
        { cn: '感谢你的忠诚与支持。', target: 'Thank you for your loyalty and support.' },
        { cn: '希望保持联系。', target: 'Let us keep in touch.' }
      ]
    }
  ];

  const GRAMMAR = [
    { title: '情态动词表委婉请求', rule: 'Could you / Would you + 动词原形，比 Can you 更礼貌，适合商务邮件与询盘。', tip: '写邮件提要求时，优先用 Could you send us...? 而不是 Send me...' },
    { title: '条件句表让步与结果', rule: 'If + 一般现在时, will + 动词原形（真实条件句）；If you increase the volume, we will...', tip: '谈判中用来给出交换条件：If you..., we can/will...' },
    { title: 'so...that 与 so 表结果', rule: 'so + adj/adv + that 从句；也可用", so + 句子"表示结果。', tip: '写因果句：The margin is thin, so the price is firm.' },
    { title: '被动语态在商务中的应用', rule: 'be + 过去分词：The goods are shipped on Friday. 强调动作本身而非执行者。', tip: '描述流程、发货、验货时用被动语态更专业。' },
    { title: '时间状语与介词', rule: 'by + 时间点（截止）、within + 时间段（之内）、after + 时间点（之后）。', tip: 'finalize by Friday / resolve within 48 hours / after clearance' },
    { title: '高频商务习语', rule: 'on the same page（意见一致）、meet halfway（各让一步）、win-win（双赢）、circle back（稍后再议）。', tip: '口语演练中主动使用，能显著提升地道感。' },
    { title: '名词化结构', rule: '用名词替代动词让表达更正式：make a decision → reach a decision；we improved → improvement。', tip: '写邮件正文时适当名词化，语气更专业克制。' },
    { title: '异议与转折表达', rule: 'However / Nevertheless / Although 引导让步。However 后常加逗号。', tip: '先肯定再转折：We can be flexible on design. However, the price is firm.' }
  ];

  /** 用预生成的 mp3 播放音频，兼容所有浏览器（含小米自带浏览器） */
  function speak(text) {
    const map = global.AUDIO_MAP || {};
    const file = map[text];
    if (file) {
      const audio = new Audio('audio/' + file);
      audio.play().catch(() => {});
      return;
    }
    // 降级：尝试系统语音合成
    if ('speechSynthesis' in window) {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; u.rate = 0.92;
        speechSynthesis.speak(u);
        return;
      } catch (e) {}
    }
    if (global.App && App.toast) App.toast('这句暂时没有音频，换 Chrome 浏览器可朗读');
  }

  global.EnglishContent = { WORDS, SCENARIOS, GRAMMAR, W, speak };
})(window);
