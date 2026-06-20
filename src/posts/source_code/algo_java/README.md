---
title: "algojava"
date: 2026-06-20
description: "基于 算法 目录全部文档生成的 JDK 21 算法项目。"
tags:
  - "source_code"
  - "algo_java"
category: "源码项目"
---

# algo_java

基于 `算法` 目录全部文档生成的 JDK 21 算法项目。

项目不依赖 JUnit/Jacoco 等外部包，使用 JDK 21 自带的 `javac` 和 `java` 即可编译运行。测试框架位于 `src/test/java/com/example/algo`，测试运行器会检查所有算法断言，并验证 51 个文档知识点主题全部命中。

## 运行测试

```powershell
.\scripts\run-tests.ps1
```

等价手动命令：

```powershell
$sources = Get-ChildItem -Recurse -Filter *.java src\main\java,src\test\java | ForEach-Object { $_.FullName }
Remove-Item -Recurse -Force out\test -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path out\test | Out-Null
javac --release 21 -encoding UTF-8 -d out\test $sources
java -cp out\test com.example.algo.TestRunner
```

预期输出：

```text
[PASS] AlgoLibraryTest
All tests passed. Knowledge coverage: 100% (51 topics).
```

## 目录

```text
src/main/java/com/example/algo/
  AlgoLibrary.java       # 算法源码，按文档章节分组
  Coverage.java          # 知识点覆盖追踪器
  CoverageTopic.java     # 51 个文档知识点主题

src/test/java/com/example/algo/
  Assertions.java        # 无依赖断言工具
  AlgoLibraryTest.java   # 单元测试用例
  TestRunner.java        # 测试入口
```

完整文档映射见 `KNOWLEDGE_COVERAGE.md`，测试触发说明见 `TESTING.md`。
