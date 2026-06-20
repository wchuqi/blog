---
title: "PostgreSQL 13 学习资料：pgvector 向量检索和 RAG 实践"
date: 2026-06-20
description: "传统 SQL 擅长精确匹配：id = 10、status = 'open'、createdat ...。语义搜索面对的是“意思接近”，例如“懂 PostgreSQL 性能优化的 Java 后端”和“做过慢查询治理、索引设计、事务排障的人”并…"
tags:
  - "数据库"
  - "PostgreSQL13"
category: "数据库"
---

# PostgreSQL 13 学习资料：pgvector 向量检索和 RAG 实践

[返回索引](../PostgreSQL13学习资料.md)

## 学习目标

- 理解 pgvector 的定位：它是 PostgreSQL 扩展，用来保存向量并按相似度检索，不是独立向量数据库。
- 能在 PostgreSQL 13 中安装、启用和验证 `vector` 扩展。
- 能设计保存 embedding 的表结构，并选择合适的距离函数。
- 能区分精确搜索、HNSW 和 IVFFlat 的机制、成本、召回率和适用场景。
- 能解释过滤条件、权限条件、`LIMIT`、重排序对 RAG 检索质量的影响。
- 能从生产角度评估扩展版本、索引构建、WAL、VACUUM、备份恢复、监控和升级风险。

## 知识覆盖图

| 知识域 | 必须掌握 |
| --- | --- |
| 基础定位 | pgvector 是 PostgreSQL 扩展，适合把业务数据和向量检索放在同一数据库内 |
| 环境兼容 | pgvector 支持 PostgreSQL 13+；PostgreSQL 13 已 EOL，生产要规划升级 |
| 数据类型 | `vector`、`halfvec`、`bit`、`sparsevec` 的存储、维度和适用边界 |
| 距离运算 | L2、负内积、余弦、L1、Hamming、Jaccard 与 embedding 模型的匹配关系 |
| 精确搜索 | 不建近似索引时按距离排序全量扫描，召回准确但大表成本高 |
| HNSW | 多层近邻图、`m`、`ef_construction`、`hnsw.ef_search`、构建内存和召回权衡 |
| IVFFlat | 聚类分桶、`lists`、`ivfflat.probes`、训练数据和重建策略 |
| 操作符类匹配 | `vector_l2_ops`、`vector_ip_ops`、`vector_cosine_ops` 等必须和查询距离操作符一致 |
| 查询规划 | 向量索引通常要求 `ORDER BY 距离操作符 LIMIT k`，操作符类要匹配 |
| 过滤和重排 | 近似索引候选集过滤后可能不足，需要参数、部分索引、分区或重排序 |
| 迭代扫描 | `strict_order`、`relaxed_order`、`hnsw.max_scan_tuples`、`ivfflat.max_probes` 的作用和边界 |
| 降维和量化 | `halfvec`、binary quantization、subvector 索引和原向量重排 |
| 混合检索 | PostgreSQL 全文检索、向量检索、RRF、cross-encoder/reranker 的组合 |
| RAG 建模 | 文档、chunk、embedding、metadata、租户、权限、模型版本和删除标记 |
| 生产运维 | 索引构建、WAL 放大、VACUUM、备份恢复、扩展升级、召回评测、监控和排障 |

## 理论导读

传统 SQL 擅长精确匹配：`id = 10`、`status = 'open'`、`created_at > ...`。语义搜索面对的是“意思接近”，例如“懂 PostgreSQL 性能优化的 Java 后端”和“做过慢查询治理、索引设计、事务排障的人”并不共享固定关键词，但语义上相关。embedding 模型会把文本、图片或其他对象编码成一组浮点数，语义越接近，向量距离通常越近。

pgvector 把这组浮点数作为 PostgreSQL 类型保存起来，并提供距离操作符和近似索引。它的价值是把业务数据、权限过滤、事务一致性、备份恢复和向量检索放在同一个数据库系统里。它的边界也来自这里：如果数据量、QPS、召回要求、分片规模或向量生命周期已经超出单个 PostgreSQL 集群的承载能力，就需要评估专用向量数据库、搜索引擎或混合架构。

截至 2026-06-08，pgvector 官方 README 示例版本为 `v0.8.2`，并标明支持 PostgreSQL 13+。但 PostgreSQL 13 本身已经进入 EOL，学习可以继续使用，生产环境应优先考虑升级到受支持的 PostgreSQL 主版本。

## 核心心智模型

可以把 pgvector 想成“数据库里的相似度尺子和候选集加速器”：

- 表仍然是 PostgreSQL 表，行仍然受事务、锁、权限、WAL 和 VACUUM 管理。
- `embedding` 列保存语义坐标。
- 距离操作符负责量出“离查询向量有多近”。
- HNSW 或 IVFFlat 索引负责快速找到一批可能很近的候选。
- 业务过滤、权限过滤和重排序决定最终能不能把候选变成可靠答案。

> **重点：** pgvector 不替代数据建模。它只增加“按语义相似度排序”的能力，业务正确性仍靠表结构、约束、权限和查询条件保证。

## 环境和安装

pgvector 是扩展，通常要先在服务器安装扩展文件，再在目标数据库中执行 `CREATE EXTENSION`。扩展是数据库级对象，不是装一次就自动在所有数据库可用。

### Docker 学习环境

如果只是学习，可以直接使用官方 pgvector 镜像对应 PostgreSQL 13 的 tag：

```powershell
docker run --name pg13-vector `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=job_app `
  -p 5432:5432 `
  -d pgvector/pgvector:pg13
```

连接后启用扩展：

```sql
CREATE EXTENSION IF NOT EXISTS vector;

