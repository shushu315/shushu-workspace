/* 词典增强层：全站即点词卡的数据源
 * 覆盖：外贸 8 篇场景文章全部实词 + 商务高频词 + 通用高频词。
 * 每条 = 词|音标|词性|中文释义。例句优先取课程词库原句，其余从文章自动匹配。
 */
(function (global) {
  // ===== 大词库：词|音标|词性|释义 =====
  // 覆盖 english-content.js 的文章实词 + 常见商务/通用词，确保全站点词不落空。
  const LEXICON_RAW = `
quote|/kwəʊt/|v./n.|报价；引述；引用
quotation|/kwəʊˈteɪʃn/|n.|报价单；引文
inquiry|/ɪnˈkwaɪəri/|n.|询盘；询问；调查
MOQ|/ˌem əʊ ˈkjuː/|n.缩写|最小起订量（Minimum Order Quantity）
lead time|/ˈliːd taɪm/|n.|交期；生产周期（从下单到交货的时间）
FOB|/ˌef əʊ ˈbiː/|n.缩写|离岸价（Free On Board）
CIF|/ˌsiː aɪ ˈef/|n.缩写|到岸价（成本+保险+运费）
sample|/ˈsɑːmpl/|n./v.|样品；抽样
specification|/ˌspesɪfɪˈkeɪʃn/|n.|规格；说明书
catalog|/ˈkætəlɒɡ/|n.|产品目录；商品册
unit price|/ˈjuːnɪt praɪs/|n.|单价
discount|/ˈdɪskaʊnt/|n./v.|折扣；打折
validity|/vəˈlɪdəti/|n.|有效期；有效性
bulk order|/bʌlk ˈɔːdə/|n.|大批量订单
payment terms|/ˈpeɪmənt tɜːmz/|n.|付款方式；支付条款
price list|/praɪs lɪst/|n.|价格表
request|/rɪˈkwest/|v./n.|请求；要求
available|/əˈveɪləbl/|adj.|可获得的；有货的
detail|/ˈdiːteɪl/|n./v.|细节；详细说明
follow up|/ˈfɒləʊ ʌp/|v./n.|跟进；后续
negotiate|/nɪˈɡəʊʃieɪt/|v.|谈判；协商
negotiation|/nɪˌɡəʊʃiˈeɪʃn/|n.|谈判；协商
margin|/ˈmɑːdʒɪn/|n.|利润空间；边缘；页边
concession|/kənˈseʃn/|n.|让步；妥协
counterpart|/ˈkaʊntəpɑːt/|n.|对方；对手方
terms|/tɜːmz/|n.|条款；条件；术语
volume|/ˈvɒljuːm/|n.|数量；批量；音量；体积
competitive|/kəmˈpetətɪv/|adj.|有竞争力的
acceptable|/əkˈseptəbl/|adj.|可接受的；令人满意的
compromise|/ˈkɒmprəmaɪz/|n./v.|妥协；折中
win-win|/ˌwɪn ˈwɪn/|adj./n.|双赢
budget|/ˈbʌdʒɪt/|n./adj.|预算；经济实惠的
firm|/fɜːm/|adj./n.|坚定的；不可更改的；公司
meet halfway|/miːt ˌhɑːfˈweɪ/|phrase|各让一步；折中
leverage|/ˈliːvərɪdʒ/|v./n.|利用；影响力；杠杆
proposal|/prəˈpəʊzl/|n.|提议；方案
counteroffer|/ˈkaʊntərɒfə/|n.|还盘；反报价
agree on|/əˈɡriː ɒn/|phrase|就…达成一致
flexible|/ˈfleksəbl/|adj.|灵活的；可变的
bottom line|/ˌbɒtəm ˈlaɪn/|n.|底线；最终结果
confirm|/kənˈfɜːm/|v.|确认；证实
deposit|/dɪˈpɒzɪt/|n./v.|定金；存款；存放
production schedule|/prəˈdʌkʃn ˈʃedjuːl/|n.|生产排期
workshop|/ˈwɜːkʃɒp/|n.|车间；工厂；研讨会
quality control|/ˈkwɒləti kənˈtrəʊl/|n.|质量控制（QC）
inspection|/ɪnˈspekʃn/|n.|验货；检验；检查
delay|/dɪˈleɪ/|n./v.|延误；延迟
capacity|/kəˈpæsəti/|n.|产能；容量；能力
raw material|/rɔː məˈtɪəriəl/|n.|原材料
craftsmanship|/ˈkrɑːftsmənʃɪp/|n.|工艺；手艺
sample approval|/ˈsɑːmpl əˈpruːvl/|n.|样品确认
mass production|/mæs prəˈdʌkʃn/|n.|量产；大规模生产
quality standard|/ˈkwɒləti ˈstændəd/|n.|质量标准
defect|/dɪˈfekt/|n.|瑕疵；次品；缺陷
rework|/ˈriːwɜːk/|n./v.|返工；重做
supplier|/səˈplaɪə/|n.|供应商
in stock|/ɪn stɒk/|phrase|有库存
out of stock|/aʊt ɒv stɒk/|phrase|缺货
process|/ˈprəʊses/|n./v.|流程；工序；处理
finalize|/ˈfaɪnəlaɪz/|v.|最终确定；敲定
shipment|/ˈʃɪpmənt/|n.|发货；装运；货物
carrier|/ˈkæriə/|n.|承运商；运输公司
tracking number|/ˈtrækɪŋ ˈnʌmbə/|n.|运单号；快递单号
customs|/ˈkʌstəmz/|n.|海关；关税
invoice|/ˈɪnvɔɪs/|n./v.|发票；开发票
packing list|/ˈpækɪŋ lɪst/|n.|装箱单
delivery|/dɪˈlɪvəri/|n.|交付；送货；递送
warehouse|/ˈweəhaʊs/|n.|仓库
freight|/freɪt/|n./v.|运费；货物；运送
insurance|/ɪnˈʃʊərəns/|n.|保险
bill of lading|/bɪl ɒv ˈleɪdɪŋ/|n.|提单（B/L）
clearance|/ˈklɪərəns/|n.|清关；清除；许可
dispatch|/dɪˈspætʃ/|v./n.|发送；发货；派遣
eta|/ˈiːtɑː/|n.缩写|预计到达时间（Estimated Time of Arrival）
fragile|/ˈfrædʒaɪl/|adj.|易碎的；脆弱的
package|/ˈpækɪdʒ/|n./v.|包装；包裹；打包
consignee|/ˌkɒnsaɪˈniː/|n.|收货人
port|/pɔːt/|n.|港口；端口
container|/kənˈteɪnə/|n.|集装箱；容器
on time|/ɒn taɪm/|phrase|准时；按时
campaign|/kæmˈpeɪn/|n.|营销活动；战役
listing|/ˈlɪstɪŋ/|n.|商品页面；上架；列表
conversion|/kənˈvɜːʃn/|n.|转化；转化率；转换
engagement|/ɪnˈɡeɪdʒmənt/|n.|互动；参与度；订婚
audience|/ˈɔːdiəns/|n.|受众；观众；读者
brand awareness|/brænd əˈweənəs/|n.|品牌知名度
promotion|/prəˈməʊʃn/|n.|促销；推广；晋升
follower|/ˈfɒləʊə/|n.|粉丝；关注者
launch|/lɔːntʃ/|v./n.|发布；上线；推出
highlight|/ˈhaɪlaɪt/|v./n.|强调；突出；亮点
visual|/ˈvɪʒuəl/|adj./n.|视觉的；视觉元素
traffic|/ˈtræfɪk/|n.|流量；交通
content|/ˈkɒntent/|n.|内容；含量
niche|/niːʃ/|n./adj.|小众市场；细分市场；小众的
positioning|/pəˈzɪʃənɪŋ/|n.|定位；摆放
testimonial|/ˌtestɪˈməʊniəl/|n.|客户好评；推荐信；证言
click-through rate|/ˈklɪk θruː reɪt/|n.|点击率（CTR）
retargeting|/riːˈtɑːɡɪtɪŋ/|n.|再营销；重定向广告
influencer|/ˈɪnfluənsə/|n.|达人；网红；影响者
seasonal|/ˈsiːzənl/|adj.|季节性的
agenda|/əˈdʒendə/|n.|议程；日程
recap|/ˈriːkæp/|n./v.|回顾；总结
align|/əˈlaɪn/|v.|对齐；达成一致；排成一行
action item|/ˈækʃn ˈaɪtəm/|n.|行动项；待办事项
stakeholder|/ˈsteɪkhəʊldə/|n.|利益相关方
deadline|/ˈdedlaɪn/|n.|截止日期
brainstorm|/ˈbreɪnstɔːm/|v./n.|头脑风暴；集思广益
decision|/dɪˈsɪʒn/|n.|决定；决策
minutes|/ˈmɪnɪts/|n.|会议纪要；分钟
schedule a call|/ˈʃedjuːl ə kɔːl/|phrase|安排电话会议
circle back|/ˈsɜːkl bæk/|phrase|稍后再讨论；回头再谈
on the same page|/ɒn ðə seɪm peɪdʒ/|phrase|意见一致；达成共识
clarify|/ˈklærəfaɪ/|v.|澄清；阐明
prioritize|/praɪˈɒrətaɪz/|v.|确定优先级；优先考虑
update|/ˌʌpˈdeɪt/|v./n.|更新；汇报
remind|/rɪˈmaɪnd/|v.|提醒；使想起
attendee|/ˌætenˈdiː/|n.|参会者；出席者
wrapping up|/ˈræpɪŋ ʌp/|phrase|收尾；结束
complaint|/kənˈpleɪnt/|n.|投诉；抱怨
refund|/ˈriːfʌnd/|n./v.|退款；退还
replacement|/rɪˈpleɪsmənt/|n.|替换件；更换
feedback|/ˈfiːdbæk/|n.|反馈；意见
resolve|/rɪˈzɒlv/|v.|解决；决定
warranty|/ˈwɒrənti/|n.|保修；保证
damage|/ˈdæmɪdʒ/|n./v.|损坏；损害
claim|/kleɪm/|n./v.|索赔；声称；要求
apology|/əˈpɒlədʒi/|n.|道歉；歉意
satisfaction|/ˌsætɪsˈfækʃn/|n.|满意度；满足
trust|/trʌst/|n./v.|信任；信赖
rapport|/ræˈpɔː/|n.|融洽关系；和谐
loyal|/ˈlɔɪəl/|adj.|忠诚的；忠实的
referral|/rɪˈfɜːrəl/|n.|转介绍；推荐
appreciate|/əˈpriːʃieɪt/|v.|感激；欣赏；重视
partnership|/ˈpɑːtnəʃɪp/|n.|合作关系；合伙
long-term|/ˌlɒŋ ˈtɜːm/|adj.|长期的
milestone|/ˈmaɪlstəʊn/|n.|里程碑
sincere|/sɪnˈsɪə/|adj.|真诚的；诚挚的
keep in touch|/kiːp ɪn tʌtʃ/|phrase|保持联系
priority|/praɪˈɒrəti/|n.|优先级；优先事项
efficient|/ɪˈfɪʃnt/|adj.|高效的；效率高的
schedule|/ˈʃedjuːl/|n./v.|日程；安排；计划
attach|/əˈtætʃ/|v.|附上；附加；系上
regarding|/rɪˈɡɑːdɪŋ/|prep.|关于；至于
according to|/əˈkɔːdɪŋ tuː/|phrase|根据；按照
in addition|/ɪn əˈdɪʃn/|phrase|此外；另外
therefore|/ˈðeəfɔː/|adv.|因此；所以
however|/haʊˈevə/|adv.|然而；不过
recommend|/ˌrekəˈmend/|v.|推荐；建议
suggest|/səˈdʒest/|v.|建议；暗示
ensure|/ɪnˈʃʊə/|v.|确保；保证
improve|/ɪmˈpruːv/|v.|改善；改进；提高
increase|/ɪnˈkriːs/|v./n.|增加；提高
reduce|/rɪˈdjuːs/|v.|减少；降低
consider|/kənˈsɪdə/|v.|考虑；认为
expect|/ɪkˈspekt/|v.|预期；期待
design|/dɪˈzaɪn/|n./v.|设计；图案；构思
solid|/ˈsɒlɪd/|adj./n.|固体的；实心的；纯色的；固体
wood|/wʊd/|n.|木材；木头
wooden|/ˈwʊdn/|adj.|木制的；木头的
dining|/ˈdaɪnɪŋ/|adj./n.|用餐的；进餐；就餐
chair|/tʃeə/|n.|椅子；主席
fair|/feə/|n./adj.|展会；集市；公平的
interested|/ˈɪntrəstɪd/|adj.|感兴趣的；有兴趣的
retailer|/ˈriːteɪlə/|n.|零售商
reasonable|/ˈriːznəbl/|adj.|合理的；公道的
order|/ˈɔːdə/|n./v.|订单；订购；命令；顺序
reply|/rɪˈplaɪ/|n./v.|回复；答复
forward|/ˈfɔːwəd/|adv./adj.|向前；期待（look forward to）
best regards|/best rɪˈɡɑːdz/|phrase|此致敬礼（邮件结尾）
regards|/rɪˈɡɑːdz/|n.|问候；致意（邮件结尾）
dear|/dɪə/|adj.|亲爱的；尊敬的
please|/pliːz/|adv.|请；麻烦
would like|/wʊd laɪk/|phrase|想要；希望（礼貌）
could|/kʊd/|modal|能；可以（can 的过去式，表委婉）
should|/ʃʊd/|modal|应该；应当
receive|/rɪˈsiːv/|v.|收到；接收
received|/rɪˈsiːvd/|v.过去|收到（receive 过去式/过去分词）
send|/send/|v.|发送；寄送
sent|/sent/|v.过去|发送（send 过去式）
know|/nəʊ/|v.|知道；了解
let|/let/|v.|让；允许
like|/laɪk/|v./prep.|喜欢；像
want|/wɒnt/|v.|想要；需要
need|/niːd/|v./n.|需要；必要
help|/help/|v./n.|帮助；帮忙
provide|/prəˈvaɪd/|v.|提供；供应
offer|/ˈɒfə/|v./n.|提供；报价；提议
work|/wɜːk/|v./n.|工作；运作；奏效
working|/ˈwɜːkɪŋ/|adj./v-ing|工作的；起作用的
runs|/rʌnz/|v.|运行；经营（run 第三人称）
run|/rʌn/|v./n.|经营；运行；跑步
starts|/stɑːts/|v.|开始（start 第三人称）
start|/stɑːt/|v./n.|开始；出发
change|/tʃeɪndʒ/|v./n.|改变；更换；零钱
check|/tʃek/|v./n.|检查；核对
checked|/tʃekt/|v.过去|检查过（check 过去式）
charge|/tʃɑːdʒ/|n./v.|费用；收费；充电
charges|/ˈtʃɑːdʒɪz/|n./v.|费用；收费（复数/三单）
cost|/kɒst/|n./v.|成本；花费
costs|/kɒsts/|n./v.|成本；花费（复数/三单）
price|/praɪs/|n./v.|价格；定价
dollar|/ˈdɒlə/|n.|美元
dollars|/ˈdɒləz/|n.|美元（复数）
pieces|/ˈpiːsɪz/|n.|件；个；片（piece 复数）
piece|/piːs/|n.|件；片；块
units|/ˈjuːnɪts/|n.|件；单位（unit 复数）
unit|/ˈjuːnɪt/|n.|单位；件；单元
hundred|/ˈhʌndrəd/|num.|一百
five hundred|/faɪv ˈhʌndrəd/|num.|五百
twenty-five|/ˌtwenti ˈfaɪv/|num.|二十五
forty-eight|/ˌfɔːti ˈeɪt/|num.|四十八
three|/θriː/|num.|三
five|/faɪv/|num.|五
two|/tuː/|num.|二
one|/wʌn/|num./pron.|一；一个
first|/fɜːst/|adv./adj.|首先；第一
day|/deɪ/|n.|天；日子
days|/deɪz/|n.|天（复数）
date|/deɪt/|n./v.|日期；约会
week|/wiːk/|n.|周；星期
month|/mʌnθ/|n.|月；月份
year|/jɪə/|n.|年
friday|/ˈfraɪdeɪ/|n.|星期五
tuesday|/ˈtjuːzdeɪ/|n.|星期二
hours|/ˈaʊəz/|n.|小时（hour 复数）
quick|/kwɪk/|adj.|快速的；迅速的
quickly|/ˈkwɪkli/|adv.|快速地
carefully|/ˈkeəfəli/|adv.|仔细地；小心地
steady|/ˈstedi/|adj.|稳定的；稳固的
steadily|/ˈstedɪli/|adv.|稳步地；稳定地
tight|/taɪt/|adj.|紧的；紧张的；紧密的
thin|/θɪn/|adj.|薄的；细的；稀薄的
short|/ʃɔːt/|adj.|短的；短缺的
full|/fʊl/|adj.|完整的；满的
goods|/ɡʊdz/|n.|货物；商品
good|/ɡʊd/|adj.|好的；优质的
box|/bɒks/|n.|箱子；盒子
fabric|/ˈfæbrɪk/|n.|面料；布料；织物
colors|/ˈkʌləz/|n.|颜色（color 复数）
collection|/kəˈlekʃn/|n.|系列；收藏；收集
photos|/ˈfəʊtəʊz/|n.|照片（photo 复数）
photo|/ˈfəʊtəʊ/|n.|照片
marked|/mɑːkt/|v.过去/adj.|标注；做标记（mark 过去式）
variant|/ˈveəriənt/|n.|变体；变种
shipping|/ˈʃɪpɪŋ/|n./adj.|运输；航运；发货的
short video|/ʃɔːt ˈvɪdɪəʊ/|n.|短视频
videos|/ˈvɪdɪəʊz/|n.|视频（video 复数）
story|/ˈstɔːri/|n.|故事；报道
stories|/ˈstɔːriz/|n.|故事（复数）
tone|/təʊn/|n.|语气；调性；色调
poetic|/pəʊˈetɪk/|adj.|诗意的；文艺的
quiet|/ˈkwaɪət/|adj.|安静的；低调的
luxury|/ˈlʌkʃəri/|n./adj.|奢华；奢侈品；奢华的
loyalty|/ˈlɔɪəlti/|n.|忠诚度；忠诚
pleasure|/ˈpleʒə/|n.|愉快；乐意；乐事
season|/ˈsiːzn/|n.|季节；旺季
granted|/ˈɡrɑːntɪd/|v.过去|认为理所当然（take for granted）
take for granted|/teɪk fɔː ˈɡrɑːntɪd/|phrase|想当然；不珍惜
ahead|/əˈhed/|adv.|向前；在前面；未来
growing|/ˈɡrəʊɪŋ/|adj./v-ing|增长的；成长中的
gained|/ɡeɪnd/|v.过去|获得；增加（gain 过去式）
improved|/ɪmˈpruːvd/|v.过去/adj.|改善的；提高了的（improve 过去式）
updated|/ʌpˈdeɪtɪd/|v.过去/adj.|更新的（update 过去式）
updates|/ʌpˈdeɪts/|n./v.|更新；最新消息
unchanged|/ʌnˈtʃeɪndʒd/|adj.|未改变的；不变的
reliable|/rɪˈlaɪəbl/|adj.|可靠的；可信赖的
include|/ɪnˈkluːd/|v.|包括；包含
included|/ɪnˈkluːdɪd/|v.过去/adj.|包括；已包含
rise|/raɪz/|v./n.|上升；上涨
rising|/ˈraɪzɪŋ/|adj./v-ing|上涨的；上升的
ready|/ˈredi/|adj.|准备好的；就绪的
arrange|/əˈreɪndʒ/|v.|安排；准备
arranged|/əˈreɪndʒd/|v.过去|安排了（arrange 过去式）
planned|/plænd/|v.过去/adj.|计划的；安排好的
planning|/ˈplænɪŋ/|n./v-ing|计划；筹备
plan|/plæn/|n./v.|计划；方案
protect|/prəˈtekt/|v.|保护；保障
value|/ˈvæljuː/|v./n.|珍视；重视；价值
issue|/ˈɪʃuː/|n./v.|问题；事项；发布
thoughts|/θɔːts/|n.|想法；看法（thought 复数）
thought|/θɔːt/|n.|想法；思考
within|/wɪˈðɪn/|prep.|在…之内；不超过
before|/bɪˈfɔː/|prep./conj.|在…之前
after|/ˈɑːftə/|prep./conj.|在…之后
through|/θruː/|prep.|通过；穿过
against|/əˈɡenst/|prep.|反对；靠着
about|/əˈbaʊt/|prep./adv.|关于；大约
above|/əˈbʌv/|prep./adv.|在…上方；以上
under|/ˈʌndə/|prep.|在…下面；在…过程中
into|/ˈɪntuː/|prep.|进入；到…里
from|/frɒm/|prep.|从；来自
with|/wɪð/|prep.|和；用；带有
without|/wɪˈðaʊt/|prep.|没有；不带有
also|/ˈɔːlsəʊ/|adv.|也；而且
already|/ɔːlˈredi/|adv.|已经
still|/stɪl/|adv./adj.|仍然；静止的
never|/ˈnevə/|adv.|从不；绝不
once|/wʌns/|adv./conj.|一旦；曾经；一次
here|/hɪə/|adv.|这里；在这里
there|/ðeə/|adv.|那里；在那里
today|/təˈdeɪ/|adv./n.|今天
tomorrow|/təˈmɒrəʊ/|adv./n.|明天
again|/əˈɡen/|adv.|再次；又一次
together|/təˈɡeðə/|adv.|一起；共同
here is|/hɪər ɪz/|phrase|这是；给您（递东西）
looking forward|/ˈlʊkɪŋ ˈfɔːwəd/|phrase|期待（look forward to）
thank|/θæŋk/|v.|感谢
thanks|/θæŋks/|n.|谢谢；感谢
sincerely|/sɪnˈsɪəli/|adv.|真诚地（邮件结尾）
warm regards|/wɔːm rɪˈɡɑːdz/|phrase|温暖的问候（邮件结尾）
team|/tiːm/|n.|团队；小组
brand|/brænd/|n.|品牌
market|/ˈmɑːkɪt/|n.|市场；集市
small|/smɔːl/|adj.|小的；小规模的
new|/njuː/|adj.|新的；新近的
news|/njuːz/|n.|消息；新闻
last|/lɑːst/|adj./v.|上一个；最后的；持续
meant|/ment/|v.过去|意味着（mean 过去式）
mean|/miːn/|v./adj.|意味着；意思是；吝啬的
lot|/lɒt/|n.|很多；大量（a lot）
a lot|/ə lɒt/|phrase|很多；非常
most|/məʊst/|adj./adv.|大多数；最
many|/ˈmeni/|adj.|许多（修饰可数）
much|/mʌtʃ/|adj./adv.|许多（修饰不可数）；非常
some|/sʌm/|adj./pron.|一些；某些
any|/ˈeni/|adj./pron.|任何；一些
each|/iːtʃ/|adj./pron.|每个；各自
every|/ˈevri/|adj.|每个；每一
other|/ˈʌðə/|adj./pron.|其他的；另一个
another|/əˈnʌðə/|adj./pron.|另一个；又一个
same|seɪm|adj.|相同的；同样的
different|/ˈdɪfrənt/|adj.|不同的；各种的
own|/əʊn/|adj./v.|自己的；拥有
our|/ˈaʊə/|pron.|我们的
your|/jɔː/|pron.|你的；你们的
their|/ðeə/|pron.|他们的
his|/hɪz/|pron.|他的
her|/hɜː/|pron.|她的；她
its|/ɪts/|pron.|它的
my|/maɪ/|pron.|我的
we|/wiː/|pron.|我们
you|/juː/|pron.|你；你们
they|/ðeɪ/|pron.|他们
our brand|/ˈaʊə brænd/|phrase|我们的品牌
us|/ʌs/|pron.|我们（宾格）
me|/miː/|pron.|我（宾格）
it|/ɪt/|pron.|它
this|/ðɪs/|pron./adj.|这个
that|/ðæt/|pron./conj.|那个；引导从句
these|/ðiːz/|pron.|这些
those|/ðəʊz/|pron.|那些
and|/ænd/|conj.|和；并且
but|/bʌt/|conj.|但是；然而
or|/ɔː/|conj.|或者；否则
if|/ɪf/|conj.|如果；是否
so|/səʊ/|conj./adv.|所以；如此
because|/bɪˈkɒz/|conj.|因为
although|/ɔːlˈðəʊ/|conj.|虽然；尽管
as|/æz/|conj./prep.|作为；因为；当…时
at|/æt/|prep.|在（某时刻/地点）
in|/ɪn/|prep.|在…里；在（某月/年）
on|/ɒn/|prep.|在…上；在（某天）
by|/baɪ/|prep.|在…之前；通过；被
for|/fɔː/|prep.|为了；给；持续
of|/ɒv/|prep.|…的；关于
to|/tuː/|prep.|到；向；给
is|/ɪz/|v.|是（be 第三人称）
are|/ɑː/|v.|是（be 复数）
was|/wɒz/|v.过去|是（am/is 过去式）
were|/wɜː/|v.过去|是（are 过去式）
be|/biː/|v.|是；成为
been|/biːn/|v.过去分词|是；曾经（be 过去分词）
am|/æm/|v.|是（be 第一人称）
has|/hæz/|v.|有（have 第三人称）
have|/hæv/|v.|有；拥有
had|/hæd/|v.过去|有（have 过去式）
do|/duː/|v.|做；助动词
does|/dʌz/|v.|做（do 第三人称）
did|/dɪd/|v.过去|做（do 过去式）
can|/kæn/|modal|能；可以
will|/wɪl/|modal|将；会；愿意
may|/meɪ/|modal|可以；可能
must|/mʌst/|modal|必须；一定
cannot|/ˈkænɒt/|modal|不能；无法
not|/nɒt/|adv.|不；没有
no|/nəʊ/|adj./adv.|没有；不
yes|/jes/|adv.|是的
than|/ðæn/|conj./prep.|比；超过
too|/tuː/|adv.|也；太；过于
very|/ˈveri/|adv.|非常；很
just|/dʒʌst/|adv.|刚刚；只是；正好
only|/ˈəʊnli/|adv./adj.|只；仅仅；唯一的
even|/ˈiːvn/|adv.|甚至；即使
quite|/kwaɪt/|adv.|相当；很；完全
really|/ˈrɪəli/|adv.|真正地；确实
such|/sʌtʃ/|adj./pron.|这样的；如此的
well|/wel/|adv./adj.|好；健康地； wells
back|/bæk/|adv./n.|回来；背部；后退
up|/ʌp/|adv./prep.|向上；起来
down|/daʊn/|adv./prep.|向下；下来
out|/aʊt/|adv./prep.|出去；外面
off|/ɒf/|adv./prep.|离开；关闭
over|/ˈəʊvə/|prep./adv.|在…上方；结束；超过
again and again|/əˈɡen ənd əˈɡen/|phrase|反复；一再
a|/ə/|art.|一个；一（不定冠词）
an|/æn/|art.|一个（用于元音前的不定冠词）
the|/ðə/|art.|这个；那个（定冠词）
i|/aɪ/|pron.|我
build|/bɪld/|v.|建造；建立；打造
builds|/bɪldz/|v.|建造（build 三单）
built|/bɪlt/|v.过去/adj.|建造（build 过去式）；-built 合成的
call|/kɔːl/|n./v.|电话；通话；呼叫；安排（schedule a call）
action|/ˈækʃn/|n.|行动；动作（action item 行动项）
address|/əˈdres/|n./v.|地址；-address 处理；演讲
approval|/əˈpruːvl/|n.|批准；认可（sample approval 样品确认）
aligned|/əˈlaɪnd/|adj./v.过去|对齐的；达成一致的（align 过去式）
arrived|/əˈraɪvd/|v.过去|到达（arrive 过去式）
attached|/əˈtætʃt/|adj./v.过去|附上的；附加的（attach 过去式）
awareness|/əˈweənəs/|n.|意识；知名度（brand awareness 品牌知名度）
best|/best/|adj./adv.|最好的；最（good/well 最高级）
bill|/bɪl/|n.|账单；单据；票据（bill of lading 提单）
bulk|/bʌlk/|n./adj.|大量；大批的（bulk order 大批量订单）
commercial|/kəˈmɜːʃl/|adj./n.|商业的；商务的（commercial invoice 商业发票）
confirmed|/kənˈfɜːmd/|v.过去/adj.|已确认的（confirm 过去式）
control|/kənˈtrəʊl/|n./v.|控制；管理（quality control 质控）
cooperated|/kəʊˈɒpəreɪtɪd/|v.过去|合作（cooperate 过去式）
damaged|/ˈdæmɪdʒd/|adj./v.过去|损坏的（damage 过去式）
drive|/draɪv/|v./n.|驱动；带来；驾驶（drive traffic 带来流量）
emma|/ˈemə/|n.专有|艾玛（客户名字）
finalized|/ˈfaɪnəlaɪzd/|v.过去/adj.|敲定的；最终确定的（finalize 过去式）
follow|/ˈfɒləʊ/|v.|跟随；关注；遵循（follow up 跟进）
followers|/ˈfɒləʊəz/|n.|粉丝；关注者（复数）
go|/ɡəʊ/|v.|去；进行
halfway|/ˌhɑːfˈweɪ/|adv./adj.|半路；中途（meet halfway 各让一步）
hamburg|/ˈhæmbɜːɡ/|n.专有|汉堡（德国港口城市）
hi|/haɪ/|int.|嗨；你好
hope|/həʊp/|v./n.|希望；期待
ideas|/aɪˈdɪəz/|n.|想法；主意（idea 复数）
item|/ˈaɪtəm/|n.|项目；单品；条款
items|/ˈaɪtəmz/|n.|项目；单品（复数）
keep|/kiːp/|v.|保持；保留；继续
lading|/ˈleɪdɪŋ/|n.|装货；装载（bill of lading 提单）
launches|/lɔːntʃɪz/|v.|发布；推出（launch 三单）
lead|/liːd/|v./n.|引导；领先；铅（lead time 交期）
list|/lɪst/|n./v.|清单；列表；列出（price list 价格表）
looking|/ˈlʊkɪŋ/|v-ing|看；期待（looking forward 期待）
love|/lʌv/|v./n.|喜爱；爱
make|/meɪk/|v.|做；制作；使得
mass|/mæs/|n./adj.|大量；大众的（mass production 量产）
material|/məˈtɪəriəl/|n./adj.|材料；原料；物质的（raw material 原材料）
meet|/miːt/|v.|满足；会面；遇见
meeting|/ˈmiːtɪŋ/|n.|会议；会面
milestones|/ˈmaɪlstəʊnz/|n.|里程碑（复数）
next|/nekst/|adj./adv.|下一个；然后；紧接着
number|/ˈnʌmbə/|n.|号码；数字；数量（tracking number 运单号）
packaging|/ˈpækɪdʒɪŋ/|n.|包装；包装材料
packing|/ˈpækɪŋ/|n./adj.|打包；包装的（packing list 装箱单）
page|/peɪdʒ/|n.|页；页面
production|/prəˈdʌkʃn/|n.|生产；制作
progress|/ˈprəʊɡres/|n./v.|进度；进展
quality|/ˈkwɒləti/|n./adj.|质量；品质；高质量的
rate|/reɪt/|n./v.|比率；费率；评价（conversion rate 转化率）
raw|/rɔː/|adj.|原始的；未加工的（raw material 原材料）
relationship|/rɪˈleɪʃnʃɪp/|n.|关系；客户关系
shenzhen|/ˌʃenˈdʒen/|n.专有|深圳（中国港口城市）
shifts|/ʃɪfts/|n./v.|班次；轮班；转变（run two shifts 两班倒）
shushu|/ˈʃuːʃuː/|n.专有|树树（品牌/人名）
solution|/səˈluːʃn/|n.|解决方案；解答
sorry|/ˈsɒri/|adj.|抱歉的；遗憾的
spring|/sprɪŋ/|n.|春天；春季；弹簧
strict|/strɪkt/|adj.|严格的；严厉的
support|/səˈpɔːt/|v./n.|支持；支撑
take|/teɪk/|v.|拿；花费；采取（take for granted 想当然）
takes|/teɪks/|v.|拿；花费（take 三单）
third-party|/ˌθɜːd ˈpɑːti/|adj.|第三方的（third-party inspection 第三方验货）
time|/taɪm/|n.|时间；时候；次数
touch|/tʌtʃ/|n./v.|联系；触碰（keep in touch 保持联系）
tracking|/ˈtrækɪŋ/|n./adj.|追踪；跟踪的（tracking number 运单号）
truly|/ˈtruːli/|adv.|真正地；由衷地
warm|/wɔːm/|adj.|温暖的；热情的（warm regards 温暖问候）
would|/wʊd/|modal.|将；会；愿意（will 过去式，表委婉）
wrap|/ræp/|v.|包裹；结束（wrap up 收尾）
wrapping|/ˈræpɪŋ/|n./v-ing|收尾；包裹（wrapping up 结束）
accept|/əkˈsept/|v.|接受；认可
all|/ɔːl/|adj./pron./adv.|全部；所有的；完全
`;

  // ===== 解析大词库 =====
  const LEX = {};
  LEXICON_RAW.split('\n').forEach(line => {
    const s = line.trim();
    if (!s) return;
    const parts = s.split('|');
    if (parts.length < 4) return;
    const w = parts[0].trim().toLowerCase();
    if (!w) return;
    LEX[w] = { word: parts[0].trim(), phonetic: parts[1].trim(), pos: parts[2].trim(), zh: parts[3].trim() };
  });

  // ===== 常用搭配 =====
  const COLLOCATIONS = {
    'quote': ['send us a quote', 'quote a price', 'quote for 500 units'],
    'inquiry': ['receive an inquiry', 'inquiry from a buyer'],
    'sample': ['provide a free sample', 'sample approval', 'order a sample'],
    'discount': ['a 5% discount', 'offer a discount', 'bulk discount'],
    'negotiate': ['negotiate the price', 'negotiate terms'],
    'margin': ['a thin margin', 'profit margin'],
    'lead time': ['the lead time is', 'shorten the lead time'],
    'confirm': ['confirm the order', 'confirm the details'],
    'deposit': ['pay a deposit', '30% deposit'],
    'quality control': ['strict quality control'],
    'shipment': ['the shipment is ready', 'arrange the shipment'],
    'delivery': ['on-time delivery', 'delivery date'],
    'invoice': ['commercial invoice', 'send the invoice'],
    'tracking number': ['send the tracking number'],
    'campaign': ['launch a campaign', 'spring campaign'],
    'conversion': ['conversion rate', 'improve conversion'],
    'traffic': ['drive traffic', 'website traffic'],
    'agenda': ['go through the agenda'],
    'deadline': ['meet the deadline', 'miss the deadline'],
    'feedback': ['customer feedback', 'thank you for your feedback'],
    'refund': ['a full refund', 'issue a refund'],
    'warranty': ['under warranty'],
    'trust': ['build trust', 'earn trust'],
    'referral': ['give a referral'],
    'appreciate': ['appreciate your support', 'appreciate your time'],
    'design': ['design fair', 'finalize the design', 'packaging design'],
    'reasonable': ['a reasonable price', 'a reasonable discount'],
    'order': ['place an order', 'confirm the order'],
    'price': ['unit price', 'a firm price', 'lower the price'],
    'quality': ['quality control', 'quality standard'],
    'interest': ['be interested in', 'show interest'],
    'forward': ['look forward to your reply'],
    'value': ['value the partnership', 'add value']
  };

  // ===== 易混词 =====
  const CONFUSE = {
    'quote': ['quotation（报价单，名词）', 'quota（配额）'],
    'sample': ['example（例子）', 'specimen（标本）'],
    'discount': ['discount（折扣）vs. count（计数）'],
    'delivery': ['delivery（交付）vs. delivery time（送达时间）'],
    'shipment': ['shipment（发货/货物）vs. shipping（运输方式）'],
    'invoice': ['invoice（发票）vs. receipt（收据）'],
    'price': ['price（价格）vs. prize（奖品）'],
    'prize': ['prize（奖品）vs. price（价格）'],
    'accept': ['accept（接受）vs. except（除了）'],
    'affect': ['affect（影响，动词）vs. effect（效果，名词）'],
    'efficient': ['efficient（高效的）vs. effective（有效的）'],
    'ensure': ['ensure（确保）vs. insure（投保）'],
    'recommend': ['recommend（推荐，动词）vs. suggestion（建议，名词）'],
    'deadline': ['deadline（截止日）vs. schedule（日程）'],
    'feedback': ['feedback（反馈）vs. comment（评论）'],
    'design': ['design（设计）vs. devise（设计/策划，动词）'],
    'fair': ['fair（展会；公平的）vs. fare（车费）'],
    'wood': ['wood（木材）vs. would（will 的过去式）'],
    'discreet': ['discreet（谨慎的）vs. discrete（离散的）']
  };

  // ===== 从 EnglishContent.WORDS 建例句索引（取课程原句，最贴合学习内容）=====
  let EX_INDEX = null;
  function buildExampleIndex() {
    const map = {};
    const WORDS = (global.EnglishContent && global.EnglishContent.WORDS) || [];
    WORDS.forEach(w => {
      if (!w || !w.en) return;
      w.en.toLowerCase().split(/\s+/).forEach(k => { if (!map[k]) map[k] = w.ex; });
      if (!map[w.en.toLowerCase()]) map[w.en.toLowerCase()] = w.ex;
    });
    return map;
  }
  // 从文章里找含该词的句子作例句（保底）
  function sentenceFromArticles(word) {
    const SC = (global.EnglishContent && global.EnglishContent.SCENARIOS) || [];
    const re = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    for (let i = 0; i < SC.length; i++) {
      const text = (SC[i].articleEN || '').replace(/\s+/g, ' ');
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      for (const sent of sentences) {
        if (re.test(sent) && sent.trim().length <= 180) return sent.trim();
      }
    }
    return '';
  }

  function esc(s) { return String(s == null ? '' : s); }

  function guessPos(word) {
    const w = word.toLowerCase();
    if (LEX[w]) return LEX[w].pos;
    if (/ing$/.test(w)) return 'v.-ing / n.';
    if (/ed$/.test(w)) return 'v.-ed / adj.';
    if (/(tion|sion|ment|ness|ity|ance|ence|ship|age)$/.test(w)) return 'n.';
    if (/(ous|ful|less|able|ible|ive|al|ic|ish)$/.test(w)) return 'adj.';
    if (/ly$/.test(w)) return 'adv.';
    if (/(ize|ise|ate|ify)$/.test(w)) return 'v.';
    if (/s$/.test(w) && w.length > 3) return 'n.(pl.) / v.';
    return '词性见例句';
  }

  /** 查词：返回 { word, zh, pos, phonetic, examples, collocations, confuse, known } */
  function lookup(rawWord) {
    if (!EX_INDEX) EX_INDEX = buildExampleIndex();
    const clean = esc(rawWord).replace(/^[^A-Za-z]+|[^A-Za-z'-]+$/g, '').trim();
    const key = clean.toLowerCase();
    const entry = LEX[key];
    let zh = entry ? entry.zh : '';
    let examples = [];
    // 例句：优先课程原句 → 文章句子 →  compounding
    if (EX_INDEX[key]) examples.push(EX_INDEX[key]);
    if (!examples.length) {
      const s = sentenceFromArticles(key);
      if (s) examples.push(s);
    }
    return {
      word: clean,
      zh: zh,
      pos: entry ? entry.pos : guessPos(key),
      phonetic: entry ? entry.phonetic : '',
      examples: examples,
      collocations: COLLOCATIONS[key] || [],
      confuse: CONFUSE[key] || [],
      known: !!entry || !!EX_INDEX[key]
    };
  }

  /** 把一段英文文本切成可点击的单词 span（保留标点与空格） */
  function clickableHTML(text) {
    return esc(text).replace(/([A-Za-z][A-Za-z'-]*)/g, (m) =>
      `<span class="dict-word" data-word="${m.toLowerCase()}">${m}</span>`);
  }

  global.Dictionary = { lookup, clickableHTML, LEX, PHONETIC: {}, POS_OVERRIDE: {} };
})(window);
