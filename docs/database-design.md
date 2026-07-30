# 妙语购票 — 数据库设计方案

## 设计思路

以"**对话驱动的智能购票**"为核心，数据库需要支撑：

- AI Agent 从自然语言中提取**槽位**，跨表关联补全信息
- **自动跳步**时能快速判断槽位完备度
- **锁座**防止超卖，**超时释放**保证库存一致
- **上下文记忆**持久化用户偏好和对话状态
- **动态卡片**的数据实时可用

---

## ER 核心关系

```
  ┌──────┐       ┌──────────┐       ┌──────────┐
  │ Film │ 1──N │ Showtime │ N──1 │ Cinema   │
  └──┬───┘       └────┬─────┘       └──────────┘
     │                │                   │
     │          1     │ 1                 │
     ▼                ▼                   │
  ┌──────────┐  ┌──────────┐             │
  │FilmTag   │  │   Seat   │─────────────┘
  │(标签)    │  │  (座位)  │  cinemaId
  └──────────┘  └────┬─────┘
                     │ 1
                     ▼
               ┌──────────┐       ┌──────────┐
               │  Order   │ 1──N │OrderSeat │
               └────┬─────┘       └──────────┘
                    │
                    │ N
                    ▼
               ┌──────────┐
               │  Coupon  │ (优惠券)
               └──────────┘

  ┌──────────┐        ┌──────────────┐
  │  User    │ 1──N   │ UserPrefer   │ (用户偏好)
  └────┬─────┘        └──────────────┘
       │ 1──N  ┌──────────────┐
       │       │ DialogSession │ (对话会话)
       │       └──────┬───────┘
       │              │ 1──N
       │              ▼
       │       ┌──────────────┐
       └───────│ DialogTurn   │ (对话轮次 + 槽位快照)
               └──────────────┘
```

---

## 表结构设计

### 1. 影片表 `film`

```
┌─────────────┬──────────────┬──────────────────────────────┐
│ 字段        │ 类型         │ 说明                         │
├─────────────┼──────────────┼──────────────────────────────┤
│ id          │ BIGINT PK    │ 雪花ID                       │
│ title       │ VARCHAR(100) │ 片名                         │
│ en_title    │ VARCHAR(200) │ 英文名                       │
│ poster_url  │ VARCHAR(500) │ 海报                         │
│ backdrop_url│ VARCHAR(500) │ 背景大图                     │
│ genre       │ VARCHAR(50)  │ 类型 (动作/喜剧/科幻…)       │
│ duration    │ INT          │ 片长 (分钟)                  │
│ year        │ INT          │ 上映年份                     │
│ rating      │ DECIMAL(2,1) │ 评分 (0-10)                  │
│ synopsis    │ TEXT         │ 简介                         │
│ director    │ VARCHAR(100) │ 导演                         │
│ cast        │ JSON         │ 演员数组 ["黄渤","周冬雨"]   │
│ status      │ TINYINT      │ 0-即将 1-热映 2-下映         │
│ release_date│ DATE         │ 上映日期                     │
│ tags        │ JSON         │ 标签 ["IMAX","杜比","3D"]    │
│ box_office  │ BIGINT       │ 票房（分），AI 推荐权重用    │
│ is_deleted  │ TINYINT      │ 逻辑删除                     │
│ created_at  │ DATETIME     │                              │
│ updated_at  │ DATETIME     │                              │
└─────────────┴──────────────┴──────────────────────────────┘
```

### 2. 影院表 `cinema`

```
┌──────────────┬──────────────┬──────────────────────────┐
│ 字段         │ 类型         │ 说明                     │
├──────────────┼──────────────┼──────────────────────────┤
│ id           │ BIGINT PK    │                          │
│ name         │ VARCHAR(100) │ 影院名称                 │
│ address      │ VARCHAR(300) │ 详细地址                 │
│ city         │ VARCHAR(30)  │ 城市，用于地理筛选       │
│ district     │ VARCHAR(50)  │ 区/商圈                  │
│ latitude     │ DECIMAL(9,6) │ 纬度，附近影院计算用     │
│ longitude    │ DECIMAL(9,6) │ 经度                     │
│ phone        │ VARCHAR(20)  │ 联系电话                 │
│ hall_count   │ INT          │ 影厅数量                 │
│ facilities   │ JSON         │ 设施 ["IMAX","杜比","VIP"]│
│ min_price    │ INT          │ 最低票价(分)             │
│ rating       │ DECIMAL(2,1) │ 影院评分                 │
│ is_deleted   │ TINYINT      │                          │
│ created_at   │ DATETIME     │                          │
│ updated_at   │ DATETIME     │                          │
└──────────────┴──────────────┴──────────────────────────┘
```