SELECT extname, extversion
FROM pg_extension
WHERE extname = 'vector';
```

裸机安装时要确认 pgvector 使用 PostgreSQL 13 的 `pg_config` 构建或安装。如果同一机器有多个 PostgreSQL 主版本，扩展文件装错目录会导致 `CREATE EXTENSION vector` 找不到控制文件或加载失败。

```bash
pg_config --version
pg_config --pkglibdir
pg_config --sharedir
```

> **易错：** 系统里同时有 PostgreSQL 13、16、17，却直接 `make install`。
>
> 正确做法：明确指定 PostgreSQL 13 的 `PG_CONFIG`，安装后在 PostgreSQL 13 实例中执行 `CREATE EXTENSION vector` 验证。

## 数据建模

下面用招聘系统的简历片段检索做示例。实际 RAG 系统一般不会只存一个向量列，还要保存源文档、分段、租户、权限、版本、软删除和元数据。

```sql
CREATE TABLE resume_document (
  id bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL,
  candidate_id bigint NOT NULL,
  source_uri text NOT NULL,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE resume_chunk (
  id bigserial PRIMARY KEY,
  document_id bigint NOT NULL REFERENCES resume_document(id),
  tenant_id bigint NOT NULL,
  chunk_no integer NOT NULL,
  content text NOT NULL,
  embedding_model text NOT NULL,
  embedding vector(768) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_no)
);

CREATE INDEX idx_resume_chunk_tenant_live
ON resume_chunk (tenant_id, is_deleted);
```

### 维度和模型版本

`vector(768)` 表示每行必须是 768 维。维度通常来自 embedding 模型输出。模型变更时，不应把不同语义空间的向量混进同一列；即使两个模型维度相同，它们的空间也未必可比较。

常见做法：

- 同一列只保存同一个模型和同一个预处理策略生成的向量。
- 模型升级时新增列、建新表，或用 `embedding_model` 明确隔离并分批回填。
- 上线前用固定评测集比较 recall@k、MRR、人工相关性和延迟。

> **难点：** 向量的“类型正确”不等于“语义可比”。维度相同只能说明能计算距离，不能说明结果可信。

## 距离操作符

| 操作符 | 含义 | 常见场景 |
| --- | --- | --- |
| `<->` | L2 欧氏距离 | 模型文档明确使用 L2，或向量已按该距离训练 |
| `<#>` | 负内积 | 最大内积搜索；因为 PostgreSQL 索引按升序扫描，所以返回负值 |
| `<=>` | 余弦距离 | 文本语义搜索常见，尤其关注方向相似而不是向量长度 |
| `<+>` | L1 距离 | 特定模型或实验场景 |
| `<~>` | Hamming 距离 | 二进制向量 |
| `<%>` | Jaccard 距离 | 二进制集合相似度 |

最小查询：

```sql
SELECT
  id,
  content,
  embedding <=> '[0.01,0.02,0.03]'::vector AS distance
FROM resume_chunk
WHERE tenant_id = 1001
  AND is_deleted = false
ORDER BY embedding <=> '[0.01,0.02,0.03]'::vector
LIMIT 10;
```

> **易错：** 用 `1 - (embedding <=> $query)` 做 `ORDER BY ... DESC`，然后疑惑索引不用。
>
> 正确做法：索引查询保持距离操作符本身升序排序，例如 `ORDER BY embedding <=> $query LIMIT 10`，相似度分数可以在外层再换算。

## 精确搜索

不创建 HNSW 或 IVFFlat 时，PostgreSQL 可以顺序扫描候选行并计算距离排序。这是精确搜索，召回率最高，但随着候选行数和维度增大，CPU 和排序成本会上升。

适合精确搜索的场景：

- 数据量小，例如几千到几十万条候选。
- 强过滤后候选很少，例如单租户、单部门、单文档内搜索。
- 离线评测，用来作为近似索引的 recall@k 基准。
- 高价值查询，需要先取较大候选集再精排。

```sql
SELECT id
FROM resume_chunk
WHERE tenant_id = 1001
  AND is_deleted = false
ORDER BY embedding <=> $1
LIMIT 10;
```

## HNSW 索引

HNSW 可以理解为“多层近邻导航图”。查询不是逐行比较所有向量，而是在图上从稀疏层走向密集层，快速接近目标附近的候选。它通常查询性能和召回权衡更好，但构建慢、占用更多内存和磁盘，写入维护成本也更高。

```sql
CREATE INDEX idx_resume_chunk_embedding_hnsw
ON resume_chunk
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

查询时调节候选列表：

```sql
BEGIN;
SET LOCAL hnsw.ef_search = 100;

SELECT id, content, embedding <=> $1 AS distance
FROM resume_chunk
WHERE tenant_id = 1001
  AND is_deleted = false
ORDER BY embedding <=> $1
LIMIT 10;

COMMIT;
```

| 参数 | 作用 | 调大影响 |
| --- | --- | --- |
| `m` | 每层最大连接数 | 可能提高召回，但增加索引体积和构建成本 |
| `ef_construction` | 构建图时的候选列表大小 | 提高索引质量，但构建更慢 |
| `hnsw.ef_search` | 查询时动态候选列表大小 | 提高召回，但查询更慢 |

> **重点：** HNSW 可以在空表上建索引，因为它不需要像 IVFFlat 那样先训练聚类中心。

## IVFFlat 索引

IVFFlat 可以理解为“先把向量分桶，再只查最可能相关的桶”。它构建更快、内存更省，但召回通常不如 HNSW。它需要已有数据来训练 lists，因此空表或数据很少时创建 IVFFlat 容易得到质量很差的索引。

```sql
CREATE INDEX idx_resume_chunk_embedding_ivfflat
ON resume_chunk
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

