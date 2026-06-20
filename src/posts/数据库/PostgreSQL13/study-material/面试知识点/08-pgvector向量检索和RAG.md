---
title: "PostgreSQL 13 面试知识点：pgvector、向量检索和 RAG"
date: 2026-06-20
description: "pgvector 是 PostgreSQL 扩展，用于在 PostgreSQL 表中保存向量并执行相似度搜索。它适合语义搜索、推荐、去重、RAG 检索、图片或文本相似匹配等场景。"
tags:
  - "数据库"
  - "PostgreSQL13"
  - "面试"
category: "数据库"
---

# PostgreSQL 13 面试知识点：pgvector、向量检索和 RAG

[返回面试索引](../13-面试知识点整理.md)

[返回学习资料索引](../../PostgreSQL13学习资料.md)

## 一、基础概念

### 1. pgvector 是什么？它解决什么问题？

**参考答案：**

pgvector 是 PostgreSQL 扩展，用于在 PostgreSQL 表中保存向量并执行相似度搜索。它适合语义搜索、推荐、去重、RAG 检索、图片或文本相似匹配等场景。

它的核心价值是让向量和业务数据放在同一个事务数据库里，能继续使用 SQL、JOIN、权限、备份恢复和 PostgreSQL 运维体系。它的边界是：大规模高 QPS、复杂分片、极致低延迟或专用 ANN 能力可能需要专门的向量数据库或混合架构。

> **重点：** pgvector 是 PostgreSQL 扩展，不是独立数据库。
>
> **易错：** 以为用了 pgvector 就不需要数据建模、权限过滤和召回评测。

### 2. PostgreSQL 13 使用 pgvector 要注意什么？

**参考答案：**

pgvector 官方支持 PostgreSQL 13+，所以 PostgreSQL 13 可以安装使用。但 PostgreSQL 13 已进入 EOL，生产环境要把数据库主版本升级和 pgvector 扩展版本兼容一起纳入计划。

安装上要注意两层：

```sql
CREATE EXTENSION IF NOT EXISTS vector;

SELECT extname, extversion
FROM pg_extension
WHERE extname = 'vector';
```

如果同一机器有多个 PostgreSQL 主版本，编译或包安装时要确认扩展文件装到了 PostgreSQL 13 对应目录。

> **易错：** 只在操作系统安装 pgvector 包，却忘记在业务数据库执行 `CREATE EXTENSION vector`。

### 3. `vector(768)` 中的 768 表示什么？模型升级为什么危险？

**参考答案：**

`vector(768)` 表示该列保存 768 维向量，每行向量维度必须匹配。这个维度通常来自 embedding 模型输出。

模型升级危险在于：即使新旧模型维度相同，语义空间也可能不同。不同模型生成的向量放在一起计算距离，结果可能没有意义。因此模型升级通常要新增列或新表，回填新 embedding，用固定评测集比较召回和质量，再切换查询路径。

> **难点：** 维度一致只代表能算距离，不代表语义空间可比较。

## 二、距离函数和查询

### 4. pgvector 常见距离操作符有哪些？怎么选择？

**参考答案：**

常见操作符：

| 操作符 | 含义 |
| --- | --- |
| `<->` | L2 欧氏距离 |
| `<#>` | 负内积 |
| `<=>` | 余弦距离 |
| `<+>` | L1 距离 |
| `<~>` | Hamming 距离 |
| `<%>` | Jaccard 距离 |

选择依据是 embedding 模型文档和评测结果。文本语义搜索经常使用余弦距离，但不能无脑套用；如果模型说明要用内积或 L2，应按模型要求来。

> **易错：** `<#>` 返回负内积，因为 PostgreSQL 索引按升序扫描操作符。做最大内积搜索时不要按普通分数理解排序方向。

### 5. 为什么我的向量索引没有被使用？

**参考答案：**

常见原因是查询形态不符合索引使用条件。向量索引通常需要：

```sql
SELECT id
FROM resume_chunk
ORDER BY embedding <=> $1
LIMIT 10;
```

常见错误：

- 没有 `LIMIT`。
- `ORDER BY` 写成 `1 - (embedding <=> $1) DESC`。
- 建的是 `vector_cosine_ops`，查询却用 `<->`。
- 表太小，优化器认为顺序扫描更便宜。
- 过滤条件选择率导致其他计划成本更低。

