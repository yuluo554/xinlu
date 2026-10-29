# v5.0.2 · 语义配图层（D9）逐张对文案留痕

> 依据 [plan/v5/02 §九](../plan/v5/02-数据与口径.md)（D9 口径）与 [plan/10 §五](../plan/10-5.0优化方案.md)。
> 判据单源 = [src/data/scene-map.json](../src/data/scene-map.json)（映射表）与 `assets/web-ready/scenes/`（图库实物，AVIF）。
> 机检 = validate 的 `S` 区（标签 ≥16 类 / 每类 ≥2 张 / 实物在位 / 无孤儿图 / keyTag 无死键 / 覆盖 ≥60%）
> + `src/ui/scenes.test.ts`（取图稳定 + 无死图 + 覆盖复算）。本档是**逐张对文案**的人工留痕。
> 重跑本档：`node tools/v5-scenes-doc.mjs`（表格从数据实算，不手抄）。

## §一、v5.0.2 换层：线稿 → 具象配图（AVIF）

| 项 | v5.0.x（线稿） | v5.0.2（本版） | 依据 |
|---|---|---|---|
| 画面 | 自产 CC0 单色线稿 SVG，`?raw` 内联进 JS | **AI 生成具象配图，800×280，AVIF 分发** | 素材来源与许可见 [assets/README.md](../assets/README.md)；体积与格式决策见 [docs/v5-M9-scene-webp.md](v5-M9-scene-webp.md) |
| 体积 | 55 张合计 38.8KB 原始 / 19.3KB gzip（内联） | **52 张，分发 AVIF 合计 86.2KB（均匀 crf58）** | 源 WebP 合计 913.3KB（退役 3 张后；此前 55 张为 990.8KB），任何 WebP 画质都压不进 850KB 预算门；AVIF 800×280 全分辨率 crf58 是唯一两全的档位 |
| 预算门 | 850KB | **850KB（未抬）**，实测 dist **844.03KB**（余量 5.97KB） | [plan/v5/00 §决策记录](../plan/v5/00-README总览.md) + [docs/v5-M9-scene-webp.md](v5-M9-scene-webp.md) |
| 引用方式 | 内联 SVG（随 JS 一起到） | `import.meta.glob(?url)` + `<img>` | 每张图独立成文件；`.avif` 强制不内联（Vite 默认把 <4KB 转 base64，会吃 33% 体积） |
| 图库规模 | 55 张 / 21 类 | **52 张 / 20 类**（`funeral` 整类退役，见 §三） | 覆盖 77.3%（口径 ≥60%） |
| 覆盖 | 239/295 = 81.0% | **228/295 = 77.3%** | 语义订正后摘出 7 键 + 退役 1 类；宁可豁免也不给错图（v5.0.1 教训） |

## §二、图库与逐张对文案（52 张 / 20 类）

图库总览：[docs/assets/v5-scenes-sheet.png](assets/v5-scenes-sheet.png)（`node tools/v5-scenes-sheet.mjs`）。

**画面纪律**：一张只有一个主体、居中；400:140 画幅裁切不变（与 v5.0.x 同一构图口径，换的是画法而不是版式）。
下表「用图事件数」由事件库 + 哈希实算，不是手抄。

### home · 家

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `home-threshold.avif` | 11 | youth-017「表哥家孩子上学差一笔钱。家庭会议开到一半，长辈们说着说着，所有人都在看你。饭桌上…」<br>toddler-103「爸爸的旧课本里夹着一张地图，边缘磨得起了毛。你按着地图在客厅里「行军」。课本是爸…」 |
| `home-courtyard.avif` | 6 | infant-011「摇篮上方的彩色转铃慢悠悠地转。你盯着它看，目光跟着那圈颜色走，伸手去够，够不着。…」<br>infant-014「抓周那天，炕桌上摆着笔、算盘、听诊器、面团和一只红色小皮球。大人们屏住呼吸看你爬…」 |
| `home-bedroom.avif` | 5 | toddler-012「全幼儿园都在午睡。你睁着眼睛数天花板，一点睡意都没有。南方的午后蝉声又密又长，北…」<br>youth-005「家里把攒了半辈子的首付拍在你面前，条件只有一个：买在离家近的地方。而你心仪的小区…」 |
| `home-window.avif` | 7 | infant-001「你睁开眼，世界是一片模糊的暖色。摇篮上方挂着一只会转的布偶铃，拧紧发条就叮叮咚咚…」<br>infant-003「你被扶着站在堂屋中央，两条腿还在打颤，脚下的水泥地凉得像一块铁。大人松开手退后半…」 |