查询时调节 probes：

```sql
BEGIN;
SET LOCAL ivfflat.probes = 10;

SELECT id, content, embedding <=> $1 AS distance
FROM resume_chunk
WHERE tenant_id = 1001
  AND is_deleted = false
ORDER BY embedding <=> $1
LIMIT 10;

COMMIT;
```

经验起点：

- 100 万行以内，`lists` 可以从 `rows / 1000` 量级试起。
- 超过 100 万行，`lists` 可以从 `sqrt(rows)` 量级试起。
- `probes` 可以从 `sqrt(lists)` 试起，再按召回率和延迟调参。

> **易错：** 导入少量测试数据时建 IVFFlat，后续批量导入后不重建。
>
> 正确做法：等数据达到代表性规模后再建 IVFFlat，数据分布明显变化时重新评估或重建。

## HNSW 和 IVFFlat 对比

| 维度 | HNSW | IVFFlat |
| --- | --- | --- |
| 核心模型 | 多层近邻图 | 聚类分桶后查部分桶 |
| 空表建索引 | 可以 | 不建议 |
| 查询性能和召回 | 通常更好 | 通常较弱，需要调 lists/probes |
| 构建成本 | 更慢、更吃内存 | 更快、更省内存 |
| 写入维护 | 图结构维护成本较高 | 相对较低 |
| 适合场景 | 高召回、低延迟、读多写少 | 成本敏感、可接受较低召回或数据规模中等 |

## 深度机制：类型、操作符类和查询匹配

### 1. 向量类型不是只有 `vector`

pgvector 支持多种向量表示。它们不是语法糖，而是决定存储成本、索引大小、召回边界和 CPU 计算方式的核心选择。

| 类型 | 官方支持规模 | 适合场景 | 主要代价 |
| --- | --- | --- | --- |
| `vector` | 最多 2,000 维 | 常规 float32 embedding，语义搜索默认选择 | 存储和索引较大 |
| `halfvec` | 最多 4,000 维 | 可接受半精度损失，希望降低内存和索引体积 | 精度下降，需要评测召回 |
| `bit` | 最多 64,000 维 | binary embedding、image hash、binary quantization 后的候选召回 | 表达能力依赖量化质量 |
| `sparsevec` | 最多 1,000 个非零元素 | 稀疏特征、传统特征工程或高维稀疏向量 | 不适合普通稠密文本 embedding 直接套用 |

一个 768 维 `vector` 大约是 `768 * 4 = 3072` 字节，再加上行头、字段头、其他列和索引条目。它比普通业务字段大得多，所以批量更新 embedding 会明显放大 heap、WAL、索引维护和复制压力。

> **重点：** 向量列是大字段。把 embedding 当普通 `int` 或 `status` 字段频繁 UPDATE，会把 PostgreSQL 的 MVCC、WAL 和 VACUUM 成本全部放大。

### 2. 操作符类决定索引能不能服务查询

pgvector 的索引不是“一个索引支持所有距离”。建索引时使用的 operator class 必须匹配查询使用的距离操作符。

| 查询距离 | HNSW / IVFFlat operator class |
| --- | --- |
| L2：`<->` | `vector_l2_ops` |
| 负内积：`<#>` | `vector_ip_ops` |
| 余弦：`<=>` | `vector_cosine_ops` |
| L1：`<+>` | `vector_l1_ops`，HNSW 支持 |
| Hamming：`<~>` | `bit_hamming_ops` |
| Jaccard：`<%>` | `bit_jaccard_ops` |

错误示例：

```sql
CREATE INDEX idx_resume_l2
ON resume_chunk
USING hnsw (embedding vector_l2_ops);

-- 查询使用余弦距离，不能指望上面的 L2 operator class 提供正确索引路径
EXPLAIN SELECT id
FROM resume_chunk
ORDER BY embedding <=> $1
LIMIT 10;
```

正确做法：

```sql
CREATE INDEX idx_resume_cosine
ON resume_chunk
USING hnsw (embedding vector_cosine_ops);
```

表达式索引也要求查询表达式匹配。比如用半精度表达式索引：

```sql
CREATE INDEX idx_resume_halfvec_hnsw
ON resume_chunk
USING hnsw ((embedding::halfvec(768)) halfvec_cosine_ops);

SELECT id
FROM resume_chunk
ORDER BY embedding::halfvec(768) <=> $1::halfvec(768)
LIMIT 10;
```

> **易错：** 只记住“建了 HNSW”，不检查 operator class 和 `ORDER BY` 表达式是否一致。
>
> 正确做法：把索引定义、查询距离、表达式 cast、排序方向一起检查。

## 深度机制：HNSW 如何影响写入、构建和召回

HNSW 的核心是多层图。越上层越稀疏，适合快速接近目标区域；越下层越密集，适合局部搜索。查询时从入口点开始，在图上找更近的节点，逐层下降，最后在底层候选集中得到 top k。

这个模型带来几个工程后果：

- 索引不是简单排序结构，构建时需要为每个向量寻找邻居并维护图连接。
- `m` 越大，每个节点保留的连接越多，图更密，召回可能更好，但索引更大、写入更慢。
- `ef_construction` 越大，构建时搜索邻居更充分，图质量更好，但构建更慢。
- `hnsw.ef_search` 越大，查询时探索候选越多，召回更好，但延迟和 CPU 更高。
- 新增或更新向量时要维护图结构，所以 HNSW 更适合读多写少或批量导入后集中建索引。

