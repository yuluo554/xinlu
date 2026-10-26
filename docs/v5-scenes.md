# v5-M3'''' · 语义配图层（D9）逐张对文案留痕

> 依据 [plan/v5/02 §九](../plan/v5/02-数据与口径.md)（D9 口径）与 [plan/10 §五](../plan/10-5.0优化方案.md)。
> 判据单源 = [src/data/scene-map.json](../src/data/scene-map.json)（映射表）与 `assets/web-ready/scenes/`（图库实物）。
> 机检 = validate 的 `S` 区（标签 ≥16 类 / 每类 ≥2 张 / 实物在位 / 无孤儿图 / keyTag 无死键 / 覆盖 ≥60%）
> + `src/ui/scenes.test.ts`（取图稳定 + 无死图 + 覆盖复算）。本档是**逐张对文案**的人工留痕。
> 重跑本档：`node tools/v5-scenes-doc.mjs`（表格从数据实算，不手抄）。

## §一、路线与偏离（实测记录）

| 项 | plan 原口径 | 本轮落地 | 依据 |
|---|---|---|---|
| 素材来源 | CC0/公版照片（WebP ≤40KB/张，40–60 张） | **自产 CC0 单色线稿 SVG（55 张 / 21 类）** | 本机实测：Wikimedia/Openverse 不通，Pexels/Pixabay 只有 CDN 直连、无法核验画面与许可 → 照片路线的 provenance 无法逐张证真；且照片 WebP 实测 4.3KB/张 × 48 ≈ 207KB，超当时的预算余量（104KB）。自产沿 v4 `stage-scenes` 先例（自产 CC0 剪影）：许可零风险、可逐张留痕、≈0.7KB/张 |
| 覆盖算法 | 事件 `sceneTag` 字段 | **objectKey → 语义标签** | v4-M3''' 已按「文本核心物件 ⊆ objectKey」逐条核过全部事件的图标（`docs/v4-M3-icons.md`），从 objectKey 派生是可核查的事实。直接跑文本关键词会得出「99.3% 覆盖」，但每条都是最近似猜测——本轮先试过那种做法，弃用。实测 81.0% |
| 取图 | 未定 | 同标签多张变体按事件 id 的**哈希高位**轮换（同 id 恒同图） | 低比特取模与事件 id 尾部强相关：实测 rain 的 3 条事件全落同一张、meal 的 4 条撞 3 张（`scenes.test.ts` 的死图门即为此而立）。v5-M6 修配图时又踩到同理的坑：funeral 只剩 3 条事件、2 张图在哈希下必死 1 张 → 补第 3 张 |
| 分类粒度 | 首批 16 类 | **21 类**（v5-M3''''：多出 `outdoors 户外` / `meal 饭桌` / `relic 旧物`；**v5-M6：新增 `pet 宠物` / `toy 玩物` / `media 影音` / `music 器乐`，退役 `night 夜色` / `meal 饭桌`**） | 目检抓到真错配：办健身卡配「病房」、公园打拳配「病房」、徒弟开厂配「家门」——场景类目不够细就会硬塞。v5-M6 SI-001 同理：宠物/玩物/影音/器乐图标没有可归的类时被硬塞进 `study`（书桌），补齐四类后「这张卡在说什么」才对得上 |
| 未覆盖 | 显式豁免 | 同：不渲染配图、不留空框 | 豁免 56 条，见 §三 |

## §二、图库与逐张对文案（55 张 / 21 类）

图库总览（同一套画法：400×140、单主体居中、描边与填充走 CSS 变量随四主题联动）：
[docs/assets/v5-scenes-sheet.png](assets/v5-scenes-sheet.png)（重跑命令：`node tools/v5-scenes-sheet.mjs`）。

**构图纪律（第一版踩过）**：第一版每张右侧堆了三个无意义方框当「背景建筑」，55 张看起来几乎一样（总览目检一眼看出）。现在**一张只有一个主体**、居中放大——「这张卡在说什么」要一眼看得出来。