### kitchen · 厨房

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `kitchen-stove.avif` | 3 | infant-004「饭桌上第一次给你分点心，你手里那块最大。搪瓷缸里的米汤冒着热气，煤炉上坐着的壶滋…」<br>childhood-012「妈妈重感冒躺了一天，家里静得反常。你踮脚摸着她的额头，烫得吓人；学着大人的样子倒…」 |
| `kitchen-table.avif` | 6 | infant-101「妈妈把一本布书递到你面前，翻开一页是红苹果。她指一下念一个字，你的手比耳朵快。布…」<br>teen-202「暑假同学组队摆摊卖冰粉，你负责原料采购和定价。第一天卖剩一半。摊位是折叠桌加一块…」 |
| `kitchen-vegetables.avif` | 7 | youth-011「合租房的室友作息和你完全错开：你睡他起，你起他睡。厨房的冰箱成了两个世界的分界线…」<br>midlife-011「年度体检，报告比往年厚了两页。医生圈出两行字，抬头看你：能管住嘴吗？诊室的窗口对…」 |

### school · 校园

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `school-gate.avif` | 2 | midlife-201「公司新一轮调整，年轻领导直接管到了你头上。会上他讲的新词，你一半没听过。会议室的…」<br>childhood-502「班里的「核心小组」向你招手，条件是别再跟「那个成绩差的」玩。核心小组的据点在操场…」 |
| `school-field.avif` | 6 | childhood-001「新学期班会，班主任在黑板上写下班干部竞选几个字，粉笔灰簌簌地落。教室里嗡的一声议…」<br>childhood-002「期中卷子发下来，你考了全班第一。放学的路忽然变得特别短。卷子上老师用红笔写了个大…」 |
| `school-corridor.avif` | 4 | toddler-004「幼儿园第一天，教室门在你身后关上。里面全是陌生的小椅子，和一股饭菜混着皂角的气味…」<br>childhood-015「全校广播操比赛，你被排在队伍最前排——领操位。为了这个位置，体育老师把你留下来单…」 |

### classroom · 教室

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `classroom-blackboard.avif` | 4 | adult-003「孩子的成绩单和你的加薪通知同一天到。饭桌上，家里为报不报补习班吵成一团，孩子的房…」<br>youth-019「入职培训第三天。讲师要求每人给自己做三年规划，PPT 第二页必须有带里程碑的时间…」 |
| `classroom-desks.avif` | 4 | toddler-002「家里给你买了一盒崭新的蜡笔，十二色，笔杆上带着文具店的气味。雪白的墙在你看来是一…」<br>infant-019「大人把一套认色卡片在你面前一字排开，按顺序教：红、黄、蓝。卡片是印刷厂的边角料裁…」 |
| `classroom-paper.avif` | 4 | childhood-101「开学发新书，你把每本的书皮都包上了。数学书的书皮纸剩下一条，你叠了只小船。包书皮…」<br>teen-102「中考前最后一节自习课，教室静得能听见笔尖。你的错题本已经翻得起了毛边。粉笔槽里还…」 |

### street · 街巷

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `street-alley.avif` | 3 | toddler-016「超市里你只是转身看了一眼货架，回头，家人的蓝色外套消失在人群里。货架上的汽水码得…」<br>teen-003「高考志愿提交前的最后一晚。志愿表第一栏空着——是留在离家两小时车程的省内，还是去…」 |
| `street-shopfront.avif` | 7 | elder-023「老宅拆迁在即。儿女把两份安置方案放到桌上：A 套朝南带电梯，一切稳妥；B 套在老…」<br>childhood-201「班里组织跳蚤市场，你翻箱倒柜凑了一批不要的玩具。定价是门新学问。摊位是课桌拼的，…」 |
| `street-crossing.avif` | 5 | toddler-017「你第一次被派去买东西。攥着钱走到小卖部门口，把要买的东西在心里背了一遍又一遍。这…」<br>teen-016「暑假你发了两周传单。站在街口，太阳很毒，接过传单的人十不存一。纸是印厂最薄的纸，…」 |