构建时要重点看内存。如果图不能放进 `maintenance_work_mem`，构建会明显变慢。官方实现会在构建过程中给出类似“graph no longer fits into maintenance_work_mem”的 notice。

```sql
SET maintenance_work_mem = '4GB';
SET max_parallel_maintenance_workers = 4;

CREATE INDEX CONCURRENTLY idx_resume_chunk_embedding_hnsw
ON resume_chunk
USING hnsw (embedding vector_cosine_ops);

SELECT
  phase,
  round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS pct
FROM pg_stat_progress_create_index;
```

HNSW 构建阶段通常主要是 `initializing` 和 `loading tuples`。如果长时间卡在加载阶段，要同时看 CPU、I/O、WAL、锁等待和 `maintenance_work_mem`。

> **难点：** HNSW 的慢不一定是 SQL 慢，而可能是索引图构建、内存不足、WAL 写入、并发写入和复制延迟共同作用。

## 深度机制：IVFFlat 的聚类、数据漂移和 probes

IVFFlat 先用已有数据训练聚类中心，把向量空间切成 `lists` 个倒排列表。查询时找到离查询向量最近的若干列表，只扫描这些列表中的向量。

它的关键不是“有索引就快”，而是 `lists` 和 `probes` 是否匹配数据规模与分布：

- `lists` 太少：每个列表太大，扫描多，速度优势下降。
- `lists` 太多：每个列表太小，近邻可能被分散到多个列表，低 probes 时召回下降。
- `probes` 太低：只查少量列表，速度快但漏召回。
- `probes` 太高：召回提高，但接近全量扫描；当 probes 等于 lists 时接近精确搜索，优化器可能不再使用该索引。

构建阶段可观察：

```sql
SELECT
  phase,
  round(100.0 * tuples_done / nullif(tuples_total, 0), 1) AS pct
FROM pg_stat_progress_create_index;
```

IVFFlat 常见阶段包括 `performing k-means`、`assigning tuples`、`loading tuples`。如果在很少数据上建索引，k-means 得到的中心不能代表真实分布，后续数据导入越多，索引质量越不稳定。

> **易错：** 把 IVFFlat 当 B-tree：先建索引再导入海量数据。
>
> 正确做法：先导入代表性数据，再建 IVFFlat；数据分布大变后重新评估 recall@k，必要时重建。

## 过滤、召回和重排序

真实查询通常还包含租户、权限、状态、时间、分类、语言、文档版本等过滤条件。近似索引的常见问题是：索引先找到一批向量上接近的候选，过滤条件再剔除不符合的行。如果过滤条件只命中 10% 的行，而初始候选列表很小，最终可能拿不到足够结果。

处理方法：

- 低选择率过滤：给过滤列建普通 B-tree 索引，先缩小候选集后精确排序。
- 少量固定分类：使用部分 HNSW 索引。
- 多租户或多类别：考虑分区，让每个分区内的向量索引服务更小候选空间。
- 召回不足：提高 `hnsw.ef_search` 或 `ivfflat.probes`，或启用迭代扫描。
- 质量要求高：先取更大候选集，例如 top 100，再用业务规则、全文检索分数或 reranker 精排。

部分索引示例：

```sql
CREATE INDEX idx_resume_chunk_hnsw_tenant_1001
ON resume_chunk
USING hnsw (embedding vector_cosine_ops)
WHERE tenant_id = 1001 AND is_deleted = false;
```

候选集重排示例：

```sql
WITH candidates AS MATERIALIZED (
  SELECT id, content, embedding <=> $1 AS vector_distance
  FROM resume_chunk
  WHERE tenant_id = 1001
    AND is_deleted = false
  ORDER BY embedding <=> $1
  LIMIT 100
)
SELECT id, content, vector_distance
FROM candidates
ORDER BY vector_distance ASC
LIMIT 10;
```

> **难点：** 过滤条件、向量索引和 `LIMIT` 是一起决定结果质量的。只调一个参数，可能只是把延迟变大，并没有解决召回不足。

### 过滤选择率的粗略估算

过滤条件对近似索引的影响可以先用一个简单模型估算：

```text
预计可用候选数 = 初始向量候选数 * 过滤命中率
```

如果 `hnsw.ef_search = 40`，租户和权限过滤后只保留 5%，那么平均只有 `40 * 5% = 2` 个候选能进入后续排序。此时你要 `LIMIT 10`，结果不足并不奇怪。

处理方向不是固定的：

- 过滤命中率很高：调大 `ef_search` 或 `probes` 通常有效。
- 过滤命中率很低：优先考虑部分索引、分区、先过滤后精确排序，或业务上拆小检索空间。
- 权限过滤复杂：不要把权限判断放到应用层事后过滤，否则可能造成越权候选进入日志、缓存或上下文。
- top k 质量要求高：先取 top 100 或 top 200，再做 rerank，不要只取 top 10 直接喂给模型。

### 迭代扫描

pgvector 新版本提供迭代扫描能力，用来缓解“近似索引候选被过滤后不够”的问题。它会在过滤后结果不足时继续扫描更多向量候选。

```sql
SET hnsw.iterative_scan = strict_order;
-- 或在更关注召回和性能时使用 relaxed_order
SET hnsw.iterative_scan = relaxed_order;

SELECT id, content
FROM resume_chunk
WHERE tenant_id = 1001
  AND is_deleted = false
ORDER BY embedding <=> $1
LIMIT 10;
```

| 模式 | 特点 | 适合场景 |
| --- | --- | --- |
| `strict_order` | 尽量保持严格距离顺序 | 结果顺序敏感、需要稳定 top k |
| `relaxed_order` | 允许轻微乱序以换取更好召回或性能 | RAG 候选后面还要 rerank |