### home · 家

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `home-threshold.svg` | 9 | youth-017「表哥家孩子上学差一笔钱。家庭会议开到一半，长辈们说着说着，所有人都在看你。饭桌上…」<br>youth-501「毕业合租，你挑了阿澈。两周后发现：那位的袜子会飞过客厅，你的锅从来不洗。合租房是…」 |
| `home-courtyard.svg` | 3 | infant-011「摇篮上方的彩色转铃慢悠悠地转。你盯着它看，目光跟着那圈颜色走，伸手去够，够不着。…」<br>elder-002「一场小病之后，儿女认真和你谈了一次：要不要卖掉老房子，搬去和他们同住？这个决定，…」 |
| `home-bedroom.svg` | 5 | toddler-012「全幼儿园都在午睡。你睁着眼睛数天花板，一点睡意都没有。南方的午后蝉声又密又长，北…」<br>youth-005「家里把攒了半辈子的首付拍在你面前，条件只有一个：买在离家近的地方。而你心仪的小区…」 |
| `home-window.svg` | 2 | infant-001「你睁开眼，世界是一片模糊的暖色。摇篮上方挂着一只会转的布偶铃，拧紧发条就叮叮咚咚…」<br>infant-005「大人们商量了几晚，决定让你自己睡了。小床摆在原来那张大床旁边，蚊帐的钩子白天挂起…」 |

### kitchen · 厨房

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `kitchen-stove.svg` | 3 | infant-004「饭桌上第一次给你分点心，你手里那块最大。搪瓷缸里的米汤冒着热气，煤炉上坐着的壶滋…」<br>childhood-012「妈妈重感冒躺了一天，家里静得反常。你踮脚摸着她的额头，烫得吓人；学着大人的样子倒…」 |
| `kitchen-table.svg` | 8 | elder-012「菜场的王婶每次都多给你抓一把葱，你每次都说不用不用。菜场六点开市，水泥台子上的水…」<br>infant-101「妈妈把一本布书递到你面前，翻开一页是红苹果。她指一下念一个字，你的手比耳朵快。布…」 |
| `kitchen-vegetables.svg` | 7 | youth-011「合租房的室友作息和你完全错开：你睡他起，你起他睡。厨房的冰箱成了两个世界的分界线…」<br>midlife-011「年度体检，报告比往年厚了两页。医生圈出两行字，抬头看你：能管住嘴吗？诊室的窗口对…」 |

### school · 校园

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `school-gate.svg` | 1 | midlife-201「公司新一轮调整，年轻领导直接管到了你头上。会上他讲的新词，你一半没听过。会议室的…」 |
| `school-field.svg` | 5 | childhood-001「新学期班会，班主任在黑板上写下班干部竞选几个字，粉笔灰簌簌地落。教室里嗡的一声议…」<br>childhood-002「期中卷子发下来，你考了全班第一。放学的路忽然变得特别短。卷子上老师用红笔写了个大…」 |
| `school-corridor.svg` | 4 | toddler-004「幼儿园第一天，教室门在你身后关上。里面全是陌生的小椅子，和一股饭菜混着皂角的气味…」<br>childhood-015「全校广播操比赛，你被排在队伍最前排——领操位。为了这个位置，体育老师把你留下来单…」 |

### classroom · 教室

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `classroom-blackboard.svg` | 5 | youth-012「凌晨一点的写字楼只剩你这层的灯。方案改到第七版，甲方还是那三个字：再看看。整层楼…」<br>adult-003「孩子的成绩单和你的加薪通知同一天到。饭桌上，家里为报不报补习班吵成一团，孩子的房…」 |
| `classroom-desks.svg` | 4 | toddler-002「家里给你买了一盒崭新的蜡笔，十二色，笔杆上带着文具店的气味。雪白的墙在你看来是一…」<br>infant-019「大人把一套认色卡片在你面前一字排开，按顺序教：红、黄、蓝。卡片是印刷厂的边角料裁…」 |
| `classroom-paper.svg` | 7 | infant-014「抓周那天，炕桌上摆着笔、算盘、听诊器、面团和一只红色小皮球。大人们屏住呼吸看你爬…」<br>teen-016「暑假你发了两周传单。站在街口，太阳很毒，接过传单的人十不存一。纸是印厂最薄的纸，…」 |

### street · 街巷

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `street-alley.svg` | 3 | toddler-016「超市里你只是转身看了一眼货架，回头，家人的蓝色外套消失在人群里。货架上的汽水码得…」<br>teen-003「高考志愿提交前的最后一晚。志愿表第一栏空着——是留在离家两小时车程的省内，还是去…」 |
| `street-shopfront.svg` | 7 | elder-023「老宅拆迁在即。儿女把两份安置方案放到桌上：A 套朝南带电梯，一切稳妥；B 套在老…」<br>childhood-201「班里组织跳蚤市场，你翻箱倒柜凑了一批不要的玩具。定价是门新学问。摊位是课桌拼的，…」 |
| `street-crossing.svg` | 4 | toddler-017「你第一次被派去买东西。攥着钱走到小卖部门口，把要买的东西在心里背了一遍又一遍。这…」<br>youth-203「你做的那条产品线被大公司看中，对方给了两个选择：连人带项目被收购，团队整体并入；…」 |