### station · 车站

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `station-platform.avif` | 1 | midlife-003「孩子的录取通知书到了，学校在两千公里外。你嘴上说好事，手却把行李箱的轮子检查了三…」 |
| `station-luggage.avif` | 1 | toddler-403「爸爸出差一个月。每天晚饭桌上的椅子空着，妈妈给他留的碗你也认得。那几年出远门的人…」 |
| `station-ticket.avif` | 3 | youth-002「公司内推的跨区域项目组向你招手：半年外派，去一个你没去过的地方。消息是午休时到的…」<br>adult-001「部门例会后领导把你留下：有个驻外岗位空缺，待遇翻番，但一去就是三年。办公室的百叶…」 |

### factory · 厂区

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `factory-hall.avif` | 7 | adult-012「新房装修，你和工长在三处细节上谈不拢：插座的位置、灯的色温，还有你坚持要的那个飘…」<br>adult-014「业余木工群要办第一次线下展，群主点你的名：你那套榫卯文具，压轴。你的工房是阳台改…」 |
| `factory-machine.avif` | 2 | midlife-016「你在郊区租了间小木工房，周末去刨刨木头。刨花卷起来的声音，特别好听。工房月租不贵…」<br>teen-203「父亲的老朋友开了家小型加工厂，提出让你暑假去「管半个月仓库」，工钱照给，规矩自己…」 |

### office · 办公

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `office-desk.avif` | 7 | youth-022「大学最野的那个同学找到你，拍着一份商业计划书：我出创意，你管账。成了我们是合伙人…」<br>adult-005「新来的年轻人三个月把你三年的活干得又快又漂亮，会议上领导已经开始问他的意见。你的…」 |
| `office-meeting.avif` | 4 | midlife-015「物业撤了，小区自管小组在群里@你：维修基金的账你来管吧，就服你。三百户的钱。公告…」<br>youth-201「实习第一周，师傅把一沓过期的项目档案丢给你：看完，讲讲你看到了什么。档案室在写字…」 |

### hospital · 医院

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `hospital-ward.avif` | 10 | infant-002「深夜你发起低烧，额头烫得吓人。客厅的灯亮到天明，煤炉封了火又捅开，大人们围着体温…」<br>adult-004「父亲住院那周，你白天在病房陪护，晚上回公司盯系统上线。病房和会议室之间，隔着半座…」 |
| `hospital-corridor.avif` | 1 | infant-401「妈妈要回去上班了。早上她换好外套，蹲在摇篮边跟你说了很久的话，你没听懂，只看见她…」 |
| `hospital-medicine.avif` | 8 | midlife-021「病房里，医生把选择递到你手上：保守治疗回家休养，或者再进一次手术室。父亲拉着你的…」<br>infant-601「疫苗日。针还没碰到胳膊，你先被那股消毒水味整不会了，整张脸皱成了包子。保健站的走…」 |

### market · 市场

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `market-stall.avif` | 8 | childhood-022「班主任把装着全班春游费用的信封交到你手上：放你那儿，明早交财务。牛皮纸信封不厚，…」<br>teen-022「满十八岁那天的饭桌上，家里第一次把存折和难处一起摊开：下学年的学费、生意上的窟窿…」 |
| `market-scales.avif` | 2 | childhood-014「压岁钱在枕头下压了三天，你在文具店和储蓄罐之间反复横跳。五块钱，是一年里最大的一…」<br>elder-003「搬进电梯房之前，你要给老屋做最后一次清点：五十年攒下的物件，一件一件过手。老屋的…」 |

### field · 田野

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `field-rows.avif` | 4 | adult-016「你在阳台搭起了种植箱。第一茬小葱收割那天，全家的汤都香了。种植箱是旧货架改的，土…」<br>elder-016「你把阳台改成小花园：三盆月季、一盆薄荷，还有一把躺椅。花盆是捡来的旧陶盆，土是孙…」 |
| `field-harvest.avif` | 2 | infant-016「你被寄放在外婆家一周。外婆家的院子里有一棵很大很大的树，树下拴着晾衣绳，门后挂着…」<br>toddler-202「楼下小花园，几个邻居家的大孩子用一把小铲子挖「地道」。他们也给你分了一小块地。铲…」 |

