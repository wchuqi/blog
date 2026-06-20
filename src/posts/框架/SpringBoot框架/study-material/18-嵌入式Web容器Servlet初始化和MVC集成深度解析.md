---
title: "Spring Boot 4 学习资料：嵌入式 Web 容器、Servlet 初始化和 MVC 集成深度解析"
date: 2026-06-20
description: "重点： Boot 不需要外部 Tomcat，是因为它把 Web 服务器作为应用内部对象创建和启动。"
tags:
  - "框架"
  - "SpringBoot框架"
  - "深度解析"
category: "框架"
---

# Spring Boot 4 学习资料：嵌入式 Web 容器、Servlet 初始化和 MVC 集成深度解析

[返回索引](../SpringBoot4学习资料.md)

## 学习目标

- 理解 Boot 如何启动嵌入式 Web 容器。
- 掌握 ServletWebServerApplicationContext、WebServerFactory、DispatcherServlet 注册。
- 能排查端口、上下文路径、Filter、Servlet、MVC 映射问题。

## Web 启动主线

```text
SpringApplication 推断 SERVLET
  -> 创建 ServletWebServerApplicationContext
  -> refresh()
      -> onRefresh()
          -> createWebServer()
              -> 获取 ServletWebServerFactory
              -> 创建 Tomcat/Jetty/Undertow
              -> 注册 ServletContextInitializer
              -> 启动 WebServer
```

> **重点：** Boot 不需要外部 Tomcat，是因为它把 Web 服务器作为应用内部对象创建和启动。

## WebServerFactory

常见工厂：

- TomcatServletWebServerFactory。
- JettyServletWebServerFactory。
- UndertowServletWebServerFactory。

自定义端口、上下文路径、压缩、线程等，通常通过配置或定制器完成。

```java
@Bean
WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatCustomizer() {
    return factory -> factory.addConnectorCustomizers(connector ->
        connector.setProperty("relaxedQueryChars", "[]")
    );
}
```

## DispatcherServlet 注册

Boot 会自动注册 DispatcherServlet，并把请求交给 Spring MVC。

```text
HTTP 请求
  -> WebServer
  -> Filter chain
  -> DispatcherServlet
  -> Spring MVC HandlerMapping/HandlerAdapter
```

## Filter、Servlet、Listener 注册

```java
@Bean
FilterRegistrationBean<RequestIdFilter> requestIdFilter() {
    var bean = new FilterRegistrationBean<>(new RequestIdFilter());
    bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
    return bean;
}
```

顺序很重要。安全、日志、编码、CORS、请求 ID 都可能在 Filter 层出现。

## 端口和路径排查

| 现象 | 排查 |
| --- | --- |
| 端口占用 | server.port、启动失败分析 |
| 访问路径不对 | context-path、servlet path、网关前缀 |
| Filter 不执行 | 注册方式、URL pattern、order |
| Controller 404 | 组件扫描、映射条件、DispatcherServlet |

## 练习

1. 修改 `server.port` 和 `server.servlet.context-path`。
2. 自定义 Filter 打印 requestId。
3. 自定义 Tomcat 连接器参数。
4. 同时配置 context-path 和网关前缀，记录最终访问路径。

## 验收

- 能解释 Boot 嵌入式服务器启动链路。
- 能定位端口、路径和 Filter 顺序问题。
- 能说明 Web 容器和 Spring MVC 的边界。