### station · 车站

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `station-platform.svg` | 3 | midlife-003「孩子的录取通知书到了，学校在两千公里外。你嘴上说好事，手却把行李箱的轮子检查了三…」<br>midlife-019「同学聚会散场前。一半人在比较孩子的成绩单，另一半人围着一台手机，传看一张川西环线…」 |
| `station-luggage.svg` | 1 | toddler-403「爸爸出差一个月。每天晚饭桌上的椅子空着，妈妈给他留的碗你也认得。那几年出远门的人…」 |
| `station-ticket.svg` | 3 | youth-002「公司内推的跨区域项目组向你招手：半年外派，去一个你没去过的地方。消息是午休时到的…」<br>adult-001「部门例会后领导把你留下：有个驻外岗位空缺，待遇翻番，但一去就是三年。办公室的百叶…」 |

### factory · 厂区

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `factory-hall.svg` | 8 | adult-012「新房装修，你和工长在三处细节上谈不拢：插座的位置、灯的色温，还有你坚持要的那个飘…」<br>adult-014「业余木工群要办第一次线下展，群主点你的名：你那套榫卯文具，压轴。你的工房是阳台改…」 |
| `factory-machine.svg` | 3 | toddler-005「你搭了一下午的积木高塔，在最后一块落上去的瞬间哗啦塌了。旁边的小孩哈哈大笑。积木…」<br>midlife-016「你在郊区租了间小木工房，周末去刨刨木头。刨花卷起来的声音，特别好听。工房月租不贵…」 |

### office · 办公

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `office-desk.svg` | 7 | youth-022「大学最野的那个同学找到你，拍着一份商业计划书：我出创意，你管账。成了我们是合伙人…」<br>adult-005「新来的年轻人三个月把你三年的活干得又快又漂亮，会议上领导已经开始问他的意见。你的…」 |
| `office-meeting.svg` | 4 | youth-003「异地第三年，视频里的两个人话越来越少。对方问：总要有一人挪窝，你说呢？这一晚谁都…」<br>midlife-015「物业撤了，小区自管小组在群里@你：维修基金的账你来管吧，就服你。三百户的钱。公告…」 |

### hospital · 医院

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `hospital-ward.svg` | 11 | infant-002「深夜你发起低烧，额头烫得吓人。客厅的灯亮到天明，煤炉封了火又捅开，大人们围着体温…」<br>adult-004「父亲住院那周，你白天在病房陪护，晚上回公司盯系统上线。病房和会议室之间，隔着半座…」 |
| `hospital-corridor.svg` | 1 | infant-401「妈妈要回去上班了。早上她换好外套，蹲在摇篮边跟你说了很久的话，你没听懂，只看见她…」 |
| `hospital-medicine.svg` | 8 | midlife-021「病房里，医生把选择递到你手上：保守治疗回家休养，或者再进一次手术室。父亲拉着你的…」<br>infant-601「疫苗日。针还没碰到胳膊，你先被那股消毒水味整不会了，整张脸皱成了包子。保健站的走…」 |

### market · 市场

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `market-stall.svg` | 8 | childhood-021「数学竞赛开考前，同桌把写着答案的小纸条推到了你卷子旁边。这道题你恰恰不会，而它是…」<br>childhood-022「班主任把装着全班春游费用的信封交到你手上：放你那儿，明早交财务。牛皮纸信封不厚，…」 |
| `market-scales.svg` | 2 | childhood-014「压岁钱在枕头下压了三天，你在文具店和储蓄罐之间反复横跳。五块钱，是一年里最大的一…」<br>elder-003「搬进电梯房之前，你要给老屋做最后一次清点：五十年攒下的物件，一件一件过手。老屋的…」 |

### field · 田野

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `field-rows.svg` | 4 | adult-016「你在阳台搭起了种植箱。第一茬小葱收割那天，全家的汤都香了。种植箱是旧货架改的，土…」<br>elder-016「你把阳台改成小花园：三盆月季、一盆薄荷，还有一把躺椅。花盆是捡来的旧陶盆，土是孙…」 |
| `field-harvest.svg` | 3 | infant-016「你被寄放在外婆家一周。外婆家的院子里有一棵很大很大的树，树下拴着晾衣绳，门后挂着…」<br>toddler-202「楼下小花园，几个邻居家的大孩子用一把小铲子挖「地道」。他们也给你分了一小块地。铲…」 |