### wedding · 婚宴

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `wedding-table.avif` | 4 | youth-013「大学室友结婚，你被拉去当伴郎伴娘。婚礼办在室友的老家，你请了两天假，绿皮车的硬座…」<br>youth-021「三十岁生日那晚，在一起五年的对象把话挑明了：结婚，还是各自再想想？我不想让你为难…」 |
| `wedding-hall.avif` | 1 | toddler-022「六一儿童节的报幕声已经响起，你的节目排在第三个。幕后黑压压坐满了人，你的手心全是…」 |

### rain · 雨雪

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `rain-street.avif` | 1 | toddler-015「下过雨的路上有一个超级完美的水坑，深浅正好，大小正好。柏油路还蒸着雨后的热气，空…」 |
| `rain-umbrella.avif` | 2 | infant-015「下雪了。你第一次看见雪，被裹成一个球抱到院子里。棉裤棉袄一层套一层，雪地白得晃眼…」<br>toddler-602「幼儿园班上一半人在咳嗽。你也没躲过去，烧在家里，窗外是别的小孩的笑声。体温计夹在…」 |

### outdoors · 户外

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `outdoors-park.avif` | 8 | toddler-011「游乐场那个最高最长的滑梯，你仰着头看了很久，楼梯口排着队。滑梯的铁皮被太阳晒得烫…」<br>youth-014「你办了张健身卡。头一个月去了八次，第二个月去了两次。健身房在写字楼地下一层，跑步…」 |
| `outdoors-road.avif` | 5 | toddler-001「幼儿园的沙池边，一个高你半头的孩子一把抢走了你挖了很久的塑料铲子。太阳把沙池晒得…」<br>childhood-011「科学课发的蚕宝宝装在铅笔盒里，桑叶要自己去小区最东边那棵树上摘。蚕吃叶子的沙沙声…」 |

### study · 书桌

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `study-books.avif` | 5 | teen-012「校服背后不知道被谁用马克笔写了一行字，洗了三次都没洗掉。字不大，可你总觉得全班的…」<br>teen-015「你在杂志角落认识了一个笔友，对方在很北很北的城市，字写得像刻出来的。信纸挑了最素…」 |
| `study-lamp.avif` | 9 | childhood-017「你在课桌里发现一张字条，是上次帮你捡橡皮的同桌留的：放学一起走吗？字条是从作业本…」<br>teen-001「文理分科的志愿表发下来。家人围在饭桌上反复念叨：学理，好找工作。可你真正舍不得的…」 |
| `study-writing.avif` | 6 | childhood-016「县图书馆的少儿阅览室有三百本书，你给自己定了个小小的目标。借书证押金两块，妈妈从…」<br>teen-004「你的日记本从书包夹层消失了一天，晚饭时原样放回了原处。你一页页对过——少了一根头…」 |

### relic · 旧物

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `relic-box.avif` | 2 | infant-021「大人们收拾了整整一周的纸箱，屋里忽然空得能听见回声。你熟悉的摇篮、熟悉的院子、熟…」<br>youth-701「宿舍楼下有个收废品的中年人，每天傍晚准时推车来。他认得每一栋楼扔出来的纸箱值多少…」 |
| `relic-photo.avif` | 1 | midlife-014「你开始收拾半辈子的家：三箱奖状、一箱磁带、一箱孩子的小学作业本。奖状的绸面有的已…」 |
| `relic-letter.avif` | 2 | childhood-013「你把爸爸的旧闹钟拆了，桌面上一排整整齐齐的零件——装不回去了。闹钟是爸爸上夜班全…」<br>adult-002「孩子第一次上台表演和家长会排在同一天，而你负责的系统升级也定在当晚上线。日历上这…」 |

### pet · 宠物

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `pet-cat.avif` | 6 | toddler-013「邻居送来一只小兔子，笼子就放在阳台上，大人说归你管。兔子爱吃胡萝卜，小卖部五分钱…」<br>adult-013「陪了孩子十二年的狗在春天走了。它睡过的藤筐还摆在阳台，饭盆里的水早上刚换。孩子第…」 |
| `pet-cage.avif` | 1 | adult-018「孩子把项圈系在自己手腕上，说这样它就还在家里。你蹲下来，看见那块磨平的名牌上还留…」 |

