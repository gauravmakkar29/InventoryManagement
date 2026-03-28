# IMS Gen2 E2E Test Automation Framework

End-to-end test automation framework for the IMS (Inventory Management System) platform. Based on the [Novus](https://github.com/nickvdyck/novus) framework originally created by 3PillarGlobal.

## Tech Stack

- **Java 17**
- **Maven** (multi-module build)
- **TestNG** (test runner)
- **Playwright** (browser automation)
- **Spring Boot 3.2** (dependency injection, configuration profiles)
- **ExtentReports** (HTML test reporting)
- **Lombok**, **Jackson**, **AssertJ**, **Hamcrest**

## Module Overview

| Module | Purpose |
|---|---|
| `ims-core` | Core abstractions: Actor pattern, DSL actions, annotations, assertions, utilities, reporting |
| `ims-core-ui` | UI/browser layer: Playwright browser management, page actions (Click, Type, Select, etc.), locator strategies, verification |
| `ims-core-api` | API layer: REST client driver, HTTP method wrappers (GET, POST, PUT, DELETE), JSON utilities |

## Architecture

- **Actor/DSL pattern** -- tests read like plain English: `actor.attemptsTo(Click.on(BUTTON))`
- **3-layer page objects** -- Pages (locators) / Impls (action compositions) / Macros (high-level flows)
- **Spring profiles** -- `application-web.properties` for browser config, `application-test.properties` for environment config

## How to Run

```bash
mvn clean test
```

To run a specific TestNG suite:

```bash
mvn clean test -DsuiteXmlFile=suite.xml
```

## Configuration

- Browser settings: `ims-core-ui/src/main/resources/application-web.properties`
- Create an `application-local.properties` in your test resources to override browser settings for local debugging (e.g., headed mode).

## Writing Tests

- **UI/Hybrid tests**: extend `NovusGuiTestBase` with `@ActiveProfiles({"web", "test"})`
- **API tests**: extend `NovusApiTestBase` with `@ActiveProfiles({"web", "test"})`
- Custom actions: implement the `Performable` interface