### wedding · 婚宴

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `wedding-table.svg` | 6 | youth-013「大学室友结婚，你被拉去当伴郎伴娘。婚礼办在室友的老家，你请了两天假，绿皮车的硬座…」<br>youth-021「三十岁生日那晚，在一起五年的对象把话挑明了：结婚，还是各自再想想？我不想让你为难…」 |
| `wedding-hall.svg` | 5 | toddler-022「六一儿童节的报幕声已经响起，你的节目排在第三个。幕后黑压压坐满了人，你的手心全是…」<br>midlife-013「孙子辈来家里过暑假，把你半辈子的规矩搅了个底朝天。孩子的行李箱里装着平板和游戏卡…」 |

### funeral · 丧事

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `funeral-hall.svg` | 1 | midlife-004「老同学的葬礼上，你数了数，自己是到场的人里年纪最小的一批。回去的路上，你把通讯录…」 |
| `funeral-flowers.svg` | 1 | elder-501「老周走了。追悼会回来，阿澈打来电话，两个人在电话两头沉默了很久。老周是你们俩的下…」 |
| `funeral-candles.svg` | 1 | teen-013「晚自习停电，整栋楼欢呼了一声——黑暗里那声欢呼格外齐。有人点起了蜡烛，有人已经冲…」 |

### rain · 雨雪

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `rain-street.svg` | 1 | toddler-015「下过雨的路上有一个超级完美的水坑，深浅正好，大小正好。柏油路还蒸着雨后的热气，空…」 |
| `rain-umbrella.svg` | 2 | infant-015「下雪了。你第一次看见雪，被裹成一个球抱到院子里。棉裤棉袄一层套一层，雪地白得晃眼…」<br>toddler-602「幼儿园班上一半人在咳嗽。你也没躲过去，烧在家里，窗外是别的小孩的笑声。体温计夹在…」 |

### outdoors · 户外

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `outdoors-park.svg` | 9 | toddler-011「游乐场那个最高最长的滑梯，你仰着头看了很久，楼梯口排着队。滑梯的铁皮被太阳晒得烫…」<br>youth-014「你办了张健身卡。头一个月去了八次，第二个月去了两次。健身房在写字楼地下一层，跑步…」 |
| `outdoors-road.svg` | 10 | infant-003「你被扶着站在堂屋中央，两条腿还在打颤，脚下的水泥地凉得像一块铁。大人松开手退后半…」<br>toddler-001「幼儿园的沙池边，一个高你半头的孩子一把抢走了你挖了很久的塑料铲子。太阳把沙池晒得…」 |

### study · 书桌

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `study-books.svg` | 5 | teen-012「校服背后不知道被谁用马克笔写了一行字，洗了三次都没洗掉。字不大，可你总觉得全班的…」<br>teen-015「你在杂志角落认识了一个笔友，对方在很北很北的城市，字写得像刻出来的。信纸挑了最素…」 |
| `study-lamp.svg` | 9 | childhood-017「你在课桌里发现一张字条，是上次帮你捡橡皮的同桌留的：放学一起走吗？字条是从作业本…」<br>teen-001「文理分科的志愿表发下来。家人围在饭桌上反复念叨：学理，好找工作。可你真正舍不得的…」 |
| `study-writing.svg` | 6 | childhood-016「县图书馆的少儿阅览室有三百本书，你给自己定了个小小的目标。借书证押金两块，妈妈从…」<br>teen-004「你的日记本从书包夹层消失了一天，晚饭时原样放回了原处。你一页页对过——少了一根头…」 |

### relic · 旧物

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `relic-box.svg` | 2 | infant-021「大人们收拾了整整一周的纸箱，屋里忽然空得能听见回声。你熟悉的摇篮、熟悉的院子、熟…」<br>youth-701「宿舍楼下有个收废品的中年人，每天傍晚准时推车来。他认得每一栋楼扔出来的纸箱值多少…」 |
| `relic-photo.svg` | 1 | midlife-014「你开始收拾半辈子的家：三箱奖状、一箱磁带、一箱孩子的小学作业本。奖状的绸面有的已…」 |
| `relic-letter.svg` | 2 | childhood-013「你把爸爸的旧闹钟拆了，桌面上一排整整齐齐的零件——装不回去了。闹钟是爸爸上夜班全…」<br>adult-002「孩子第一次上台表演和家长会排在同一天，而你负责的系统升级也定在当晚上线。日历上这…」 |