### toy · 玩物

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `toy-jigsaw.avif` | 7 | toddler-014「小客人来家里，看上了你最少玩的那只旧恐龙。妈妈说：送给小客人吧。那只恐龙是夜市上…」<br>childhood-019「兴趣班试听日。家长在围棋班和奥数班之间拿不定主意，蹲下来问你自己想学什么。报名那…」 |
| `toy-gamepad.avif` | 2 | toddler-005「你搭了一下午的积木高塔，在最后一块落上去的瞬间哗啦塌了。旁边的小孩哈哈大笑。积木…」<br>teen-011「周五晚上，同学组局去新开的电玩城，群里接龙接到了你的名字。电玩城开在商城顶层，一…」 |

### media · 影音

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `media-tv.avif` | 6 | teen-005「街舞社在体育馆招新，音响一响你脚底发痒。可下周就是月考，班主任的目光正从教室后窗…」<br>youth-004「猎头的电话打进工位：对面公司薪水涨四成，但要放下你手上带了一半的项目。写字楼的中…」 |
| `media-radio.avif` | 5 | youth-003「异地第三年，视频里的两个人话越来越少。对方问：总要有一人挪窝，你说呢？这一晚谁都…」<br>youth-015「又是一个睡不着的凌晨三点。手机屏幕的蓝光照着天花板，你翻了一遍通讯录，没有可以打…」 |
| `media-phone.avif` | 5 | infant-017「收音机里在放一支歌。你跟着咿咿呀呀，调子跑了十万八千里。那台收音机是家里最值钱的…」<br>elder-101「孙女的旧平板淘汰下来了。你戴着老花镜研究了三天，学会了视频通话。平板是孙女贴着卡…」 |

### music · 器乐

| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |
|---|---|---|
| `music-guitar.avif` | 2 | elder-005「社区的口述历史活动来招募讲述人，报名表上写着：每人四十分钟。你盯着那行字看了很久…」<br>elder-705「楼道里新搬来一户年轻人家，晚上有孩子练琴，弹的是同一首曲子，一遍一遍地错在同一个…」 |
| `music-piano.avif` | 3 | midlife-005「整理储藏室，你翻出了年轻时搁下的那把吉他——琴弦锈了，指板上的灰比弦还厚。储藏室…」<br>elder-018「社区记者来采访老人口述栏目，问了一个问题：如果对年轻时的自己说一句话，说什么？记…」 |
| `music-mic.avif` | 1 | childhood-003「家里搬回一台电子琴，附赠一张周一到周日都排满的练习表。琴是攒了大半年才下决心的家…」 |

## §三、语义审计（v5.0.2 交付重点）与处置留痕

**判据**：逐张看图 → 对照该图实际命中的事件文案 → 判「图画的场景是否就是文案的场景」。
只看「图 ↔ 标签」永远是对的（20 类全对），错配全部发生在**标签 ↔ 事件**这层——
根因是 `keyTag` 从 icon `objectKey` 派生，而不少 objectKey 是**隐喻**（婚礼气球、音乐音符、心电符号），
线稿时代靠抽象画法遮掩得住，换成具象照片就藏不住了。

### 3.1 处置汇总

| 处置 | 键数 | 命中事件 | 示例 |
|---|---|---|---|
| 改挂到更贴的类 | 22 | 24 | `candle-light`（晚自习停电点蜡烛）`funeral`→`classroom`；`balloons`（公司年会抽奖）`wedding`→`office`；`cubes`/`brick-pile`（积木/收玩具）`factory`→`toy`；`video-conference`（异地恋视频）`office`→`media`；`papers`（街头发传单）`classroom`→`street` |
| 摘出为显式豁免 | 7 | 9 | `musical-notes`（婚礼当伴郎/外地口音）、`spring`（鼠标颈）、`weight-scale`（返聘顾问）、`scales`（竞赛传纸条）、`desk-lamp`（写字楼通宵）、`checklist`（公司日报）、`wavy-itinerary`（同学聚会）——都不是那个场景，宁可无图 |
| 整类退役 | `funeral` | 2 | 见 3.2 |

### 3.2 为什么 `funeral` 整类退役（3 张图退库）

订正后真正的丧事事件只剩 2 条（`midlife-004` 葬礼、`elder-501` 追悼会）。55 张里 funeral 有 3 张，
而稳定哈希对这两条 id 取模**恒落同一槽**（实测 `idx2` 均为 1）——留任意 2 张都必有 1 张「画了没人用」。
项目纪律是「不留死图」，且原第 3 张（烛台）唯一命中的是「晚自习停电点蜡烛」，不是丧事。
→ 3 张移入 `assets/web-ready/scenes-src/retired/`（不参与分发），2 条事件转显式豁免。
**代价**：死亡/追悼两卡的配图位置空出（不渲染、不留空框）。补法（下轮）：补丧事事件，或补一张「遗像/黑纱」类图，
使图数 ≤ 可分配事件数。已登记 [plan/v5/backlog.md](../plan/v5/backlog.md) 观察区。