### 3. 影厅表 `hall`

```
┌──────────────┬──────────────┬──────────────────────────┐
│ 字段         │ 类型         │ 说明                     │
├──────────────┼──────────────┼──────────────────────────┤
│ id           │ BIGINT PK    │                          │
│ cinema_id    │ BIGINT FK    │ 所属影院                 │
│ name         │ VARCHAR(50)  │ "1号IMAX厅"              │
│ hall_type    │ VARCHAR(30)  │ IMAX/杜比/激光/普通      │
│ rows         │ INT          │ 排数                     │
│ cols         │ INT          │ 列数                     │
│ seat_layout  │ JSON         │ 座位布局(含走道、黄金区) │
│ is_deleted   │ TINYINT      │                          │
└──────────────┴──────────────┴──────────────────────────┘
```

`seat_layout` JSON 结构示例（用于 AI 推荐 "黄金区域"）：
```json
{
  "rows": 8,
  "cols": 12,
  "aisle_cols": [6],        // 走道位置
  "sold_seats": [],         // 由 seat 表实时同步
  "golden_zone": {          // 黄金观影区
    "row_range": [4, 7],
    "col_range": [4, 9]
  },
  "couple_seats": [         // 情侣座
    {"row": 7, "cols": [1, 2]},
    {"row": 7, "cols": [11, 12]}
  ],
  "wheelchair_spots": [     // 无障碍位
    {"row": 1, "cols": [1]}
  ]
}
```

### 4. 场次表 `showtime`

```
┌──────────────┬──────────────┬──────────────────────────┐
│ 字段         │ 类型         │ 说明                     │
├──────────────┼──────────────┼──────────────────────────┤
│ id           │ BIGINT PK    │                          │
│ film_id      │ BIGINT FK    │ 影片                     │
│ cinema_id    │ BIGINT FK    │ 影院 (冗余,方便查询)     │
│ hall_id      │ BIGINT FK    │ 影厅                     │
│ date         │ DATE         │ 放映日期                 │
│ start_time   │ TIME         │ 开始时间                 │
│ end_time     │ TIME         │ 结束时间                 │
│ lang         │ VARCHAR(20)  │ 语言/字幕 "国语/2D"      │
│ price        │ INT          │ 票价(分)                 │
│ vip_price    │ INT          │ 会员价(分)               │
│ status       │ TINYINT      │ 0-待售 1-在售 2-售罄    │
│ is_deleted   │ TINYINT      │                          │
│ created_at   │ DATETIME     │                          │
│ updated_at   │ DATETIME     │                          │
└──────────────┴──────────────┴──────────────────────────┘
```

### 5. 座位表 `seat`

```
┌──────────────┬──────────────┬──────────────────────────┐
│ 字段         │ 类型         │ 说明                     │
├──────────────┼──────────────┼──────────────────────────┤
│ id           │ BIGINT PK    │                          │
│ showtime_id  │ BIGINT FK    │ 所属场次                 │
│ hall_id      │ BIGINT FK    │ 冗余，方便选座面板渲染   │
│ row_label    │ VARCHAR(2)   │ 行号 "A"/"5"             │
│ col_label    │ VARCHAR(2)   │ 列号 "1"/"12"            │
│ row_num      │ INT          │ 数字行号                 │
│ col_num      │ INT          │ 数字列号                 │
│ seat_type    │ TINYINT      │ 0-普通 1-情侣 2-无障碍   │
│ status       │ TINYINT      │ 0-空闲 1-锁定 2-已售     │
│ lock_user_id │ BIGINT       │ 锁定者(并发控制)         │
│ lock_time    │ DATETIME     │ 锁定时间(超时释放用)     │
│ order_id     │ BIGINT FK    │ 关联订单(已售时)         │
│ updated_at   │ DATETIME     │ 用于乐观锁版本控制       │
└──────────────┴──────────────┴──────────────────────────┘

索引: UNIQUE(showtime_id, row_num, col_num)  ← 核心防超卖约束
索引: (showtime_id, status)                  ← Agent 快速查可用座位
索引: (lock_time)                            ← 定时任务扫超时锁
```