可以配合扫描上限参数控制资源：

```sql
SET hnsw.max_scan_tuples = 20000;
SET hnsw.scan_mem_multiplier = 2;

SET ivfflat.max_probes = 100;
```

> **重点：** 迭代扫描不是免费召回。它本质上是“过滤后不够就继续找候选”，会增加扫描量、CPU 和延迟。

### 分区、部分索引和多租户

多租户场景里，不要默认建一个覆盖全库的大向量索引。要先看查询模式：

| 查询模式 | 更合适的设计 |
| --- | --- |
| 每次只查单个大租户 | 按 `tenant_id` 分区或为大租户建部分索引 |
| 大量小租户，单租户数据少 | 普通过滤索引 + 精确向量排序可能足够 |
| 按语言或业务域查询 | 按稳定低基数字段做部分索引 |
| 权限条件复杂且变化快 | 先召回较大候选，再在数据库内做权限过滤和 rerank |

部分索引适合少量、稳定、高频的过滤条件，不适合给每个小租户都建一个索引。分区适合数据规模和维护边界都比较清楚的场景，但会增加 DDL、备份、统计信息和执行计划复杂度。

## 混合检索、量化和重排序

### 1. 向量检索不是全文检索的替代品

向量检索擅长语义相近，全文检索擅长关键词、专有名词、错误码、函数名、产品型号、法规条款。真实 RAG 经常需要混合：

```sql
WITH vector_candidates AS MATERIALIZED (
  SELECT id, content, embedding <=> $1 AS vector_distance
  FROM resume_chunk
  WHERE tenant_id = 1001 AND is_deleted = false
  ORDER BY embedding <=> $1
  LIMIT 100
),
text_candidates AS MATERIALIZED (
  SELECT id, content, ts_rank_cd(to_tsvector('simple', content), plainto_tsquery('simple', $2)) AS text_rank
  FROM resume_chunk
  WHERE tenant_id = 1001
    AND is_deleted = false
    AND to_tsvector('simple', content) @@ plainto_tsquery('simple', $2)
  ORDER BY text_rank DESC
  LIMIT 100
)
SELECT id, max(content) AS content
FROM (
  SELECT id, content FROM vector_candidates
  UNION ALL
  SELECT id, content FROM text_candidates
) s
GROUP BY id
LIMIT 20;
```

生产中可以使用 RRF（Reciprocal Rank Fusion）把多个排名融合，再交给 reranker：

```text
rrf_score = 1 / (k + vector_rank) + 1 / (k + text_rank)
```

> **易错：** 用户搜索“SQLSTATE 55P03 lock_not_available”，只做语义向量召回。
>
> 正确做法：错误码、专有名词和精确短语要让全文检索或普通索引参与召回。

### 2. binary quantization 和半精度索引

当向量规模很大时，可以用更小的表示做第一阶段召回，再用原始向量重排。这个思路的核心是“两阶段”：

1. 用较便宜的近似表示快速取候选。
2. 对候选用原始 `vector` 计算精确距离。

binary quantization 示例：

```sql
CREATE INDEX idx_resume_binary_hnsw
ON resume_chunk
USING hnsw ((binary_quantize(embedding)::bit(768)) bit_hamming_ops);

WITH candidates AS MATERIALIZED (
  SELECT id, content, embedding
  FROM resume_chunk
  ORDER BY binary_quantize(embedding)::bit(768)
           <~> binary_quantize($1)::bit(768)
  LIMIT 200
)
SELECT id, content, embedding <=> $1 AS distance
FROM candidates
ORDER BY embedding <=> $1
LIMIT 10;
```

半精度索引示例：

```sql
CREATE INDEX idx_resume_halfvec_cosine
ON resume_chunk
USING hnsw ((embedding::halfvec(768)) halfvec_cosine_ops);

WITH candidates AS MATERIALIZED (
  SELECT id, content, embedding
  FROM resume_chunk
  ORDER BY embedding::halfvec(768) <=> $1::halfvec(768)
  LIMIT 100
)
SELECT id, content
FROM candidates
ORDER BY embedding <=> $1
LIMIT 10;
```

> **难点：** 量化的目标是降低第一阶段成本，不是替代质量评测。量化后必须和原向量精确搜索对比 recall@k。

### 3. subvector 索引

某些 embedding 维度很高，但前一部分维度已经能提供较强召回，可以尝试 subvector 作为第一阶段索引，然后用完整向量重排。

```sql
CREATE INDEX idx_resume_subvector_hnsw
ON resume_chunk
USING hnsw ((subvector(embedding, 1, 256)::vector(256)) vector_cosine_ops);

WITH candidates AS MATERIALIZED (
  SELECT id, content, embedding
  FROM resume_chunk
  ORDER BY subvector(embedding, 1, 256)::vector(256)
           <=> subvector($1, 1, 256)::vector(256)
  LIMIT 100
)
SELECT id, content
FROM candidates
ORDER BY embedding <=> $1
LIMIT 10;
```

这个方法高度依赖模型特性，不能默认成立。只有在评测集上证明召回和延迟都更好，才值得生产使用。

## RAG 检索链路设计

一个可靠的 PostgreSQL + pgvector RAG 检索链路通常包括：

1. 文档入库：保存原文、来源、租户、权限、版本和审计信息。
2. 文档切分：按段落、标题、长度、语义边界切 chunk，避免过短失去语义、过长稀释重点。
3. embedding 生成：记录模型名、维度、预处理方式和生成时间。
4. 向量写入：批量写入并保证 chunk 与向量一一对应。
5. 检索：先应用租户、权限、状态等硬过滤，再按向量距离取候选。
6. 重排序：结合关键词、时间、业务权重、reranker 或规则过滤。
7. 组装上下文：控制 token 长度，去重，保留引用来源。
8. 评测：用固定问题集计算 recall@k、命中率、人工满意度、延迟和成本。