### 3.3 keyPin：把「异质变体」钉死在语义正确的图上

`keyTag` 只决定**类**，同类的多张变体仍按事件 id 哈希轮换——于是 `pet`（2 张：猫/兔笼）会把狗、鸽子事件也配成猫，
`media`（3 张：电视/收音机/手机）会把「看电视」配成收音机。这是 v5-M7 登记的观察项，具象照片下比线稿更刺眼。

v5.0.2 引入 **`keyPin`（objectKey → 指定变体）** 一并解决：

| 类 | pin 示例 | 效果 |
|---|---|---|
| `pet` | `cat`→`cat`、`rabbit`→`cage`、`paw-print`→`cage` | 狗/兔/鸽事件不再配猫 |
| `media` | `tv`→`tv`、`pocket-radio`/`boombox`→`radio`、`phone` 系→`phone` | 「看电视」真的配电视 |
| `music` | `guitar`→`guitar`、`piano-keys`→`piano`、`microphone`/`old-microphone`→`mic` | 吉他配吉他、电子琴配琴键、话筒配话筒 |
| `toy` | `dinosaur-rex`/`jigsaw-piece`/`jigsaw-box`/`puzzle`→`jigsaw`、`gamepad`→`gamepad` | 拼图与游戏机分开 |
| `office`/`media` | `round-table`/`discussion`→`meeting`、`video-conference`→`media` 的 `phone` | 会议室与工位分开 |

共 **25 键**。未 pin 的键仍走哈希轮换（口径未变，「一图多事件」不变）。
**守卫**：`scenes.test.ts` 新增「keyPin 无死键且变体可解析」——pin 的值必须能在该键当前所属标签下解析到真实文件
（改 `keyTag` 而忘改 `keyPin` 会 pin 到不存在的图，运行时静默回落到哈希轮换 = 「修了语义却失效」；已用破坏性对照验红）。

### 3.4 仍然「主题近似」但**明确接受**的两处（不是漏网）

| 类 | 现状 | 为什么接受 |
|---|---|---|
| `market`（菜场）承接「钱」类事件（学费/首付/零花钱/余额） | 蔬菜摊照片配「首付差三十万」 | 55 张里没有任何「钱包/存折/账单」类画面；菜场是**唯一**带交易语义的场景。已实测：摘掉这批键会让 `market-scales` 立刻零使用（它只被压岁钱/清点两条命中），故保留并在此声明。下轮补一张「账本/钱包」类图即可彻底解决 |
| `street`（街巷/路口）承接「人生岔路」类抽象事件（志愿/录用/提拔） | 街景配「两份录用通知怎么选」 | 街景本身是中性环境，不构成**事实错误**（不像「花圈配情绪低落」），且这批是全游戏最核心的抉择卡，退成无图损失更大 |

### 3.5 逐张判定

- **图 ↔ 标签**：52/52 全部一致（逐张目检 4 组接触表 + 原图抽查），无不符。
- **退役 3 张**：`funeral-hall` / `funeral-flowers` / `funeral-candles`（理由见 3.2）。
- **事件 ↔ 标签**：改挂 24 条 + 摘出 9 条 = 33 条事件从「明显不符」转为「贴切」或「显式豁免」；
  剩余接受项见 3.3（两类，已逐条声明理由）。

## §四、显式豁免清单（不配图、不留空框）

覆盖 228/295（77.3%），显式豁免 67 条：