### pet · 宠物

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `pet-cat.svg` | 6 | toddler-013「邻居送来一只小兔子，笼子就放在阳台上，大人说归你管。兔子爱吃胡萝卜，小卖部五分钱…」<br>adult-013「陪了孩子十二年的狗在春天走了。它睡过的藤筐还摆在阳台，饭盆里的水早上刚换。孩子第…」 |
| `pet-cage.svg` | 1 | adult-018「孩子把项圈系在自己手腕上，说这样它就还在家里。你蹲下来，看见那块磨平的名牌上还留…」 |

### toy · 玩物

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `toy-jigsaw.svg` | 5 | toddler-014「小客人来家里，看上了你最少玩的那只旧恐龙。妈妈说：送给小客人吧。那只恐龙是夜市上…」<br>childhood-019「兴趣班试听日。家长在围棋班和奥数班之间拿不定主意，蹲下来问你自己想学什么。报名那…」 |
| `toy-gamepad.svg` | 1 | teen-011「周五晚上，同学组局去新开的电玩城，群里接龙接到了你的名字。电玩城开在商城顶层，一…」 |

### media · 影音

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `media-tv.svg` | 6 | teen-005「街舞社在体育馆招新，音响一响你脚底发痒。可下周就是月考，班主任的目光正从教室后窗…」<br>youth-004「猎头的电话打进工位：对面公司薪水涨四成，但要放下你手上带了一半的项目。写字楼的中…」 |
| `media-radio.svg` | 4 | youth-015「又是一个睡不着的凌晨三点。手机屏幕的蓝光照着天花板，你翻了一遍通讯录，没有可以打…」<br>midlife-101「老年活动中心开了一门智能手机摄影课，教室里坐的比你小二十岁。报名表上你的年纪一栏…」 |
| `media-phone.svg` | 4 | infant-017「收音机里在放一支歌。你跟着咿咿呀呀，调子跑了十万八千里。那台收音机是家里最值钱的…」<br>elder-101「孙女的旧平板淘汰下来了。你戴着老花镜研究了三天，学会了视频通话。平板是孙女贴着卡…」 |

### music · 器乐

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `music-guitar.svg` | 3 | elder-005「社区的口述历史活动来招募讲述人，报名表上写着：每人四十分钟。你盯着那行字看了很久…」<br>youth-503「阿澈的婚礼定在五一，点名你当伴郎。可你手头项目正卡在节骨眼上。请柬是手递的，红纸…」 |
| `music-piano.svg` | 4 | midlife-005「整理储藏室，你翻出了年轻时搁下的那把吉他——琴弦锈了，指板上的灰比弦还厚。储藏室…」<br>elder-018「社区记者来采访老人口述栏目，问了一个问题：如果对年轻时的自己说一句话，说什么？记…」 |
| `music-mic.svg` | 1 | childhood-003「家里搬回一台电子琴，附赠一张周一到周日都排满的练习表。琴是攒了大半年才下决心的家…」 |

## §三、显式豁免清单（不配图、不留空框）

覆盖 239/295（81.0%），显式豁免 56 条：

infant-012（mirror-mirror）、infant-013（cherish）、infant-022（meeple-group）、toddler-021（stork-delivery）、childhood-004（choice）、childhood-005（cross-mark）、teen-006（hourglass）、teen-002（shouting）、teen-017（backstab）、adult-015（uncertainty）、adult-021（life-in-the-balance）、midlife-001（crown）、midlife-002（chat-bubble）、teen-019（thought-bubble）、adult-019（diploma）、infant-102（circle）、toddler-101（infinity）、toddler-201（broom）、toddler-203（socks）、teen-101（drama-masks）、youth-102（spy）、adult-202（hidden）、adult-301（tear-tracks）、adult-302（health-decrease）、teen-301（despair）、infant-402（baby-face）、toddler-401（walking-scout）、toddler-402（broken-heart）、childhood-401（heart-necklace）、childhood-402（chewed-heart）、teen-402（love-mystery）、teen-403（tarot-06-the-lovers）、youth-401（heart-wings）、youth-403（opposite-hearts）、adult-403（nested-hearts）、midlife-401（sparkles）、midlife-403（heart-shield）、elder-401（heart-inside）、elder-402（love-song）、elder-403（sunrise）、infant-501（three-friends）、infant-502（图标层已豁免）、toddler-501（blackball）、toddler-502（shaking-hands）、toddler-503（two-shadows）、childhood-503（prank-glasses）、midlife-501（team-idea）、midlife-502（shattered-heart）、midlife-503（sundial）、elder-502（ballerina-shoes）、teen-601（brain-freeze）、midlife-603（cigarette）、infant-701（chat-bubble）、childhood-701（blackball）、teen-701（choice）、elder-703（three-friends）