### 6. 订单表 `order`

```
┌──────────────┬──────────────┬──────────────────────────┐
│ 字段         │ 类型         │ 说明                     │
├──────────────┼──────────────┼──────────────────────────┤
│ id           │ VARCHAR(32) PK│ ORD202607291430XXXX      │
│ user_id      │ BIGINT FK    │                          │
│ showtime_id  │ BIGINT FK    │ 场次                     │
│ film_id      │ BIGINT FK    │ 冗余(查询用)             │
│ cinema_id    │ BIGINT FK    │ 冗余                     │
│ film_title   │ VARCHAR(100) │ 下单时快照，防改名       │
│ cinema_name  │ VARCHAR(100) │ 下单时快照               │
│ hall_name    │ VARCHAR(50)  │                          │
│ date         │ DATE         │                          │
│ time         │ TIME         │                          │
│ seat_count   │ INT          │ 座位数                   │
│ seat_details │ JSON         │ ["5排3座","5排4座"]      │
│ origin_price │ INT          │ 原价(分)                 │
│ discount     │ INT          │ 优惠金额(分)             │
│ total_price  │ INT          │ 实付(分)                 │
│ coupon_id    │ BIGINT       │ 使用的优惠券ID           │
│ status       │ TINYINT      │ 0-待支付 1-已支付 2-已取消│
│ expire_time  │ DATETIME     │ 支付截止时间(下单+15min) │
│ paid_at      │ DATETIME     │ 支付时间                 │
│ created_at   │ DATETIME     │                          │
│ updated_at   │ DATETIME     │                          │
└──────────────┴──────────────┴──────────────────────────┘
```

### 7. 用户偏好表 `user_prefer`

```
┌──────────────┬──────────────┬──────────────────────────┐
│ 字段         │ 类型         │ 说明                     │
├──────────────┼──────────────┼──────────────────────────┤
│ id           │ BIGINT PK    │                          │
│ user_id      │ BIGINT FK    │                          │
│ pref_type    │ VARCHAR(30)  │ genre/seat/hall/cinema   │
│ pref_value   │ VARCHAR(100) │ "IMAX"/"5排中间"/"科幻"  │
│ weight       │ INT          │ 偏好权重(累计次数)       │
│ updated_at   │ DATETIME     │                          │
└──────────────┴──────────────┴──────────────────────────┘

示例数据:
  user_id=1, pref_type='seat',   pref_value='{"row":5,"cols":[3,8]}', weight=12
  user_id=1, pref_type='genre',  pref_value='科幻', weight=8
  user_id=1, pref_type='hall',   pref_value='IMAX', weight=6
  user_id=2, pref_type='price',  pref_value='{"max":3000}', weight=3
```

### 8. 对话会话表 `dialog_session`

```
┌──────────────┬──────────────┬──────────────────────────┐
│ 字段         │ 类型         │ 说明                     │
├──────────────┼──────────────┼──────────────────────────┤
│ id           │ VARCHAR(64) PK│ conv_20260729_xxxxx      │
│ user_id      │ BIGINT FK    │                          │
│ intent       │ VARCHAR(50)  │ 当前意图 buy/recommend   │
│ state        │ VARCHAR(30)  │ 对话状态机节点名         │
│ slots        │ JSON         │ 当前已填充的槽位         │
│ context      │ JSON         │ 上下文(候选列表等)       │
│ status       │ TINYINT      │ 0-活跃 1-完成 2-超时     │
│ created_at   │ DATETIME     │                          │
│ updated_at   │ DATETIME     │                          │
└──────────────┴──────────────┴──────────────────────────┘

slots JSON 示例 (Agent 核心数据结构):
{
  "film":    {"value": "流浪地球3", "filled": true, "source": "user_input"},
  "genre":   {"value": null,        "filled": false},
  "date":    {"value": "2026-08-02", "filled": true, "source": "inferred"},
  "time":    {"value": "14:00",     "filled": true, "source": "recommended"},
  "cinema":  {"value": "万达影城",  "filled": true, "source": "user_input"},
  "hall":    {"value": "IMAX",      "filled": true, "source": "user_prefer"},
  "seats":   {"value": null,        "filled": false},
  "count":   {"value": 2,           "filled": true, "source": "user_input"},
  "budget":  {"value": null,        "filled": false}
}
```

### 9. 对话轮次表 `dialog_turn`