> **重点：** RAG 的错误经常不是数据库语法错误，而是切分策略、模型版本、权限过滤、召回评估和上下文组装共同造成的质量问题。

### RAG 质量问题定位表

| 现象 | 常见根因 | 排查方法 |
| --- | --- | --- |
| 查不到明显相关文档 | chunk 切分差、embedding 模型不适配、近似召回低、过滤太严 | 用精确搜索对比、检查过滤命中率、人工查看 chunk |
| 返回相关但不能回答 | chunk 缺上下文、top k 太小、没有相邻 chunk 补全 | 返回 `document_id` 附近 chunk，检查上下文拼接 |
| 返回了不该看的文档 | 权限过滤不在 SQL 内、缓存未隔离、租户条件缺失 | 查询审计 SQL、检查 RLS/WHERE、按用户重放请求 |
| 结果重复 | chunk 重叠过大、同文档多段重复进入上下文 | 按 `document_id` 去重或限制每文档候选数 |
| 延迟抖动大 | `ef_search` 过高、过滤后迭代扫描过多、并发排序或 CPU 饱和 | 看 P95/P99、`pg_stat_statements`、CPU、执行计划 |
| 模型升级后质量下降 | 新旧向量混用、切分策略变化、评测集缺失 | 按 `embedding_model` 分组评测 recall@k |

## 评测方法：不要只看 EXPLAIN

向量检索需要同时评估数据库性能和检索质量。最小评测应包含：

- 精确搜索 top k 作为基准。
- 近似索引 top k 作为候选。
- `recall@k = 近似结果与精确结果交集数量 / k`。
- P50/P95/P99 延迟。
- 过滤后返回数量。
- 人工标注或业务 gold set 的命中率。

示例评测表：

```sql
CREATE TABLE vector_eval_query (
  id bigserial PRIMARY KEY,
  query_text text NOT NULL,
  query_embedding vector(768) NOT NULL,
  expected_document_ids bigint[] NOT NULL DEFAULT '{}'
);

CREATE TABLE vector_eval_result (
  query_id bigint NOT NULL,
  method text NOT NULL,
  k integer NOT NULL,
  result_ids bigint[] NOT NULL,
  elapsed_ms numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (query_id, method, k, created_at)
);
```

保存精确结果：

```sql
INSERT INTO vector_eval_result(query_id, method, k, result_ids, elapsed_ms)
SELECT
  q.id,
  'exact',
  10,
  array_agg(c.id ORDER BY c.distance),
  0
FROM vector_eval_query q
CROSS JOIN LATERAL (
  SELECT id, embedding <=> q.query_embedding AS distance
  FROM resume_chunk
  WHERE tenant_id = 1001 AND is_deleted = false
  ORDER BY embedding <=> q.query_embedding
  LIMIT 10
) c
GROUP BY q.id;
```

比较两个方法的重合：

```sql
WITH exact AS (
  SELECT query_id, result_ids FROM vector_eval_result
  WHERE method = 'exact' AND k = 10
),
ann AS (
  SELECT query_id, result_ids FROM vector_eval_result
  WHERE method = 'hnsw_ef_100' AND k = 10
)
SELECT
  e.query_id,
  (
    SELECT count(*)
    FROM unnest(e.result_ids) x
    WHERE x = ANY(a.result_ids)
  ) / 10.0 AS recall_at_10
FROM exact e
JOIN ann a USING (query_id);
```

> **重点：** 没有 recall@k 的“优化”只能说明 SQL 变快了，不能说明检索系统变好了。

## 执行计划和诊断

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, content
FROM resume_chunk
WHERE tenant_id = 1001
  AND is_deleted = false
ORDER BY embedding <=> $1
LIMIT 10;
```

向量索引不使用的常见原因：

- 没有 `LIMIT`。
- `ORDER BY` 不是距离操作符本身。
- 使用了相反排序方向。
- 操作符类不匹配，例如建的是 `vector_cosine_ops`，查询却用 L2。
- 表太小，优化器认为顺序扫描更便宜。
- 过滤条件导致普通索引或顺序扫描成本更低。

诊断时可以临时比较：

```sql
BEGIN;
SET LOCAL enable_seqscan = off;
EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM resume_chunk
WHERE tenant_id = 1001
  AND is_deleted = false