排查可用：

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM resume_chunk
WHERE tenant_id = 1
ORDER BY embedding <=> $1
LIMIT 10;
```

> **重点：** 用 `EXPLAIN (ANALYZE, BUFFERS)` 说话，不要凭感觉判断索引是否有效。

## 三、索引机制

### 6. HNSW 和 IVFFlat 有什么区别？

**参考答案：**

HNSW 是多层近邻图，查询时沿图导航到相近区域。它通常召回和速度权衡更好，但构建更慢、占用更多内存和磁盘，写入维护成本更高。

IVFFlat 是聚类分桶，查询时只扫描离查询向量较近的一部分桶。它构建更快、资源更省，但召回通常弱于 HNSW，并且需要已有代表性数据来训练 lists。

| 维度 | HNSW | IVFFlat |
| --- | --- | --- |
| 空表建索引 | 可以 | 不建议 |
| 查询召回 | 通常更好 | 依赖 lists/probes |
| 构建成本 | 较高 | 较低 |
| 参数 | `m`、`ef_construction`、`hnsw.ef_search` | `lists`、`ivfflat.probes` |

> **重点：** 两者都是近似索引，必须用业务评测集看 recall@k 和延迟。

### 7. IVFFlat 为什么要求先有数据再建索引？

**参考答案：**

IVFFlat 需要根据已有向量训练聚类中心，也就是把向量空间划分成 lists。如果建索引时数据太少或分布不代表真实业务，后续查询扫描的桶可能不能覆盖真正的近邻，导致召回下降。

正确做法是等数据达到代表性规模后再建 IVFFlat；如果后续数据分布明显变化，要重新评估并考虑重建索引。

> **易错：** 空表创建 IVFFlat，然后批量导入数据，以为索引质量会自动变好。

### 8. HNSW 的 `ef_search` 调大有什么影响？

**参考答案：**

`hnsw.ef_search` 控制查询时动态候选列表大小。调大通常会提高召回率，但会增加查询耗时和 CPU 消耗。

```sql
BEGIN;
SET LOCAL hnsw.ef_search = 100;
SELECT id
FROM resume_chunk
ORDER BY embedding <=> $1
LIMIT 10;
COMMIT;
```

生产中建议按查询级或场景级调参，不要无脑全局调大。高价值问题可以用更高召回参数，普通自动补全或探索查询可以用较低参数。

> **难点：** 参数调优不是追求最大值，而是在 recall@k、P95 延迟和资源成本之间找平衡。

## 四、过滤、召回和 RAG

### 9. 为什么带 `WHERE` 过滤后，近似索引可能返回结果不足？

**参考答案：**

近似向量索引通常先按向量距离找到一批候选，再应用 `WHERE` 过滤。如果过滤条件只命中少量行，初始候选中符合条件的行可能很少，最终结果数量不足或召回很差。

例如租户、权限、语言、状态过滤都可能造成这个问题。解决方向：

- 提高 `hnsw.ef_search` 或 `ivfflat.probes`。
- 启用迭代扫描。
- 为低选择率过滤列建普通索引，先缩小候选后精确排序。
- 对少量固定类别建部分向量索引。
- 按租户或类别分区。
- 取更大候选集后重排序。

> **重点：** 向量相似不是唯一条件，业务硬过滤会改变检索质量。

### 10. RAG 中如何设计 PostgreSQL + pgvector 的表？

**参考答案：**

至少要拆出文档表和 chunk 表。文档表保存来源、租户、权限、版本和审计信息；chunk 表保存文本片段、chunk 序号、embedding、模型版本和 metadata。

示例：

```sql
CREATE TABLE resume_chunk (
  id bigserial PRIMARY KEY,
  document_id bigint NOT NULL,
  tenant_id bigint NOT NULL,
  chunk_no integer NOT NULL,
  content text NOT NULL,
  embedding_model text NOT NULL,
  embedding vector(768) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  UNIQUE (document_id, chunk_no)
);
```

还要考虑：

- chunk 过短会缺上下文，过长会稀释语义。
- 模型版本变更要可追踪。
- 查询必须带租户、权限、版本和删除状态过滤。
- 召回后通常还需要重排序和去重。

> **易错：** 只建 `id, content, embedding` 三列，后续权限、版本和删除都补不回来。

### 11. 如何评估 pgvector 检索质量？

**参考答案：**

不能只看查询耗时。至少要看：

- recall@k：近似 top k 和精确 top k 的重合比例。
- 命中率：标准答案文档是否出现在 top k。
- MRR 或 nDCG：正确结果排得是否靠前。
- 人工相关性：业务人员判断结果是否能回答问题。
- 权限误召回：是否返回不该看的文档。
- 延迟和资源：P95/P99、CPU、I/O、WAL、复制延迟。

常见做法是维护固定问题集，每次调整模型、切分、索引参数或数据库版本后回归。

> **重点：** RAG 检索质量是数据、模型、切分、索引、过滤和重排序共同决定的。

## 五、生产运维

### 12. pgvector 上线前要做哪些生产检查？

**参考答案：**

检查清单：

- PostgreSQL 主版本和 pgvector 版本是否受支持。
- 恢复环境是否安装了同版本扩展。
- 表结构是否包含租户、权限、模型版本和删除标记。
- 是否有精确搜索基准和 recall@k 评测。
- HNSW 或 IVFFlat 参数是否基于真实数据调过。
- `CREATE INDEX CONCURRENTLY`、维护窗口、WAL 和复制延迟是否评估。
- embedding 回填是否分批，是否会撑爆 WAL、锁、连接池或复制槽。
- 监控是否覆盖慢查询、表大小、索引大小、dead tuple、autovacuum、召回质量和业务命中率。

> **易错：** 只在小样本上测延迟，没有测生产数据分布、过滤条件和召回。

### 13. embedding 大批量重算如何降低风险？

**参考答案：**

建议按迁移处理：

1. 新增新模型列或新表，不直接覆盖旧向量。
2. 分批生成和写入，控制事务大小。
3. 监控 WAL、复制延迟、表膨胀、autovacuum 和磁盘。
4. 为新列或新表创建索引，完成召回评测。
5. 灰度切换查询路径。
6. 保留回滚方案，再清理旧向量。

> **重点：** embedding 重算是数据迁移和索引迁移，不是一次普通 UPDATE。

### 14. 什么时候不适合使用 PostgreSQL + pgvector？

**参考答案：**

不适合或需要谨慎评估的场景：

- 向量规模和 QPS 已远超单 PostgreSQL 集群预算。
- 需要复杂分片、专用 ANN 算法或 GPU 加速。
- 向量更新极其频繁，WAL、VACUUM 和索引维护成本不可接受。
- 检索质量要求依赖复杂混合召回和多阶段排序，PostgreSQL 只适合承担其中一段。
- 团队没有 PostgreSQL 运维能力，却把核心 AI 检索完全压到数据库上。

> **难点：** pgvector 的优势是和业务数据共库，代价是要接受 PostgreSQL 的资源模型和运维边界。

## 六、深度机制题

### 15. 为什么 operator class 和距离操作符不匹配会导致索引不可用或结果不符合预期？

**参考答案：**

pgvector 的向量索引不是一个索引覆盖所有距离。建索引时指定的 operator class 决定该索引用哪种距离组织和比较向量。例如：

```sql
CREATE INDEX idx_resume_cosine
ON resume_chunk
USING hnsw (embedding vector_cosine_ops);
```

这个索引服务的是余弦距离查询：

```sql
ORDER BY embedding <=> $1
```

如果查询改成 L2：

```sql
ORDER BY embedding <-> $1
```

优化器不能把余弦距离索引当成 L2 索引用。即使两个距离在某些归一化向量上相关，也不是同一个 operator class 的语义。

> **重点：** 索引定义、查询操作符、排序方向和 `LIMIT` 必须一起匹配。
>
> **易错：** 只回答“建 HNSW 就能加速向量查询”，没有说明 operator class。

### 16. HNSW 为什么通常召回好但构建和写入更贵？

**参考答案：**

HNSW 是多层近邻图。插入一个向量时，需要在图中搜索合适邻居并维护连接；查询时从稀疏上层逐步导航到底层候选区域。这个结构让查询能少扫很多向量，但构建时要为每个向量建立图连接，索引体积、内存需求和写入维护成本都更高。

关键参数：

- `m`：每个节点连接数上限，调大通常提升召回但增加索引大小。
- `ef_construction`：构建时候选范围，调大提升图质量但构建更慢。
- `hnsw.ef_search`：查询时候选范围，调大提升召回但增加延迟。

> **难点：** HNSW 的成本不是只发生在查询，还发生在构建、写入、VACUUM、REINDEX 和复制链路上。

### 17. IVFFlat 的 lists 和 probes 怎么影响召回？

**参考答案：**

IVFFlat 先训练聚类中心，把向量分到 `lists` 个列表。查询时只扫描最接近查询向量的 `probes` 个列表。

- `lists` 太少：每个列表太大，速度差。
- `lists` 太多：近邻分散，低 probes 容易漏。
- `probes` 太低：扫描少，召回低。
- `probes` 太高：召回好，但接近全量扫描。

IVFFlat 要先有代表性数据再建索引，因为聚类中心来自已有数据。如果数据分布变化明显，要重新评估甚至重建索引。

> **易错：** 空表建 IVFFlat 后导入数据，以为聚类中心会自动代表新数据分布。

### 18. 为什么带过滤条件的向量查询可能拿不满 `LIMIT 10`？

**参考答案：**

近似索引一般先找向量上接近的候选，再执行 `WHERE` 过滤。如果过滤命中率很低，候选被过滤掉后就可能不足。

粗略估算：

```text
可用候选数 = 初始候选数 * 过滤命中率
```

如果 `hnsw.ef_search = 40`，权限和租户过滤后只剩 5%，平均只有 2 条候选满足条件，自然拿不满 `LIMIT 10`。

解决方向：

- 提高 `hnsw.ef_search` 或 `ivfflat.probes`。
- 使用迭代扫描。
- 给过滤条件建普通索引，先过滤后精确排序。
- 建部分向量索引。
- 按租户、语言、业务域分区。
- 取更大候选集后重排序。

> **重点：** 过滤选择率是向量召回系统设计的一等指标。

### 19. `strict_order` 和 `relaxed_order` 迭代扫描怎么选？

**参考答案：**

迭代扫描用于过滤后结果不足时继续扫描更多候选。

- `strict_order` 更强调结果按距离严格排序，适合直接返回 top k、顺序敏感的场景。
- `relaxed_order` 允许轻微乱序，通常换取更好的性能或召回，适合后面还有 reranker 的 RAG 候选召回。

示例：

```sql
SET hnsw.iterative_scan = strict_order;
SET hnsw.max_scan_tuples = 20000;
```

> **难点：** 迭代扫描不是无成本开关，它会增加扫描候选、CPU 和延迟，需要结合 P95/P99 与 recall@k 评估。

### 20. 为什么 embedding 大字段会放大 PostgreSQL 的 MVCC 和 WAL 成本？

**参考答案：**

PostgreSQL UPDATE 通常生成新 tuple，不是原地覆盖。embedding 往往是几 KB 的大字段，批量更新会带来：

- heap 新旧版本并存，表膨胀。
- HNSW 或 IVFFlat 索引维护。
- 大量 WAL，影响归档和复制。
- dead tuple 增加，autovacuum 压力变大。
- 备库 replay 延迟上升。

所以模型升级不建议直接全表 UPDATE 旧 embedding。更稳妥的方法是新增列或新表，分批回填，建新索引，评测后灰度切换。

> **重点：** embedding 重算是数据迁移，不是普通字段更新。

## 七、系统设计和排障题

### 21. 设计一个多租户 RAG 检索表，你会包含哪些字段？

**参考答案：**

至少包含文档层和 chunk 层：

- 文档表：`id`、`tenant_id`、`source_uri`、`title`、`acl`、`version`、`created_at`。
- chunk 表：`id`、`document_id`、`tenant_id`、`chunk_no`、`content`、`embedding_model`、`embedding`、`metadata`、`is_deleted`、`created_at`。

关键点：

- `tenant_id` 和权限字段必须进入 SQL 过滤，不要事后在应用层过滤。
- `embedding_model` 用于模型升级和回滚。
- `is_deleted` 支持软删除和异步清理。
- `chunk_no` 和 `document_id` 用于相邻 chunk 补上下文。
- 高频过滤字段要考虑普通索引、部分向量索引或分区。

> **易错：** 只设计 `content + embedding`，忽略租户、权限、版本和文档来源。

### 22. 如何判断 pgvector 查询慢是索引没命中、过滤太严还是参数太高？

**参考答案：**

排查顺序：

1. `EXPLAIN (ANALYZE, BUFFERS)` 看计划是否走 HNSW 或 IVFFlat。
2. 检查 `ORDER BY embedding <=> $1 LIMIT k` 是否满足索引形态。
3. 检查 operator class 是否和距离操作符匹配。
4. 统计过滤命中率，例如租户、权限、状态过滤后剩多少行。
5. 降低或提高 `hnsw.ef_search` / `ivfflat.probes` 做对照实验。
6. 对比精确搜索和近似搜索的 recall@k。
7. 看 `pg_stat_statements`、buffer、临时文件、CPU 和 I/O。

> **重点：** 慢不等于索引没用；也可能是为了召回扫了太多候选，或过滤后反复补候选。

### 23. 如何做 pgvector 的 recall@10 评测？

**参考答案：**

先用精确搜索作为基准，再用近似索引结果对比。

```text
recall@10 = 近似 top 10 与精确 top 10 的交集数量 / 10
```

流程：

1. 准备固定 query 集，覆盖高频、长尾、不同租户和不同权限。
2. 对每个 query 执行精确搜索 top 10。
3. 对同一 query 执行 HNSW 或 IVFFlat top 10。
4. 计算交集。
5. 同时记录 P95/P99 延迟和返回数量。
6. 每次调整模型、切分、索引参数、过滤策略或数据库版本后回归。

> **易错：** 只用 3 个 demo query 看起来“挺准”，没有固定评测集。

### 24. 什么时候要做向量检索和全文检索混合？

**参考答案：**

当查询包含专有名词、错误码、函数名、岗位关键词、产品型号、法规条款时，全文检索通常比纯向量更可靠。向量检索擅长语义相近，全文检索擅长精确词项。

常见设计：

- 向量召回 top 100。
- 全文检索召回 top 100。
- 用 RRF 合并排名。
- 用 reranker 或业务规则精排 top 20。
- 最后组装上下文。

> **重点：** RAG 召回不是只能有一个通道。高质量检索经常是多路召回加重排序。

### 25. 使用 binary quantization 或 `halfvec` 的风险是什么？

**参考答案：**

它们的目标是降低索引大小、内存和计算成本，但会损失信息。风险包括：

- 召回率下降。
- 某些语义细粒度差异被抹平。
- 表达式索引要求查询表达式严格匹配。
- 如果只用量化结果排序，最终相关性可能明显下降。

更稳妥的方式是两阶段：

1. 用 `halfvec`、binary quantization 或 subvector 快速召回较大候选集。
2. 用原始 `vector` 精确距离或 reranker 重排。

> **难点：** 量化优化的是成本，不保证质量。必须用 recall@k 和人工评测验证。

### 26. pgvector 备份恢复有哪些坑？

**参考答案：**

pgvector 的数据、索引和扩展对象都在 PostgreSQL 里，但恢复目标环境必须安装兼容的 pgvector 扩展文件。

常见坑：

- 逻辑恢复执行 `CREATE EXTENSION vector` 时找不到扩展控制文件。
- 目标机器有多个 PostgreSQL 主版本，扩展装错目录。
- 恢复后扩展版本不同，未做查询回归和召回评测。
- 只验证数据行数，没有验证 HNSW/IVFFlat 索引和核心查询。

检查：

```sql
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'vector';

SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name = 'vector';
```

> **重点：** 备份恢复文档必须写清 PostgreSQL 主版本、pgvector 版本和扩展安装方式。

### 27. 线上 HNSW VACUUM 很慢，你怎么处理？

**参考答案：**

先判断是不是 embedding 大量更新或删除导致 dead tuple 和索引清理压力。看：

```sql
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
WHERE relname = 'resume_chunk';
```

HNSW 索引结构复杂，VACUUM 可能较慢。可以在维护窗口评估先：

```sql
REINDEX INDEX CONCURRENTLY idx_resume_chunk_embedding_hnsw;
VACUUM resume_chunk;
```

但这会产生 I/O、WAL 和复制压力，不能在事故中无证据执行。长期修复通常是减少 embedding UPDATE、分批回填、按模型版本新表切换，并监控膨胀。

> **易错：** 看到 VACUUM 慢就直接手工终止或全局调 autovacuum 参数。