```
┌──────────────┬──────────────┬──────────────────────────┐
│ 字段         │ 类型         │ 说明                     │
├──────────────┼──────────────┼──────────────────────────┤
│ id           │ BIGINT PK    │                          │
│ session_id   │ VARCHAR FK   │                          │
│ user_id      │ BIGINT       │                          │
│ role         │ VARCHAR(10)  │ user / agent             │
│ content      │ TEXT         │ 文本内容                 │
│ intent       │ VARCHAR(50)  │ 本轮识别的意图           │
│ slots_diff   │ JSON         │ 本轮新增/修改的槽位      │
│ card_type    │ VARCHAR(30)  │ 本轮推送的卡片类型       │
│ card_data    │ JSON         │ 卡片数据快照             │
│ created_at   │ DATETIME     │                          │
└──────────────┴──────────────┴──────────────────────────┘
```

### 10. 优惠券表 `coupon`

```
┌──────────────┬──────────────┬──────────────────────────┐
│ 字段         │ 类型         │ 说明                     │
├──────────────┼──────────────┼──────────────────────────┤
│ id           │ BIGINT PK    │                          │
│ user_id      │ BIGINT FK    │                          │
│ title        │ VARCHAR(100) │ "新人专享券"             │
│ amount       │ INT          │ 面额(分)                 │
│ min_amount   │ INT          │ 最低消费(分)             │
│ hall_type    │ VARCHAR(30)  │ 限定影厅(NULL=通用)      │
│ expire_date  │ DATE         │ 过期日期                 │
│ status       │ TINYINT      │ 0-未用 1-已用 2-过期     │
│ used_order_id│ VARCHAR(32)  │ 使用的订单               │
│ created_at   │ DATETIME     │                          │
└──────────────┴──────────────┴──────────────────────────┘
```

---

## 关键设计决策

### 1. 锁座并发控制

**问题**：两个用户同时选座位 5-4，如何防止超卖？

**方案**：乐观锁
```sql
-- 选座时
UPDATE seat 
SET status = 1, lock_user_id = ?, lock_time = NOW()
WHERE id = ? 
  AND status = 0          -- 只有空闲座才能锁定
  AND (lock_time IS NULL OR lock_time < DATE_SUB(NOW(), INTERVAL 15 MINUTE));

-- 检查 affected rows，为 0 说明被抢了 → 告诉 Agent "这个座位刚被抢了"
```

**超时释放**（定时任务，每分钟执行）：
```sql
UPDATE seat 
SET status = 0, lock_user_id = NULL, lock_time = NULL
WHERE status = 1 
  AND lock_time < DATE_SUB(NOW(), INTERVAL 15 MINUTE);
```

### 2. 自动跳步逻辑的数据支持

Agent 在每个对话轮次中执行：

```
1. 解析用户输入 → 提取实体 → 更新 dialog_session.slots
2. 检查槽位完备度 → 判断能否跳步：

   槽位完备度矩阵:
   ┌──────────┬──────┬───────┬──────┬──────┬──────┬──────┬─────┐
   │ 状态     │ film │cinema │ date │ time │ hall │seats │count│
   ├──────────┼──────┼───────┼──────┼──────┼──────┼──────┼─────┤
   │ 选影片   │  ❌  │  -    │  -   │  -   │  -   │  -   │ -   │
   │ 选影院   │  ✅  │  ❌   │  -   │  -   │  -   │  -   │ -   │
   │ 选场次   │  ✅  │  ✅   │  ❌  │  -   │  -   │  -   │ -   │
   │ 选座位   │  ✅  │  ✅   │  ✅  │  ✅  │  ✅  │  ❌  │ ✅  │
   │ 确认订单 │  ✅  │  ✅   │  ✅  │  ✅  │  ✅  │  ✅  │ ✅  │
   └──────────┴──────┴───────┴──────┴──────┴──────┴──────┴─────┘

   用户说"订明天万达的流浪地球3 IMAX 2张" 
   → film✅ cinema✅ date✅ time❌ hall✅ seats❌ count✅
   → 2个槽位缺失，但 date 可以推断为"明天" → 只需追问 time
   →追问: "明天万达IMAX《流浪地球3》有以下场次，您选哪个？"
```

### 3. 上下文记忆与指代消解

**指代消解**依赖 `dialog_session.slots` 和 `dialog_session.context`：