infant-012（mirror-mirror）、infant-013（cherish）、infant-022（meeple-group）、toddler-021（stork-delivery）、childhood-004（choice）、childhood-005（cross-mark）、childhood-021（scales）、teen-006（hourglass）、teen-002（shouting）、teen-013（candle-light）、teen-017（backstab）、youth-012（desk-lamp）、youth-016（checklist）、adult-015（uncertainty）、adult-021（life-in-the-balance）、midlife-001（crown）、midlife-004（grave-flowers）、midlife-002（chat-bubble）、teen-019（thought-bubble）、adult-019（diploma）、midlife-019（wavy-itinerary）、infant-102（circle）、toddler-101（infinity）、toddler-201（broom）、toddler-203（socks）、teen-101（drama-masks）、youth-102（spy）、adult-202（hidden）、adult-301（tear-tracks）、adult-302（health-decrease）、elder-201（weight-scale）、teen-301（despair）、infant-402（baby-face）、toddler-401（walking-scout）、toddler-402（broken-heart）、childhood-401（heart-necklace）、childhood-402（chewed-heart）、teen-402（love-mystery）、teen-403（tarot-06-the-lovers）、youth-401（heart-wings）、youth-403（opposite-hearts）、adult-403（nested-hearts）、midlife-401（sparkles）、midlife-403（heart-shield）、elder-401（heart-inside）、elder-402（love-song）、elder-403（sunrise）、infant-501（three-friends）、infant-502（图标层已豁免）、toddler-501（blackball）、toddler-502（shaking-hands）、toddler-503（two-shadows）、childhood-503（prank-glasses）、youth-503（musical-notes）、midlife-501（team-idea）、midlife-502（shattered-heart）、midlife-503（sundial）、elder-501（candle-holder）、elder-502（ballerina-shoes）、teen-601（brain-freeze）、adult-601（spring）、midlife-603（cigarette）、infant-701（chat-bubble）、childhood-701（blackball）、childhood-702（musical-notes）、teen-701（choice）、elder-703（three-friends）

**豁免的构成**（从数据实算）：

| 构成 | 条数 | 说明 |
|---|---|---|
| `heart-*` 系（情绪符号） | 9 | `broken-heart` / `heart-necklace` / `chewed-heart` / `heart-wings` / `opposite-hearts` / `nested-hearts` / `heart-shield` / `heart-inside` / `shattered-heart`——画的是一颗心，不是某个场景 |
| 图标层已豁免（`objectKey: null`） | 1 | `infant-502` |
| 其余抽象符号 / 非场景实物 | 57 | `blackball` ×2 / `chat-bubble` ×2 / `choice` ×2 / `musical-notes` ×2 / `three-friends` ×2 / `baby-face` / `backstab` / `ballerina-shoes` / `brain-freeze` / `broom` / `candle-holder` / `candle-light` / `checklist` / `cherish` / `cigarette` / `circle` / `cross-mark` / `crown` / `desk-lamp` / `despair` / `diploma` / `drama-masks` / `grave-flowers` / `health-decrease` / `hidden` / `hourglass` / `infinity` / `life-in-the-balance` / `love-mystery` / `love-song` / `meeple-group` / `mirror-mirror` / `prank-glasses` / `scales` / `shaking-hands` / `shouting` / `socks` / `sparkles` / `spring` / `spy` / `stork-delivery` / `sundial` / `sunrise` / `tarot-06-the-lovers` / `team-idea` / `tear-tracks` / `thought-bubble` / `two-shadows` / `uncertainty` / `walking-scout` / `wavy-itinerary` / `weight-scale` |

这些事件继续靠事件图标（Game-Icons，295/295 全覆盖）表达量感，不渲染场景图也**不留空框**。
棘轮：`tests/scene-misfits.test.ts` 守住 `OFF_SCENE` 那批键不再回流 `keyTag`（v5-M6 修复后快照为 0；
本轮复核 keyTag 内错配键 0 个）。

## §五、与其他门的边界

- **预算门**：`assets/web-ready/scenes/*.avif` 各自成文件（`assetsInlineLimit` 对 .avif 关闭内联），
  dist gzip 实测见 [docs/v5-M9-scene-webp.md](v5-M9-scene-webp.md) §四 与 [plan/05](../plan/05-发布留档.md) v5.1.0 节。
- **许可门**：AI 生成，无第三方素材；溯源声明见 [assets/README.md](../assets/README.md) §AI 生成配图。
- **E2E 钩子**：配图节点 = `figure.ev-scene[data-ev-scene]`，内含 `<img>`（`naturalWidth` 必须 800、`naturalHeight` 280）；
  豁免事件该节点**不存在**（可机检「不留空框」）。
- **单屏字数**：配图不计入 `validate:story` 的单屏 ≤160 口径，但**不得顶掉年份戳**——年份戳在配图之上，顺序未变。
- **源图**：`assets/web-ready/scenes-src/*.webp` 只作编码输入，**不参与分发**；编码器 `tools/v5-scenes-encode.mjs`。