ORDER BY embedding <=> $1
LIMIT 10;
COMMIT;
```

> **易错：** 把 `enable_seqscan = off` 当生产优化手段。
>
> 正确做法：它只适合诊断“如果强制走索引会怎样”，最终仍要通过索引、统计信息、查询写法和参数设计解决。

## 生产运维

### 索引构建和写入

向量索引通常比普通 B-tree 更重。构建期间要关注：

- `maintenance_work_mem` 和可用内存。
- `max_parallel_maintenance_workers`。
- `pg_stat_progress_create_index`。
- WAL 产生量和归档压力。
- 复制延迟。
- 是否使用 `CREATE INDEX CONCURRENTLY` 减少写阻塞。

```sql
SELECT phase, tuples_done, tuples_total
FROM pg_stat_progress_create_index;
```

### VACUUM 和膨胀

大量更新 embedding 会生成新行版本，造成 heap、索引、WAL 和复制压力。embedding 通常很大，频繁更新比普通字段更贵。

建议：

- embedding 生成后尽量不可变。
- 需要重算时分批回填。
- 旧模型向量可放新列或新表，验证后切换读路径。
- 监控 `n_dead_tup`、表大小、索引大小和 autovacuum。
- HNSW VACUUM 可能较慢，必要时先 `REINDEX INDEX CONCURRENTLY` 再 `VACUUM`。

### 备份恢复和升级

pgvector 数据和索引属于 PostgreSQL 数据库对象，逻辑备份和物理备份都要覆盖它。但恢复环境必须安装兼容的 pgvector 扩展文件，否则恢复 `CREATE EXTENSION` 或索引对象会失败。

生产检查：

- 记录 PostgreSQL 主版本、pgvector 扩展版本和安装方式。
- 恢复演练环境先安装同版本扩展。
- 升级 PostgreSQL 前检查 pgvector 是否支持目标主版本。
- 扩展升级前在测试库执行 `ALTER EXTENSION vector UPDATE` 并回归核心查询。
- 近似索引在扩展升级或历史版本迁移后，必要时重建并重新评估召回。

### 运行时监控

pgvector 查询本质上仍是 PostgreSQL 查询，所以先用 PostgreSQL 的标准观测入口：

```sql
-- 找出耗时和调用次数都高的向量查询
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows
FROM pg_stat_statements
WHERE query ILIKE '%<=>%'
   OR query ILIKE '%<->%'
   OR query ILIKE '%<#>%'
ORDER BY total_exec_time DESC
LIMIT 20;
```

```sql
-- 查表和索引大小，向量索引增长要单独关注
SELECT
  relname,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS heap_size
FROM pg_stat_user_tables
WHERE relname IN ('resume_chunk');
```

```sql
-- 查 dead tuple，判断 embedding 回填后 autovacuum 是否跟上
SELECT
  relname,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  vacuum_count,
  autovacuum_count
FROM pg_stat_user_tables
WHERE relname = 'resume_chunk';
```

慢查询诊断要把数据库指标和检索质量指标放在一起：

| 指标 | 说明 |
| --- | --- |
| P95/P99 延迟 | 是否满足产品体验 |
| recall@k | 近似检索质量是否下降 |
| 过滤后候选数 | 判断是不是权限、租户、状态过滤导致召回不足 |
| `shared_blks_read` / `hit` | 判断是否大量读盘 |
| `temp_blks_written` | 判断候选重排或混合检索是否排序落盘 |
| WAL 产生量 | 判断批量 embedding 写入是否影响归档和复制 |
| 复制延迟 | 判断向量索引构建或批量写入是否拖慢备库 |

### 常见故障剧本

#### 故障 1：创建 HNSW 后查询仍然慢

排查顺序：

1. `EXPLAIN (ANALYZE, BUFFERS)` 看是否使用 HNSW。
2. 检查 `ORDER BY` 是否是距离操作符升序加 `LIMIT`。
3. 检查 operator class 是否匹配。
4. 检查过滤条件是否导致候选不足或回表过多。
5. 检查 `hnsw.ef_search` 是否过高。
6. 对比精确搜索和近似搜索的 P95 延迟与 recall@k。

常见修复：

- 修正查询写法和 operator class。
- 为过滤条件增加普通索引、部分索引或分区。
- 降低过高的 `ef_search`，同时确认 recall@k 仍达标。
- 对高质量链路先召回更多候选，交给 reranker，而不是无限增大 `ef_search`。

#### 故障 2：结果数量经常少于 `LIMIT 10`

排查顺序：

1. 单独统计过滤条件命中率。
2. 临时提高 `hnsw.ef_search` 或 `ivfflat.probes` 看结果数是否恢复。
3. 尝试 `hnsw.iterative_scan = strict_order` 或 `relaxed_order`。
4. 检查是否有权限、租户、语言、状态过滤组合过窄。

修复方向：

- 使用迭代扫描。
- 对高频低选择率过滤建部分索引。
- 按租户、语言或业务域分区。
- 先按过滤条件缩小候选，再做精确向量排序。

#### 故障 3：批量重算 embedding 后磁盘和 WAL 暴涨

原因是 UPDATE 生成新 tuple、旧 tuple 等待 VACUUM、索引也要维护，WAL 还要复制和归档。

排查：

```sql
SELECT relname, n_tup_upd, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
WHERE relname = 'resume_chunk';

SELECT slot_name, active, restart_lsn
FROM pg_replication_slots;
```

修复方向：

- 改为新表或新列分批回填，避免全表大事务 UPDATE。
- 每批提交后观察 WAL、复制延迟和 autovacuum。
- 新索引用 `CREATE INDEX CONCURRENTLY`，切换查询后再清理旧向量。
- 大规模变更前确认磁盘和归档空间足够。

#### 故障 4：VACUUM HNSW 很慢

HNSW 索引结构复杂，VACUUM 可能比普通索引更慢。官方建议在某些场景下先执行 `REINDEX INDEX CONCURRENTLY`，再 `VACUUM`，以降低后续清理成本。

```sql
REINDEX INDEX CONCURRENTLY idx_resume_chunk_embedding_hnsw;
VACUUM resume_chunk;
```

生产中要评估锁、磁盘、WAL 和复制延迟，不要在事故中直接对大索引重建。

#### 故障 5：扩展升级或恢复失败

常见原因：

- 恢复目标环境没有安装 pgvector。
- 安装的是不同 PostgreSQL 主版本目录下的扩展文件。
- 逻辑备份包含 `CREATE EXTENSION vector`，但目标环境缺控制文件。
- 扩展升级后 operator class 或索引行为变化，未重建或未评测。

检查：

```sql
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'vector';

SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name = 'vector';
```

> **重点：** 扩展是生产依赖。备份恢复文档里必须写 PostgreSQL 主版本、pgvector 版本、安装方式和回归验证步骤。

## 实操任务

### 任务 1：启用扩展并建表

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE resume_chunk (
  id bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL,
  content text NOT NULL,
  embedding vector(3) NOT NULL,
  is_deleted boolean NOT NULL DEFAULT false
);

INSERT INTO resume_chunk (tenant_id, content, embedding) VALUES
(1, 'Java 后端，熟悉 PostgreSQL 慢查询优化', '[0.10,0.20,0.30]'),
(1, '数据工程师，负责 ETL 和报表', '[0.80,0.10,0.20]'),
(1, '数据库工程师，做过索引、VACUUM 和复制排障', '[0.12,0.22,0.33]');
```

### 任务 2：执行精确语义检索

```sql
SELECT id, content, embedding <=> '[0.11,0.21,0.31]' AS distance
FROM resume_chunk
WHERE tenant_id = 1
  AND is_deleted = false
ORDER BY embedding <=> '[0.11,0.21,0.31]'
LIMIT 2;
```

### 任务 3：创建 HNSW 并查看计划

```sql
CREATE INDEX idx_resume_chunk_hnsw
ON resume_chunk
USING hnsw (embedding vector_cosine_ops);

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, content
FROM resume_chunk
WHERE tenant_id = 1
ORDER BY embedding <=> '[0.11,0.21,0.31]'
LIMIT 2;
```

### 任务 4：做召回评测

1. 用精确搜索保存 top 10 结果。
2. 用 HNSW 或 IVFFlat 保存 top 10 结果。
3. 计算两者交集数量。
4. 用 `交集数量 / 10` 作为 recall@10 的最小评估。
5. 调整 `hnsw.ef_search` 或 `ivfflat.probes`，比较延迟和召回。

### 任务 5：验证过滤导致召回不足

1. 构造 10 万条 `resume_chunk`，其中只有 5% 属于 `tenant_id = 1001`。
2. 建一个全局 HNSW 索引。
3. 使用 `WHERE tenant_id = 1001 ORDER BY embedding <=> $1 LIMIT 10` 查询。
4. 分别测试 `hnsw.ef_search = 40`、`100`、`500`。
5. 再建部分索引或按租户分区，对比结果数量、延迟和 recall@10。

### 任务 6：验证量化加重排

1. 为 `binary_quantize(embedding)::bit(...)` 创建 HNSW 索引。
2. 第一阶段取 top 200。
3. 第二阶段用原始 `embedding <=> $1` 重排 top 10。
4. 和原始 HNSW、精确搜索比较 recall@10、P95 延迟和索引大小。

### 任务 7：写一份上线评审报告

报告必须包含：

- 表结构和索引定义。
- 选择余弦、L2 或内积的原因。
- HNSW 或 IVFFlat 参数和评测依据。
- 精确搜索基准和 recall@k。
- P95/P99 延迟。
- 过滤后候选数量分布。
- WAL、磁盘、备份恢复和复制影响。
- 模型升级和 embedding 回滚方案。

## 验收

- 能解释 pgvector 是扩展，不是独立数据库。
- 能安装并启用 `vector` 扩展。
- 能创建包含 `vector(n)` 的业务表。
- 能区分 L2、内积和余弦距离的使用边界。
- 能创建 HNSW 和 IVFFlat 索引，并说明两者取舍。
- 能解释近似索引为什么可能改变结果。
- 能说明过滤条件为什么会影响召回。
- 能设计一个包含租户、权限、文档、chunk、模型版本和 embedding 的 RAG 表结构。
- 能写出生产上线前的召回评测和回滚方案。
- 能解释 operator class、距离操作符、表达式索引和查询写法如何共同决定是否使用索引。
- 能根据过滤命中率估算近似索引候选不足的风险。
- 能设计精确搜索、近似索引、量化召回和重排序的多阶段检索方案。
- 能写出 pgvector 生产故障的排查 SQL 和处置顺序。

## 重点

- PostgreSQL 13 可学习和使用 pgvector，但 PostgreSQL 13 已 EOL，生产要规划升级。
- 向量列的维度、模型版本和预处理方式必须一致。
- `ORDER BY 距离操作符 LIMIT k` 是向量索引命中的关键查询形态。
- HNSW 和 IVFFlat 是近似索引，要用业务评测集验证召回。
- 过滤条件、权限控制和重排序决定 RAG 结果是否真正可用。

## 难点

- 召回率、延迟和资源成本需要用真实数据评估，不能只根据索引类型判断。
- 近似索引和 SQL 过滤组合后，可能出现“索引很快但结果不足”的问题。
- embedding 模型升级是数据迁移问题，不只是改一个 API 参数。
- pgvector 的生产风险横跨数据库运维和 AI 检索质量评估，需要两套指标一起看。

## 易错

> **易错：** 认为创建 HNSW 后查询结果一定和精确搜索相同。
>
> 正确做法：用固定评测集计算 recall@k，并记录参数、数据量和延迟。

> **易错：** 在同一列混存不同模型生成的 embedding。
>
> 正确做法：按模型版本隔离列或表，回填完成并评估后再切换线上查询。

> **易错：** 忽略租户和权限过滤，先做全库向量相似度。
>
> 正确做法：业务硬过滤必须进入检索链路，必要时用分区、部分索引或候选集重排保证质量。

> **易错：** 把向量数据库评估只看 P95 延迟。
>
> 正确做法：同时看 recall@k、人工相关性、权限误召回、上下文重复率、成本、WAL 和复制延迟。

## 参考资料

- pgvector 官方仓库：https://github.com/pgvector/pgvector