```
用户: "换成第2个" 
  → Agent 读 slots.cur_state = 'selecting_cinema'
  → 读 context.candidates = [{id:1,...}, {id:2,...}]
  → 解析: 第2个影院 → cinema_id = context.candidates[1].id
  → 更新 slots.cinema, 进入下一状态
```

**偏好记忆**：
```
用户: "还是老样子"
  → Agent 查 user_prefer WHERE user_id=? AND pref_type='seat' ORDER BY weight DESC
  → 得到 {"row":5,"cols":[3,8]} → 找到最近的可用座位 → 自动填充 slots.seats
```

### 4. 对话状态机

```
                  START
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
  【选影片】    【推荐影片】    【快速购票】
  need: genre?  need: genre     need: ALL slots
     │              │              │ (跳过所有中间步骤)
     ▼              ▼              ▼
  【选影院】    【选影院】    【生成场次】
  need: film    need: film     │
     │              │           ▼
     ▼              ▼       【确认场次】
  【选场次】    【选场次】  │
  need: cinema  need:cinema  ▼
     │              │       【选座位+下单】
     ▼              ▼
  【选座位】    【选座位】
  need:showtime need:showtime
     │              │
     ▼              ▼
  【确认订单】 【确认订单】
  need: seats   need: seats
     │              │
     ▼              ▼
  【支付出票】 【支付出票】
```

### 5. 数据量级估算

| 表 | 预估行数 | 索引策略 |
|---|---|---|
| film | ~500 | rating / genre / status 索引 |
| cinema | ~2000 (全国) | city+district 联合索引 |
| hall | ~12000 | cinema_id 索引 |
| showtime | ~200万/月 | (film_id, date) / (cinema_id, date) 联合索引 |
| seat | ~2亿/月 | (showtime_id, status) 联合索引 ← 最热的查询 |
| order | ~100万/月 | user_id / showtime_id 索引 |
| dialog_session | ~50万/天 | user_id + status 索引 |

---

## Agent 调用数据库的典型 SQL

```sql
-- 1. 模糊搜索影片（支持意图"周末看个喜剧"）
SELECT * FROM film 
WHERE genre LIKE '%喜剧%' 
  AND status = 1
ORDER BY rating DESC, box_office DESC
LIMIT 6;

-- 2. 查某影片的附近影院（"离公司最近的"）
SELECT c.*, s.id as showtime_id
FROM cinema c
JOIN showtime s ON s.cinema_id = c.id
WHERE s.film_id = ?
  AND s.date = ?
  AND s.status = 1
ORDER BY 
  (6371 * acos(cos(radians(?)) * cos(radians(c.latitude)) 
   * cos(radians(c.longitude) - radians(?)) + sin(radians(?)) 
   * sin(radians(c.latitude)))) ASC  -- Haversine 公式
LIMIT 5;

-- 3. 查可售场次（"明天下午的IMAX"）
SELECT s.*, h.name as hall_name, h.hall_type
FROM showtime s
JOIN hall h ON h.id = s.hall_id
WHERE s.film_id = ?
  AND s.cinema_id = ?
  AND s.date = ?
  AND s.start_time BETWEEN '12:00' AND '18:00'
  AND h.hall_type = 'IMAX'
  AND s.status = 1
ORDER BY s.start_time;

-- 4. 查可用座位（并发安全）
SELECT * FROM seat
WHERE showtime_id = ?
  AND status = 0
ORDER BY row_num, col_num;

-- 5. 智能推荐座位（用户偏好：5排中间）
SELECT *,
  ABS(row_num - 5) + ABS(col_num - 6) as dist_score
FROM seat
WHERE showtime_id = ?
  AND status = 0
ORDER BY dist_score ASC
LIMIT 4;
```

---

## 关键要点

1. **`dialog_session.slots` 是 Agent 的大脑** — 用 JSON 存储当前填充的槽位，每次对话轮次更新它，跳步逻辑完全依赖它判断
2. **seat 表的 `showtime_id + row_num + col_num` 唯一索引** 是防超卖的最后防线
3. **锁座用乐观锁**（UPDATE + WHERE status=0），而非悲观锁（SELECT FOR UPDATE），避免大量等待
4. **order 表冗余 film_title/cinema_name** — 已下单的快照数据不应随源表修改而改变
5. **user_prefer 的 weight 字段** 随时间累积，用于 Agent 推荐策略（"还是老样子"）