**豁免的构成**（从数据实算，见 `node tools/v5-scenes-doc.mjs`；曾手写过一版，与数据漂移过——故改为算出来）：

| 构成 | 条数 | 说明 |
|---|---|---|
| `heart-*` 系（情绪符号） | 9 | `broken-heart` / `heart-necklace` / `chewed-heart` / `heart-wings` / `opposite-hearts` / `nested-hearts` / `heart-shield` / `heart-inside` / `shattered-heart`——画的是一颗心，不是某个场景，硬凑成厨房或街巷只会误导 |
| 图标层已豁免（`objectKey: null`） | 1 | `infant-502` |
| 其余抽象符号 / 非场景实物 | 46 | `blackball` ×2 / `chat-bubble` ×2 / `choice` ×2 / `three-friends` ×2 / `baby-face` / `backstab` / `ballerina-shoes` / `brain-freeze` / `broom` / `cherish` / `cigarette` / `circle` / `cross-mark` / `crown` / `despair` / `diploma` / `drama-masks` / `health-decrease` / `hidden` / `hourglass` / `infinity` / `life-in-the-balance` / `love-mystery` / `love-song` / `meeple-group` / `mirror-mirror` / `prank-glasses` / `shaking-hands` / `shouting` / `socks` / `sparkles` / `spy` / `stork-delivery` / `sundial` / `sunrise` / `tarot-06-the-lovers` / `team-idea` / `tear-tracks` / `thought-bubble` / `two-shadows` / `uncertainty` / `walking-scout` |

这些事件继续靠事件图标（Game-Icons，295/295 全覆盖）表达量感，不渲染场景图也**不留空框**。

> **✅ 已修复（v5-M6 · 2026-10-26）**：v5-M5 首查查出的错配（38 键 / 52 条事件 = 17.6%）已按两种处置修完——
> **一级摘出**：情绪/时间/氛围/社交/舞台类抽象符号（13 键：`tear-tracks` / `despair` / `broken-heart` / `shattered-heart` / `two-shadows` / `hourglass` / `sunrise` / `sundial` / `sparkles` / `meeple-group` / `three-friends` / `shaking-hands` / `drama-masks`）从 `keyTag` 删除，事件转显式豁免；
> **二级改挂**：宠物/玩物/影音/器乐等具体物件改挂新建的 `pet` / `toy` / `media` / `music` 四类（`tired-eye`→`home`、`caterpillar`/`star-formation`→`outdoors`），
> 原 `night`（夜色）/ `meal`（饭桌）两类在摘出后事件归零 → 整类连同图稿退役。
> 复算：`keyTag` 里的错配键 **38 → 0**（命中事件 **0** 条）；覆盖 239/295 = **81.0%**；豁免 **56** 条。
> 三级机检：`node tools/v5-scene-audit.mjs`（只读报告，已印「✅ 非场景图标已清零」）+ `tests/scene-misfits.test.ts`（棘轮：这批键再回流 `keyTag` 即判红，快照已收紧到 0）。
> 处置留痕在 [plan/v5/backlog.md](../plan/v5/backlog.md) SI-001（✅）与 [tools/v5-scene-misfits.mjs](../tools/v5-scene-misfits.mjs) 段首注。已映射的 `heart-*` 有 3 个（`heart-organ` / `heart-battery` / `heart-bottle`），它们画的是器官/心电，不属本条错配。

## §四、与其他门的边界

- **预算门**：55 张 SVG 以 `?raw` 内联进 JS bundle，不单独成文件；dist 实测值见 HANDOFF-v5-M4 的当轮留痕。
- **许可门**：全部自产（无第三方素材）；白名单 `assets/web-ready/` 已覆盖 `scenes/`，credits 无需新增署名行。
- **E2E 钩子**：配图节点 = `figure.ev-scene[data-ev-scene]`；豁免事件该节点**不存在**（可机检「不留空框」）。
- **单屏字数**：配图不计入 `validate:story` 的单屏 ≤160 口径（它不占文字量），但**不得顶掉年份戳**——年份戳在配图之上，顺序未变。
